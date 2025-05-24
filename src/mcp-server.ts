import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

export function createMcpServer(): Server {
  const server = new Server(
    {
      name: "mcp-server-boilerplate",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  );

  // Define tools that can be called by MCP clients like Cursor IDE
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "hello_world",
          description: "Returns a greeting message",
          inputSchema: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "Name to greet (optional)",
              },
            },
            required: [],
          },
        },
        // Add more tools here following the same pattern
        // {
        //   name: "your_tool_name",
        //   description: "Description of what your tool does",
        //   inputSchema: {
        //     type: "object",
        //     properties: {
        //       // Define your tool's input parameters here
        //     },
        //     required: ["required_param"],
        //   },
        // },
      ],
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "hello_world": {
        const nameToGreet = args?.name as string;
        const greeting = nameToGreet
          ? `Hello, ${nameToGreet}! Welcome to your MCP server.`
          : "Hello, World! Your MCP server is working correctly.";

        return {
          content: [
            {
              type: "text",
              text: greeting,
            },
          ],
        };
      }

      // Add more tool implementations here
      // case "your_tool_name": {
      //   const param = args?.your_param as string;
      //
      //   try {
      //     // Your tool logic here
      //     const result = processYourTool(param);
      //
      //     return {
      //       content: [
      //         {
      //           type: "text",
      //           text: `Result: ${result}`,
      //         },
      //       ],
      //     };
      //   } catch (error) {
      //     return {
      //       content: [
      //         {
      //           type: "text",
      //           text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      //         },
      //       ],
      //       isError: true,
      //     };
      //   }
      // }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  });

  // Define resources that can be read by MCP clients
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: [
        {
          uri: "boilerplate://info",
          name: "Boilerplate Information",
          description: "Information about this MCP server boilerplate",
          mimeType: "text/plain",
        },
        // Add more resources here following the same pattern
        // {
        //   uri: "your-scheme://resource-id",
        //   name: "Your Resource Name",
        //   description: "Description of your resource",
        //   mimeType: "text/plain", // or "application/json", etc.
        // },
      ],
    };
  });

  // Handle resource reads
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    switch (uri) {
      case "boilerplate://info":
        return {
          contents: [
            {
              uri,
              mimeType: "text/plain",
              text: "This is a production-ready MCP server boilerplate built with Fastify, TypeScript, and modern tooling. Use this as a starting point for your own MCP servers.",
            },
          ],
        };

      // Add more resource implementations here
      // case "your-scheme://resource-id":
      //   return {
      //     contents: [
      //       {
      //         uri,
      //         mimeType: "text/plain", // or "application/json"
      //         text: "Your resource content here",
      //       },
      //     ],
      //   };

      default:
        throw new Error(`Unknown resource: ${uri}`);
    }
  });

  return server;
}
