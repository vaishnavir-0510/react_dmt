# Comprehensive Application Analysis - DMT (Data Migration Tool)

## 📋 Table of Contents
1. [Application Overview](#application-overview)
2. [Authentication & Session Management](#authentication--session-management)
3. [Routing Structure](#routing-structure)
4. [State Management (Redux)](#state-management-redux)
5. [API Services Architecture](#api-services-architecture)
6. [UI Components & Layout](#ui-components--layout)
7. [Environment Configuration](#environment-configuration)
8. [Key Features & Modules](#key-features--modules)
9. [Session Persistence](#session-persistence)
10. [Security Features](#security-features)

---

## Application Overview

### Tech Stack
- **Framework**: React 19.1.1 with TypeScript 5.9.3
- **Build Tool**: Vite 7.1.7
- **UI Library**: Material-UI (MUI) v5.18.0
- **State Management**: Redux Toolkit 2.9.2
- **Routing**: React Router DOM 7.9.5
- **Form Handling**: React Hook Form 7.65.0 + Yup 1.7.1
- **HTTP Client**: Axios 1.13.1
- **Charts**: Recharts 3.3.0
- **Idle Timer**: react-idle-timer 5.7.2

### Application Type
Multi-tenant Data Migration & Management Platform supporting:
- **Migration Projects**: Data migration workflows
- **Backup Projects**: Backup and restore operations
- **Translation Projects**: Translation management
- **File Migration Projects**: File-based data migration

---

## Authentication & Session Management

### 1. Login Flow

**Entry Point**: `src/pages/Login.tsx` → `src/components/auth/LoginForm.tsx`

**Login Process**:
1. User submits credentials (username, password, domain_name)
2. `useAuth` hook calls `authApi.login` mutation
3. API endpoint: `POST /auth/v3/login/`
4. On success:
   - Access token and refresh token stored in localStorage
   - Tokens stored in Redux state (`authSlice`)
   - User redirected to appropriate dashboard based on project type
5. On failure: Error displayed in LoginForm

**Login Credentials Interface**:
```typescript
interface LoginCredentials {
  username: string;
  password: string;
  domain_name: string; // e.g., paas, dev, staging, prod
}
```

**Auth Response**:
```typescript
interface AuthResponse {
  message: string;
  access_token: string;
  refresh_token: string;
  token_type: string;
  user_id: string;
}
```

### 2. Token Management

**Token Storage**:
- `accessToken`: Stored in localStorage and Redux state
- `refreshToken`: Stored in localStorage and Redux state
- Token validation on app initialization checks JWT expiry

**Token Refresh Mechanism**:
- **Automatic Refresh**: Proactive refresh at 25 minutes (5 mins before 30 min expiry)
- **On 401 Error**: Automatic token refresh via `baseQueryWithReauth` interceptor
- **Refresh Endpoint**: `POST /auth/v3/refresh_token`
- Implemented in: `src/store/api/authApi.ts` and `src/hooks/useIdleTimer.ts`

**Token Validation**:
```typescript
// Checks JWT expiry from token payload
const isValidToken = (token: string | null): boolean => {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};
```

### 3. Idle Session Management

**Implementation**: `src/hooks/useIdleTimer.ts`

**Features**:
- **Idle Timeout**: 14 minutes of inactivity triggers warning dialog
- **Countdown**: 60-second countdown before automatic logout
- **Activity Tracking**: Monitors mouse, keyboard, scroll, touch events
- **Dialog**: `IdleTimeoutDialog` component shows warning with "Stay Active" or "Logout Now" options

**Idle Timer Configuration**:
```typescript
{
  timeout: 14 * 60 * 1000, // 14 minutes
  throttle: 500,
  events: ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'wheel', 'click']
}
```

### 4. Logout Flow

**Process**:
1. User clicks logout button in Header
2. `useAuth.logout()` called
3. API call: `POST /auth/v3/logout/`
4. Redux `logout` action dispatched:
   - Clears all auth state
   - Clears localStorage completely
5. Redirect to `/login`

**Logout Implementation**: `src/hooks/useAuth.ts` and `src/components/layout/Header.tsx`

### 5. Protected Routes

**Component**: `src/components/auth/ProtestedRoute.tsx`

**Protection Logic**:
- Checks `isAuthenticated` from Redux state
- Redirects to `/login` if not authenticated
- Syncs Redux state with current route on navigation
- Handles view switching (application ↔ settings)

**Route Categories**:
- **Settings Routes**: `/account`, `/users`, `/projects`
- **Application Routes**: `/dashboard`, `/entities`, `/management`, `/migration/*`, `/backup/*`, `/translation/*`, `/file-migration/*`

---

## Routing Structure

### Main Router Configuration
**File**: `src/App.tsx`

### Route Definitions

#### 1. Public Routes
- `/login` - Login page (redirects to dashboard if authenticated)

#### 2. Migration Routes (Default Project Type)
- `/dashboard` - Main dashboard
- `/entities` - Entities management
- `/management` - Management tools
- `/migration` - Migration layout (no object selected)
- `/migration/:objectId` - Migration layout with object
- `/migration/:objectId/:tabName` - Migration layout with object and specific tab

**Migration Tabs** (11 tabs):
1. `summary` - Object summary
2. `relationship` - Relationship mapping
3. `filter` - Data filtering
4. `metadata` - Metadata configuration
5. `cleanup` - Data cleanup rules
6. `transform` - Data transformation
7. `mapping` - Field mapping
8. `validate` - Data validation
9. `load` - Load execution
10. `error` - Error handling
11. `workflows` - Workflow management

#### 3. Backup Routes
- `/backup/dashboard` - Backup dashboard
- `/backup/jobs` - Backup jobs management
- `/backup/restore` - Restore operations
- `/backup/history` - Backup history

#### 4. Translation Routes
- `/translation/dashboard` - Translation dashboard
- `/translation/languages` - Language packs
- `/translation/memory` - Translation memory
- `/translation/progress` - Progress tracking
- `/translation/translations` - Translations management

#### 5. File Migration Routes
- `/file-migration/upload` - File upload
- `/file-migration/relationship` - Relationship mapping
- `/file-migration/filter` - Filtering
- `/file-migration/metadata` - Metadata
- `/file-migration/cleanup` - Cleanup
- `/file-migration/transform` - Transformation
- `/file-migration/mapping` - Mapping
- `/file-migration/validate` - Validation
- `/file-migration/load` - Load
- `/file-migration/error` - Error handling
- `/file-migration/workflows` - Workflows

#### 6. Settings Routes
- `/account` - Account settings
- `/users` - User management
- `/projects` - Project management

#### 7. Default Route
- `/` - Redirects based on selected project type:
  - `backup` → `/backup/dashboard`
  - `translation` → `/translation/dashboard`
  - `file migration` → `/file-migration/upload`
  - Default → `/dashboard`

### Route Protection
All routes except `/login` are wrapped in `<ProtectedRoute>` component.

---

## State Management (Redux)

### Store Configuration
**File**: `src/store/index.ts`

### Redux Slices

#### 1. Auth Slice (`authSlice.ts`)
**State**:
```typescript
{
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
```

**Actions**:
- `setCredentials` - Store login tokens
- `logout` - Clear auth state
- `updateTokens` - Refresh tokens
- `setUser` - Update user info
- `setLoading` - Set loading state
- `setError` / `clearError` - Error handling

#### 2. App Slice (`appSlice.ts`)
**State**:
```typescript
{
  selectedProject: Project | null;
  selectedEnvironment: Environment | null;
  selectedSystem: System | null;
  isSidebarOpen: boolean;
  activeMenu: string;
  isSettingsMenuOpen: boolean;
  currentView: 'application' | 'settings';
  currentApp: 'migration' | 'backup' | 'translation' | 'file migration' | null;
}
```

**Persistence**: State saved to localStorage as `app_state`

**Key Actions**:
- `setSelectedProject` - Select project (auto-sets currentApp)
- `setSelectedEnvironment` - Select environment
- `setSelectedSystem` - Select system
- `syncStateWithRoute` - Sync state with URL pathname
- `switchToApplicationView` / `switchToSettingsView` - View switching

#### 3. Migration Slice (`migrationSlice.ts`)
**State**:
```typescript
{
  selectedObject: MigrationObject | null;
  activeTab: MigrationTab;
  migrationName: string;
  summaryData: any;
  relationshipData: any;
  filterData: any;
  metadataData: any;
  cleanupData: any;
  transformData: any;
  mappingData: any;
  validateData: any;
  loadData: any;
  errorData: any;
  workflowsData: any;
}
```

**Persistence**: State saved to localStorage as `migration_state`

**Actions**: Individual setters for each tab's data + `clearMigrationData`

### RTK Query APIs (36 APIs)

All APIs use RTK Query with:
- Automatic token injection via `prepareHeaders`
- Token refresh on 401 errors via `baseQueryWithReauth`
- Tag-based cache invalidation

**API List**:
1. `authApi` - Authentication (`/auth/v3/*`)
2. `workspaceApi` - Workspace management
3. `projectApi` - Project CRUD
4. `systemsApi` - System management
5. `environmentApi` - Environment management
6. `objectsApi` - Object management
7. `userApi` - User profile
8. `usersApi` - User management
9. `accountApi` - Account management
10. `backupApi` - Backup operations
11. `backuploadApi` - Backup load operations
12. `dashboardApi` - Dashboard data
13. `entitiesApi` - Entities management
14. `metadataApi` - Metadata operations
15. `cleanupApi` - Cleanup operations
16. `cleanupDataApi` - Cleanup data
17. `cleanupFunctionsApi` - Cleanup functions
18. `cleanupRuleApi` - Cleanup rules
19. `validateApi` - Validation operations
20. `validateDataApi` - Validation data
21. `validateFunctionsApi` - Validation functions
22. `validateRuleApi` - Validation rules
23. `mappingApi` - Mapping operations
24. `transformApi` - Transform operations
25. `transformActionsApi` - Transform actions
26. `transformRuleApi` - Transform rules
27. `filterApi` - Filter operations
28. `loadApi` - Load operations
29. `errorApi` - Error handling
30. `odfFileApi` - ODF file operations
31. `pipelineApi` - Pipeline management
32. `lookupApi` - Lookup operations
33. `picklistApi` - Picklist management
34. `estimatorApi` - Estimation operations
35. `projectEstimatorApi` - Project estimation
36. `planEstimatorApi` - Plan estimation
37. `activityApi` - Activity tracking

---

## API Services Architecture

### Base Configuration

**Environment Variable**: `VITE_API_BASE_URL`

**Base Query Pattern**:
```typescript
const baseQuery = fetchBaseQuery({
  baseUrl: `${import.meta.env.VITE_API_BASE_URL}`,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as any).auth.accessToken;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    headers.set('Accept', 'application/json');
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});
```

### Token Refresh Interceptor

**Pattern**: `baseQueryWithReauth` (implemented in multiple APIs)

**Flow**:
1. API call fails with 401
2. Extract refresh token from localStorage
3. Call `/auth/v3/refresh_token`
4. Update tokens in Redux and localStorage
5. Retry original request with new token
6. If refresh fails → logout and redirect to `/login`

### API Endpoint Examples

#### Authentication
- `POST /auth/v3/login/` - Login
- `POST /auth/v3/refresh_token` - Refresh token
- `POST /auth/v3/logout/` - Logout
- `GET /auth/v3/user/` - Get user profile

#### Workspace
- `GET /management/user_workspace/user_workspace/` - Get workspace
- `PUT /management/user_workspace/user_workspace/` - Update workspace
- `POST /management/user_workspace/user_workspace/project/:projectId` - Create workspace project
- `POST /management/user_workspace/user_workspace/environment/:environmentId` - Update environment

#### Projects
- `GET /management/v2/project` - List projects
- `POST /management/v2/project` - Create project
- `PUT /management/v2/project/:id` - Update project
- `DELETE /management/v2/project/:id` - Delete project

#### Systems
- `GET /management/v2/system/project/:projectId` - Get systems by project

#### Environments
- `GET /management/v2/environment/project/:projectId` - Get environments by project
- `POST /management/v2/environment` - Create environment
- `PUT /management/v2/environment/:id` - Update environment
- `DELETE /management/v2/environment/:id` - Delete environment

#### Objects
- `GET /management/v2/object/system/:systemId` - Get objects by system

---

## UI Components & Layout

### Layout Structure

**Main Layout**: `src/components/layout/Layout.tsx`

**Components**:
1. **Header** (`Header.tsx`):
   - App title (changes based on current app)
   - Project dropdown
   - Environment dropdown
   - Connector dialog button
   - Settings toggle
   - Logout button

2. **Sidebar** (Context-aware):
   - **Sidebar** (`Sidebar.tsx`) - Migration app
   - **BackupSidebar** - Backup app
   - **TranslationSidebar** - Translation app
   - **FileMigrationSidebar** - File migration app
   - **SettingsSidebar** - Settings view

3. **Main Content Area**: Renders route children

### Sidebar Features (Migration)

**Menu Items**:
- Dashboard
- Entities
- Management

**Dynamic Sections**:
- **Source Systems**: Expandable list showing systems with objects
  - Shows object count badge
  - Shows completion status
  - Click object → Navigate to migration tab
- **Environments**: Expandable dropdown
  - Shows environment type (dev, qa, prod)
  - Visual chips for environment status

**Persistence**: Sidebar state (expanded systems) saved to localStorage as `sidebar_session`

### Header Features

**Dynamic Title**: Changes based on:
- Current view (application/settings)
- Current app (migration/backup/translation)
- Active menu item

**Project Dropdown**: `src/components/common/ProjectDropdown.tsx`
- Lists all user projects
- Shows project type badges
- Switches project and navigates to appropriate dashboard

**Environment Dropdown**: `src/components/common/EnvironmentDropdown.tsx`
- Lists environments for selected project
- Updates workspace on selection

---

## Environment Configuration

### Required Environment Variables

**`.env` file**:
```env
VITE_API_BASE_URL=https://api.example.com
```

**Usage**: All API services use `import.meta.env.VITE_API_BASE_URL`

### Build Configuration

**Vite Config**: `vite.config.ts`
- React plugin enabled
- No additional plugins configured

---

## Key Features & Modules

### 1. Workspace Management

**Hook**: `src/hooks/useWorkspace.ts`

**Features**:
- Fetches user workspace on authentication
- Fetches projects list
- Auto-selects project on login (priority: localStorage → workspace API → first project)
- Project switching:
  - Updates workspace via API
  - Updates localStorage
  - Invalidates relevant cache tags
  - Navigates to appropriate dashboard

**Workspace Structure**:
```typescript
{
  user: string;
  project: string;
  environment: string | null;
}
```

### 2. Migration Workflow

**Layout**: `src/components/migration/MigrationLayout.tsx`

**Tabs** (11-step workflow):
1. **Summary**: Object overview and statistics
2. **Relationship**: Define object relationships
3. **Filter**: Apply data filters
4. **Metadata**: Configure metadata
5. **Cleanup**: Data cleanup rules and functions
6. **Transform**: Data transformation rules
7. **Mapping**: Field-to-field mapping
8. **Validate**: Validation rules
9. **Load**: Execute load process
10. **Error**: Error handling and resolution
11. **Workflows**: Workflow automation

**State Management**: Each tab's data stored in Redux `migrationSlice` and persisted to localStorage

### 3. Backup Module

**Layout**: `src/components/layout/BackupLayout.tsx`

**Features**:
- Dashboard with backup status
- Job scheduling
- Restore operations
- History tracking

### 4. Translation Module

**Layout**: `src/pages/translation/TranslationDashboard.tsx`

**Features**:
- Translation progress tracking
- Language pack management
- Translation memory
- Progress monitoring

### 5. File Migration Module

**Layout**: `src/components/layout/FileMigrationLayout.tsx`

**Workflow**: Similar to migration but file-based:
- Upload → Relationship → Filter → Metadata → Cleanup → Transform → Mapping → Validate → Load → Error → Workflows

### 6. Settings Module

**Pages**:
- **Account** (`src/pages/Account.tsx`): Account settings
- **Users** (`src/pages/Users.tsx`): User management (CRUD)
- **Projects** (`src/pages/Projects.tsx`): Project management (CRUD)

---

## Session Persistence

### localStorage Keys

1. **`accessToken`** - JWT access token
2. **`refreshToken`** - JWT refresh token
3. **`lastActivity`** - Timestamp of last user activity
4. **`app_state`** - Serialized Redux app slice state
5. **`migration_state`** - Serialized Redux migration slice state
6. **`sidebar_session`** - Sidebar expanded state
7. **`migration_objects`** - Cached migration objects
8. **`local_workspace_project`** - Last selected project ID

### State Restoration

**On App Load**:
1. Check `accessToken` validity
2. Restore `app_state` to Redux
3. Restore `migration_state` to Redux
4. Restore `sidebar_session` to component state
5. If valid token → User stays authenticated
6. If invalid token → Redirect to login

---

## Security Features

### 1. Token Security
- JWT tokens stored in localStorage
- Automatic token refresh before expiry
- Token validation on app initialization
- Automatic logout on token refresh failure

### 2. Route Protection
- All routes except `/login` protected
- Automatic redirect to login if not authenticated
- Route-based view switching (prevents unauthorized access)

### 3. Idle Session Management
- 14-minute idle timeout
- Warning dialog before logout
- Activity tracking across multiple event types

### 4. API Security
- Bearer token authentication on all requests
- Automatic token injection via interceptors
- 401 error handling with token refresh
- Logout on authentication failure

### 5. Data Persistence
- Sensitive data (tokens) stored in localStorage
- State persistence for better UX
- Clear all data on logout

---

## Component Architecture

### Component Organization

```
src/components/
├── account/          # Account management components
├── auth/             # Authentication components
│   ├── LoginForm.tsx
│   ├── ProtectedRoute.tsx
│   └── IdleTimeoutDialog.tsx
├── backup/           # Backup module components
├── common/           # Shared components
│   ├── ProjectDropdown.tsx
│   └── EnvironmentDropdown.tsx
├── entities/         # Entities management
├── layout/           # Layout components
│   ├── Layout.tsx
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   ├── BackupSidebar.tsx
│   ├── TranslationSidebar.tsx
│   ├── FileMigrationSidebar.tsx
│   └── SettingsSidebar.tsx
├── migration/        # Migration workflow components
├── projects/         # Project management
└── users/            # User management
```

### Custom Hooks

1. **`useAuth`** - Authentication operations
2. **`useWorkspace`** - Workspace and project management
3. **`useIdleTimer`** - Idle session management

---

## Data Flow

### Login Flow
```
User Input → LoginForm → useAuth.login() → authApi.login() 
→ API Response → setCredentials() → localStorage + Redux 
→ WorkspaceInitializer → useWorkspace → Fetch Projects 
→ Auto-select Project → Navigate to Dashboard
```

### Project Switch Flow
```
ProjectDropdown → switchProject() → Update localStorage 
→ Update Redux → API: createWorkspace() → Invalidate Cache 
→ Navigate to Dashboard
```

### Migration Object Selection Flow
```
Sidebar Object Click → setSelectedObject() → Redux + localStorage 
→ Navigate to /migration/:objectId/:tab → MigrationLayout 
→ Load Tab Component → Fetch Data → Display
```

---

## Error Handling

### API Error Handling
- RTK Query automatically handles network errors
- 401 errors trigger token refresh
- Failed refresh → logout and redirect
- Error messages displayed in UI components

### Form Validation
- React Hook Form + Yup validation
- Real-time validation feedback
- Error messages displayed inline

---

## Performance Optimizations

1. **Code Splitting**: Route-based lazy loading (if implemented)
2. **Caching**: RTK Query automatic caching with tags
3. **Memoization**: React.memo for expensive components
4. **State Persistence**: localStorage for faster initial load
5. **Debouncing**: Activity tracking throttled to 500ms

---

## Development Workflow

### Scripts
- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm run lint` - ESLint check
- `npm run preview` - Preview production build

### Type Safety
- Full TypeScript coverage
- Type definitions in `src/types/index.ts`
- Strict type checking enabled

---

## Summary

This is a **comprehensive, enterprise-grade data migration and management platform** with:

✅ **Multi-tenant architecture** with workspace management  
✅ **Four project types**: Migration, Backup, Translation, File Migration  
✅ **Robust authentication** with JWT tokens and automatic refresh  
✅ **Idle session management** with warning dialogs  
✅ **State persistence** across page refreshes  
✅ **36+ API services** with unified error handling  
✅ **11-step migration workflow** with data persistence  
✅ **Dynamic routing** based on project type  
✅ **Material-UI** for consistent, modern UI  
✅ **TypeScript** for type safety  
✅ **Redux Toolkit** for predictable state management  

The application is production-ready with comprehensive error handling, security features, and user experience optimizations.

