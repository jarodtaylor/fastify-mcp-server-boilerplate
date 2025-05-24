import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node18",
  platform: "node",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  minify: process.env.NODE_ENV === "production",
  bundle: true,
  splitting: false,
  treeshake: true,
  dts: true, // Generate .d.ts files
  external: [
    // Don't bundle these dependencies
    "@modelcontextprotocol/sdk",
    "fastify",
    "fastify-mcp",
  ],
  esbuildOptions(options) {
    // Preserve function names for better debugging
    options.keepNames = true;
  },
  onSuccess: async () => {
    console.log("✅ Build successful");
  },
}); 