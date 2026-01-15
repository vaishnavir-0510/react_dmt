# Quick Reference Guide

## 🔐 Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/v3/login/` | User login |
| POST | `/auth/v3/refresh_token` | Refresh access token |
| POST | `/auth/v3/logout/` | User logout |
| GET | `/auth/v3/user/` | Get user profile |

## 📍 Route Quick Reference

### Public Routes
- `/login` - Login page

### Migration Routes (Default)
- `/dashboard` - Main dashboard
- `/entities` - Entities management
- `/management` - Management tools
- `/migration` - Migration layout
- `/migration/:objectId` - Migration with object
- `/migration/:objectId/:tabName` - Migration with tab

**Migration Tabs**: `summary`, `relationship`, `filter`, `metadata`, `cleanup`, `transform`, `mapping`, `validate`, `load`, `error`, `workflows`

### Backup Routes
- `/backup/dashboard`
- `/backup/jobs`
- `/backup/restore`
- `/backup/history`

### Translation Routes
- `/translation/dashboard`
- `/translation/languages`
- `/translation/memory`
- `/translation/progress`
- `/translation/translations`

### File Migration Routes
- `/file-migration/upload`
- `/file-migration/relationship`
- `/file-migration/filter`
- `/file-migration/metadata`
- `/file-migration/cleanup`
- `/file-migration/transform`
- `/file-migration/mapping`
- `/file-migration/validate`
- `/file-migration/load`
- `/file-migration/error`
- `/file-migration/workflows`

### Settings Routes
- `/account`
- `/users`
- `/projects`

## 🔑 localStorage Keys

| Key | Purpose |
|-----|---------|
| `accessToken` | JWT access token |
| `refreshToken` | JWT refresh token |
| `lastActivity` | Last activity timestamp |
| `app_state` | Redux app slice state |
| `migration_state` | Redux migration slice state |
| `sidebar_session` | Sidebar expanded state |
| `migration_objects` | Cached migration objects |
| `local_workspace_project` | Last selected project ID |

## 📦 Redux Store Structure

```typescript
{
  auth: {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
  },
  app: {
    selectedProject: Project | null;
    selectedEnvironment: Environment | null;
    selectedSystem: System | null;
    isSidebarOpen: boolean;
    activeMenu: string;
    isSettingsMenuOpen: boolean;
    currentView: 'application' | 'settings';
    currentApp: 'migration' | 'backup' | 'translation' | 'file migration' | null;
  },
  migration: {
    selectedObject: MigrationObject | null;
    activeTab: MigrationTab;
    migrationName: string;
    // ... tab-specific data
  },
  // ... 36 RTK Query API slices
}
```

## 🎯 Project Types

1. **migration** - Data migration workflows
2. **backup** - Backup and restore operations
3. **translation** - Translation management
4. **file migration** - File-based data migration

## ⏱️ Session Timeouts

- **Token Expiry**: 30 minutes
- **Token Refresh**: Automatic at 25 minutes
- **Idle Warning**: 14 minutes
- **Idle Logout**: 15 minutes (60-second countdown)

## 🔄 API Base URL

Set via environment variable: `VITE_API_BASE_URL`

## 📝 Key Hooks

- `useAuth()` - Authentication operations
- `useWorkspace()` - Workspace and project management
- `useIdleTimerHook()` - Idle session management

## 🛡️ Security Features

1. JWT token authentication
2. Automatic token refresh
3. Protected routes
4. Idle session management
5. Activity tracking
6. Secure logout with localStorage cleanup

