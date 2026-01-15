# Environment Configuration Guide

This React application uses an environment configuration system similar to the Dart implementation, supporting multiple environments: **dev**, **qa**, **uat**, and **prod**.

## 📁 Configuration Files

### Environment Files

- **`.env`** - Default/development environment (local development)
- **`.env.development`** - Development environment config
- **`.env.qa`** - QA environment config  
- **`.env.uat`** - UAT environment config
- **`.env.production`** - Production environment config
- **`.env.example`** - Template file (committed to git)

### Configuration Module

**`src/config/environmentConfig.ts`** - TypeScript module providing environment configuration utilities.

## 🚀 Usage

### Running Different Environments

#### Development (default)
```bash
npm run dev
# or explicitly
npm run dev  # uses .env.development
```

#### QA Environment
```bash
npm run dev:qa
```

#### UAT Environment
```bash
npm run dev:uat
```

#### Production (local preview)
```bash
npm run dev:prod
```

### Building for Different Environments

```bash
# Development build
npm run build

# QA build
npm run build:qa

# UAT build
npm run build:uat

# Production build
npm run build:prod
```

## 📝 Environment Variables

### Available Variables

| Variable | Description | Default (if not set) |
|----------|-------------|---------------------|
| `VITE_ENVIRONMENT` | Environment name: `dev`, `qa`, `uat`, `prod` | `dev` |
| `VITE_API_BASE_URL` | HTTP API base URL | Environment-based default |
| `VITE_WS_BASE_URL` | WebSocket base URL | Environment-based default |

### Environment-Based Defaults

When `VITE_API_BASE_URL` or `VITE_WS_BASE_URL` are not explicitly set, the config uses these defaults:

#### Development (`dev`)
- **HTTP**: `https://api-dev.datamatter.tech`
- **WebSocket**: `wss://api-dev.datamatter.tech`

#### QA
- **HTTP**: `https://api-qa.datamatter.tech`
- **WebSocket**: `wss://api-qa.datamatter.tech`

#### UAT
- **HTTP**: `https://uat.datamatter.tech`
- **WebSocket**: `wss://uat.datamatter.tech`

#### Production (`prod`)
- **HTTP**: `https://api.datamatter.tech`
- **WebSocket**: `wss://api.datamatter.tech`

## 💻 Using in Code

### Basic Usage

```typescript
import { EnvironmentConfig } from '../config/environmentConfig';

// Get current environment
const env = EnvironmentConfig.environment; // 'dev', 'qa', 'uat', or 'prod'

// Environment checks
if (EnvironmentConfig.isDevelopment) {
  console.log('Running in development mode');
}

// Get base URLs
const apiUrl = EnvironmentConfig.baseUrl;
const wsUrl = EnvironmentConfig.webSocketUrl;

// Build full URLs
const endpointUrl = EnvironmentConfig.getUrl('/api/users');
const wsEndpointUrl = EnvironmentConfig.getWebSocketUrlForEndpoint('/ws/notifications');
```

### Using in API Services

**Recommended approach** (using EnvironmentConfig):
```typescript
import { EnvironmentConfig } from '../config/environmentConfig';

export const myApi = createApi({
  reducerPath: 'myApi',
  baseQuery: fetchBaseQuery({
    baseUrl: EnvironmentConfig.baseUrl,
    // ... rest of config
  }),
  // ...
});
```

**Legacy approach** (still works):
```typescript
// This still works and will use environment config defaults
baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://api-dev.datamatter.tech',
```

### Individual Functions

You can also use individual exported functions:

```typescript
import { 
  getEnvironment, 
  getBaseUrl, 
  getWebSocketUrl,
  isDevelopment,
  isProduction 
} from '../config/environmentConfig';

const env = getEnvironment();
const apiUrl = getBaseUrl();
```

## 🔧 Local Development Setup

1. **Copy the example file** (if `.env` doesn't exist):
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env`** to match your local setup:
   ```env
   VITE_ENVIRONMENT=dev
   VITE_API_BASE_URL=https://api-dev.datamatter.tech
   VITE_WS_BASE_URL=wss://api-dev.datamatter.tech
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

## 📦 File Structure

```
react_dmt/
├── .env                    # Local development (gitignored)
├── .env.development        # Development config
├── .env.qa                 # QA config
├── .env.uat                # UAT config
├── .env.production         # Production config
├── .env.example            # Template (committed)
└── src/
    └── config/
        └── environmentConfig.ts  # Configuration module
```

## 🎯 Migration from Old Approach

If you have API services using `import.meta.env.VITE_API_BASE_URL` directly, you can optionally migrate to use `EnvironmentConfig`:

**Before:**
```typescript
baseUrl: import.meta.env.VITE_API_BASE_URL,
```

**After:**
```typescript
import { EnvironmentConfig } from '../config/environmentConfig';

baseUrl: EnvironmentConfig.baseUrl,
```

**Note**: The old approach still works! The `EnvironmentConfig` module respects `VITE_API_BASE_URL` if set, or falls back to environment-based defaults.

## ⚠️ Important Notes

1. **Environment files are gitignored** (except `.env.example` and specific `.env.{mode}` files for reference)
2. **Always use `VITE_` prefix** for environment variables that need to be exposed to the client
3. **Restart the dev server** after changing environment variables
4. **Build mode determines which `.env.{mode}` file is loaded** - `.env.development` for dev mode, `.env.production` for production builds, etc.

## 🔍 Verifying Configuration

To verify which environment and URLs are being used, add this to your code temporarily:

```typescript
import { EnvironmentConfig } from '../config/environmentConfig';

console.log('Environment:', EnvironmentConfig.environment);
console.log('API Base URL:', EnvironmentConfig.baseUrl);
console.log('WebSocket URL:', EnvironmentConfig.webSocketUrl);
```

