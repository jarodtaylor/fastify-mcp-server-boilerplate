# Tooling Configuration

This project uses TypeScript and Biome together for optimal developer experience. Here's how they're configured to work harmoniously.

## Tools Overview

- **TypeScript**: Type checking and compilation
- **Biome**: Linting, formatting, and import organization
- **tsx**: Development runtime with hot reload

## Configuration Philosophy

### TypeScript (tsconfig.json)
- **Strict type checking** enabled for code quality
- **ESNext modules** for modern JavaScript features
- **`noPropertyAccessFromIndexSignature: false`** to allow dot notation on index signatures (compatible with Biome's `useLiteralKeys`)
- **Source maps and declarations** for debugging and library usage

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
npm run dev          # Start with hot reload
npm run type-check   # TypeScript validation only
npm run check        # Biome linting/formatting check
npm run fix-all      # Fix all auto-fixable issues

# Production
npm run build        # Compile TypeScript
npm run start        # Run compiled JavaScript

# CI/CD
npm run ci           # Full validation + build
npm run validate     # Type check + lint check
```

### Recommended Workflow
1. **Development**: `npm run dev` for hot reload
2. **Before commit**: `npm run fix-all` to auto-fix issues
3. **Pre-push**: `npm run ci` to ensure everything builds

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
- **Use incremental compilation** with TypeScript project references for large projects
- **Enable Biome's incremental mode** for faster linting on large codebases
- **Configure file watchers** appropriately to avoid unnecessary rebuilds 