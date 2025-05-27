/**
 * Security middleware for MCP server
 * Addresses authentication, rate limiting, and request validation
 */

import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { checkRateLimit, cleanupRateLimit, logSecurityEvent } from "./security.js";

export interface SecurityConfig {
  enableAuth: boolean;
  apiKey: string | undefined;
  enableRateLimit: boolean;
  maxRequestsPerMinute: number;
  enableRequestLogging: boolean;
  trustedOrigins: string[];
}

/**
 * Get client IP from request, handling proxies
 */
function getClientIP(request: FastifyRequest): string {
  const forwarded = request.headers["x-forwarded-for"];
  const realIp = request.headers["x-real-ip"];
  
  if (typeof forwarded === "string") {
    const firstIP = forwarded.split(",")[0];
    return firstIP?.trim() ?? "unknown";
  }
  
  if (typeof realIp === "string") {
    return realIp;
  }
  
  return request.ip ?? "unknown";
}

/**
 * Authentication middleware
 */
export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
  config: SecurityConfig
): Promise<void> {
  if (!config.enableAuth || !request.url.startsWith("/mcp")) {
    return;
  }

  const authHeader = request.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    logSecurityEvent({
      event: "authentication_failed",
      identifier: getClientIP(request),
      details: { 
        url: request.url, 
        userAgent: request.headers["user-agent"],
        reason: "missing_or_invalid_header"
      },
      severity: "medium",
    });
    
    reply.status(401).send({ 
      error: "Unauthorized", 
      message: "Missing or invalid authorization header" 
    });
    return;
  }

  const token = authHeader.slice(7);
  if (token !== config.apiKey) {
    logSecurityEvent({
      event: "authentication_failed", 
      identifier: getClientIP(request),
      details: { 
        url: request.url,
        userAgent: request.headers["user-agent"],
        reason: "invalid_token"
      },
      severity: "high",
    });
    
    reply.status(403).send({ 
      error: "Forbidden", 
      message: "Invalid API key" 
    });
    return;
  }
}

/**
 * Rate limiting middleware
 */
export async function rateLimitMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
  config: SecurityConfig
): Promise<void> {
  if (!config.enableRateLimit) {
    return;
  }

  const clientIP = getClientIP(request);
  
  if (!checkRateLimit(clientIP, config.maxRequestsPerMinute, 60000)) {
    logSecurityEvent({
      event: "rate_limit_exceeded",
      identifier: clientIP,
      details: { 
        url: request.url,
        userAgent: request.headers["user-agent"]
      },
      severity: "medium",
    });
    
    reply.status(429).send({ 
      error: "Too Many Requests", 
      message: "Rate limit exceeded. Please try again later.",
      retryAfter: 60
    });
    return;
  }
}

/**
 * CORS middleware for MCP endpoints
 */
export async function corsMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
  config: SecurityConfig
): Promise<void> {
  const origin = request.headers.origin;
  
  // Only apply CORS to MCP endpoints
  if (!request.url.startsWith("/mcp")) {
    return;
  }

  // Check if origin is in trusted list
  if (origin && config.trustedOrigins.length > 0) {
    if (config.trustedOrigins.includes(origin)) {
      reply.header("Access-Control-Allow-Origin", origin);
    } else {
      logSecurityEvent({
        event: "untrusted_origin_blocked",
        identifier: getClientIP(request),
        details: { 
          origin,
          url: request.url
        },
        severity: "medium",
      });
      
      reply.status(403).send({ 
        error: "Forbidden", 
        message: "Origin not allowed" 
      });
      return;
    }
  }
  
  reply.header("Access-Control-Allow-Credentials", "true");
  reply.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  reply.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

/**
 * Request logging middleware
 */
export async function requestLoggingMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply,
  config: SecurityConfig
): Promise<void> {
  if (!config.enableRequestLogging) {
    return;
  }
  
  // Log incoming request
  request.log.info({
    method: request.method,
    url: request.url,
    userAgent: request.headers["user-agent"],
    ip: getClientIP(request),
    requestId: request.id,
  }, "Incoming request");
}

/**
 * Content Security Policy middleware
 */
export async function cspMiddleware(
  _request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Apply CSP headers to protect against XSS
  reply.header("Content-Security-Policy", 
    "default-src 'self'; " +
    "script-src 'self'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data:; " +
    "font-src 'self'; " +
    "connect-src 'self'; " +
    "frame-ancestors 'none';"
  );
  
  reply.header("X-Content-Type-Options", "nosniff");
  reply.header("X-Frame-Options", "DENY");
  reply.header("X-XSS-Protection", "1; mode=block");
  reply.header("Referrer-Policy", "strict-origin-when-cross-origin");
}

/**
 * Register all security middleware with Fastify
 */
export function registerSecurityMiddleware(
  app: FastifyInstance,
  config: SecurityConfig
): void {
  // Security headers for all requests
  app.addHook("onRequest", cspMiddleware);
  
  // Request logging
  app.addHook("onRequest", async (request, reply) => {
    await requestLoggingMiddleware(request, reply, config);
  });
  
  // CORS handling
  app.addHook("onRequest", async (request, reply) => {
    await corsMiddleware(request, reply, config);
  });
  
  // Rate limiting
  app.addHook("onRequest", async (request, reply) => {
    await rateLimitMiddleware(request, reply, config);
  });
  
  // Authentication
  app.addHook("onRequest", async (request, reply) => {
    await authMiddleware(request, reply, config);
  });

  // Clean up rate limit entries periodically
  setInterval(() => {
    cleanupRateLimit();
  }, 300000); // Every 5 minutes
} 