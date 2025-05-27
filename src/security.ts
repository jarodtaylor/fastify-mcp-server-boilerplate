/**
 * Security utilities for MCP server
 * Addresses command injection, input validation, and other security concerns
 */

import { z } from "zod";

// Common dangerous patterns that could indicate command injection attempts
const DANGEROUS_PATTERNS = [
  /[;&|`$(){}[\]\\]/g, // Shell metacharacters
  /\b(eval|exec|system|spawn|fork)\b/gi, // Dangerous function names
  /\b(rm|del|format|shutdown|reboot)\b/gi, // Dangerous commands
  /(\.\.\/|\.\.\\)/g, // Path traversal
  /[<>]/g, // Potential for file redirection
];

// File path validation regex
const SAFE_PATH_PATTERN = /^[a-zA-Z0-9._/-]+$/;

/**
 * Validates and sanitizes string input to prevent command injection
 */
export function sanitizeInput(input: string, maxLength = 1000): string {
  if (typeof input !== "string") {
    throw new Error("Input must be a string");
  }

  if (input.length > maxLength) {
    throw new Error(`Input too long. Maximum length: ${maxLength}`);
  }

  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(input)) {
      throw new Error("Input contains potentially dangerous characters or commands");
    }
  }

  // Basic sanitization - remove any remaining potentially dangerous characters
  return input.replace(/[^\w\s.-]/g, "").trim();
}

/**
 * Validates file paths to prevent path traversal attacks
 */
export function validateFilePath(path: string): string {
  if (!path || typeof path !== "string") {
    throw new Error("Invalid file path");
  }

  const normalizedPath = path.normalize();

  // Check for path traversal attempts
  if (normalizedPath.includes("..") || normalizedPath.includes("~")) {
    throw new Error("Path traversal detected");
  }

  // Check against safe pattern
  if (!SAFE_PATH_PATTERN.test(normalizedPath)) {
    throw new Error("Invalid characters in file path");
  }

  return normalizedPath;
}

/**
 * Validates URLs to prevent SSRF attacks
 */
export function validateUrl(url: string, allowedSchemes = ["http", "https"]): URL {
  try {
    const parsed = new URL(url);
    
    if (!allowedSchemes.includes(parsed.protocol.replace(":", ""))) {
      throw new Error(`URL scheme not allowed: ${parsed.protocol}`);
    }

    // Block private/internal IP ranges
    if (parsed.hostname === "localhost" || 
        parsed.hostname === "127.0.0.1" || 
        parsed.hostname.startsWith("192.168.") ||
        parsed.hostname.startsWith("10.") ||
        parsed.hostname.startsWith("172.")) {
      throw new Error("Access to private/internal URLs not allowed");
    }

    return parsed;
  } catch (error) {
    throw new Error(`Invalid URL: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Rate limiting map to track requests by identifier
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/**
 * Simple rate limiting check
 */
export function checkRateLimit(
  identifier: string, 
  maxRequests = 100, 
  windowMs = 60000
): boolean {
  const now = Date.now();
  const current = rateLimitMap.get(identifier);

  if (!current || now > current.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (current.count >= maxRequests) {
    return false;
  }

  current.count++;
  return true;
}

/**
 * Clean up expired rate limit entries
 */
export function cleanupRateLimit(): void {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

/**
 * Zod schemas for common input validation
 */
export const SecuritySchemas = {
  safeString: z.string().min(1).max(1000).refine(
    (val) => {
      try {
        sanitizeInput(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: "String contains unsafe characters" }
  ),

  filePath: z.string().refine(
    (val) => {
      try {
        validateFilePath(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: "Invalid or unsafe file path" }
  ),

  httpUrl: z.string().url().refine(
    (val) => {
      try {
        validateUrl(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: "Invalid or unsafe URL" }
  ),
};

/**
 * Audit log for security events
 */
export interface SecurityEvent {
  timestamp: string;
  event: string;
  identifier: string;
  details: Record<string, unknown>;
  severity: "low" | "medium" | "high" | "critical";
}

const securityLog: SecurityEvent[] = [];

export function logSecurityEvent(event: Omit<SecurityEvent, "timestamp">): void {
  securityLog.push({
    ...event,
    timestamp: new Date().toISOString(),
  });

  // Keep only last 1000 events to prevent memory leak
  if (securityLog.length > 1000) {
    securityLog.shift();
  }
}

export function getSecurityLog(): SecurityEvent[] {
  return [...securityLog];
} 