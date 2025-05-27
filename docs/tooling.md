# Tooling Configuration

This project uses TypeScript and Biome together for optimal developer experience. Here's how they're configured to work harmoniously.

## Tools Overview

- **TypeScript**: Type checking and compilation
- **tsup (esbuild)**: Fast bundling, compilation, and development with hot reload
- **Biome**: Linting, formatting, and import organization

## Configuration Philosophy

### TypeScript (tsconfig.json)
- **Strict type checking** enabled for code quality
- **ESNext modules** for modern JavaScript features
- **`noPropertyAccessFromIndexSignature: false`** to allow dot notation on index signatures (compatible with Biome's `useLiteralKeys`)
- **Source maps and declarations** for debugging and library usage

### tsup (tsup.config.ts)
- **esbuild-powered** for extremely fast builds (~40ms)
- **Tree shaking and minification** in production builds
- **Watch mode** with automatic restart for development
- **Source maps** enabled for debugging
- **ESM output** with proper module resolution

### Biome (biome.json)
- **Comprehensive linting rules** covering correctness, performance, and style
- **`useLiteralKeys: warn`** instead of error to avoid conflicts with TypeScript
- **Automatic import organization** enabled
- **Consistent formatting** with 2-space indentation and semicolons

## IDE Integration

### VSCode Setup
The `.vscode/` directory contains:
- **settings.json**: Configures Biome as the default formatter and enables TypeScript validation
- **extensions.json**: Recommends Biome and TypeScript extensions, excludes conflicting ones

### Key Settings
```json
{
  "editor.defaultFormatter": "@biomejs/biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "quickfix.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  }
}
```

## Development Workflow

### Available Scripts
```bash
# Development
npm run dev          # tsup watch mode with auto-restart on changes
npm run dev:debug    # Development with Node.js inspector for debugging
npm run type-check   # TypeScript validation only (no compilation)

# Building
npm run build        # Fast build with tsup (development mode)
npm run build:prod   # Production build with minification and tree shaking
npm run clean        # Remove dist directory

# Code Quality
npm run check        # Biome linting/formatting check
npm run check:fix    # Auto-fix Biome issues
npm run lint         # Biome linting only
npm run lint:fix     # Auto-fix linting issues
npm run format       # Biome formatting check
npm run format:fix   # Auto-fix formatting issues
npm run fix-all      # Fix all auto-fixable issues + type check

# Production
npm run start        # Run compiled JavaScript from dist/

# CI/CD
npm run ci           # Full validation + production build
npm run validate     # Type check + lint check
```

### Recommended Workflow
1. **Development**: `npm run dev` for fast tsup watch mode with auto-restart
2. **Debugging**: `npm run dev:debug` to attach Node.js inspector
3. **Before commit**: `npm run fix-all` to auto-fix issues and type check
4. **Pre-push**: `npm run ci` to ensure production build succeeds

## Conflict Resolution

### Common Conflicts and Solutions

#### 1. Index Signature Access
- **Problem**: TypeScript wants `obj["key"]`, Biome prefers `obj.key`
- **Solution**: Set `noPropertyAccessFromIndexSignature: false` in TypeScript and `useLiteralKeys: warn` in Biome

#### 2. Import Organization
- **Problem**: Different import sorting preferences
- **Solution**: Let Biome handle all import organization with `source.organizeImports.biome`

#### 3. Formatting Conflicts
- **Problem**: Multiple formatters competing
- **Solution**: Disable other formatters in IDE, use only Biome

### Rule Alignment

| Concern | TypeScript Setting | Biome Rule | Resolution |
|---------|-------------------|------------|------------|
| Unused variables | `noUnusedLocals: true` | `noUnusedVariables: error` | ✅ Aligned |
| Any type | N/A | `noExplicitAny: warn` | ✅ Biome catches |
| Index access | `noPropertyAccessFromIndexSignature: false` | `useLiteralKeys: warn` | ✅ Compatible |
| Unreachable code | `allowUnreachableCode: false` | `noUnreachable: error` | ✅ Aligned |

## Troubleshooting

### IDE Issues
1. **Biome not formatting**: Check extension is installed and enabled
2. **TypeScript errors not showing**: Ensure TypeScript extension is active
3. **Conflicting formatters**: Disable Prettier/ESLint extensions

### Build Issues
1. **Type errors in CI**: Run `npm run type-check` locally first
2. **Linting failures**: Run `npm run check:fix` to auto-fix
3. **Import errors**: Let Biome organize imports with `source.organizeImports.biome`

### Performance Tips
- **Large codebases**: Exclude `dist/` and `node_modules/` in IDE settings
- **Slow formatting**: Check Biome LSP binary path in settings
- **Memory usage**: Close unused TypeScript language servers

## Best Practices

### Code Style
- **Use explicit types** where TypeScript inference isn't clear
- **Prefer const assertions** (`as const`) for readonly data
- **Use meaningful variable names** to reduce need for type annotations
- **Organize imports** by letting Biome handle grouping and sorting

### Error Handling
- **Handle all promise rejections** (TypeScript + Biome both check)
- **Use proper error types** instead of `any`
- **Validate function parameters** especially from external sources

### Performance
- **tsup + esbuild**: Extremely fast builds (~40ms) and small bundles (~3.6KB minified)
- **Watch mode efficiency**: Only rebuilds changed files with instant restart
- **Biome speed**: Much faster than ESLint/Prettier combination
- **TypeScript**: Used only for type checking, not compilation (tsup handles that)
- **Configure file watchers** appropriately to avoid unnecessary rebuilds

### Build Performance Comparison
| Tool | Build Time | Bundle Size | Watch Mode |
|------|------------|-------------|------------|
| tsup (current) | ~40ms | ~3.6KB min | ⚡ Instant |
| tsc | ~2-5s | Larger | 🐌 Slow |
| webpack | ~1-3s | Larger | 🐌 Slow | 