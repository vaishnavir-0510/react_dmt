# Session & Idle Management - Comprehensive Analysis

## 📋 Overview

This document provides a complete analysis of all files related to session management, idle timeout, and token refresh functionality in the React TypeScript application.

---

## 🗂️ Files Analyzed

### Core Session & Idle Files

1. **`src/hooks/useIdleTimer.ts`** (603 lines)
   - **Purpose**: Main idle timer hook with proactive token refresh
   - **Key Features**:
     - 14-minute idle timeout detection
     - Proactive token refresh at 25 minutes (5 mins before 30 min expiry)
     - Network status monitoring (online/offline)
     - Shared refresh state coordination via `localStorage.tokenRefreshInProgress`
     - 2-minute cooldown period for refreshes
     - Extensive logging for debugging
   - **Status**: ✅ Well implemented

2. **`src/components/auth/IdleTimeoutDialog.tsx`** (96 lines)
   - **Purpose**: UI dialog shown when user is idle for 14 minutes
   - **Key Features**:
     - 60-second countdown before auto-logout
     - "Stay Active" and "Logout Now" buttons
     - Non-dismissible (no ESC key, no outside click)
     - Logging for dialog state changes
   - **Status**: ✅ Properly implemented

3. **`src/utils/session.ts`** (55 lines)
   - **Purpose**: Session utility functions
   - **Key Features**:
     - `updateLastActivity()` - Track user activity
     - `getLastActivity()` - Get last activity timestamp
     - `isSessionValid()` - Check if session is valid (15 min threshold)
     - `setupActivityListeners()` - Setup activity event listeners
     - `checkTokenExpiry()` - Check if token expires in >5 minutes
   - **Status**: ✅ Good utility functions

4. **`src/utils/multiTabSync.ts`** (80 lines)
   - **Purpose**: Multi-tab synchronization using localStorage events
   - **Key Features**:
     - Syncs auth tokens across tabs
     - Handles logout across all tabs
     - Syncs app state changes
     - Listens to `storage` events
   - **Status**: ✅ Properly implemented

### Authentication & Token Management

5. **`src/store/slices/authSlice.ts`** (357 lines)
   - **Purpose**: Redux slice for authentication state
   - **Key Features**:
     - `setCredentials()` - Save tokens on login
     - `updateTokens()` - Update tokens on refresh
     - `logout()` - Clear all auth state and localStorage
     - Token validation on initial load
     - Extensive logging for token expiry
   - **Status**: ✅ Well implemented

6. **`src/store/api/authApi.ts`** (282 lines)
   - **Purpose**: Main authentication API with token refresh interceptor
   - **Key Features**:
     - `baseQueryWithReauth` - Automatic token refresh on 401 errors
     - Refresh token deduplication (`isRefreshing`, `refreshPromise`)
     - Shared refresh state via `localStorage.tokenRefreshInProgress`
     - Query parameter format for refresh token API
     - All auth endpoints (login, register, logout, refresh, user profile)
   - **Status**: ✅ Well implemented with proper deduplication

7. **`src/hooks/useAuth.ts`** (60 lines)
   - **Purpose**: Auth hook for login/logout operations
   - **Key Features**:
     - `login()` - Login with credentials
     - `logout()` - Logout and clear state
     - Access to auth state from Redux
   - **Status**: ✅ Simple and effective

8. **`src/components/auth/ProtestedRoute.tsx`** (174 lines)
   - **Purpose**: Route protection component
   - **Key Features**:
     - Checks authentication before rendering routes
     - Redirects to login if not authenticated
     - Syncs Redux state with current route
     - Handles loading states
   - **Status**: ✅ Properly implemented

### Other API Files with Token Refresh

9. **`src/services/estimatorApi.ts`** (162 lines)
   - **Purpose**: Estimator API endpoints
   - **Token Refresh**: ✅ Has `baseQueryWithReauth` with deduplication
   - **Issues**: ⚠️ Doesn't use shared `localStorage.tokenRefreshInProgress` flag
   - **Status**: ⚠️ Needs improvement for better coordination

10. **`src/services/workspaceApi.ts`** (138 lines)
    - **Purpose**: Workspace API endpoints
    - **Token Refresh**: ✅ Has `baseQueryWithReauth`
    - **Issues**: ⚠️ No deduplication logic, no shared state coordination
    - **Status**: ⚠️ Needs improvement

11. **`src/services/dashboardApi.ts`** (218 lines)
    - **Purpose**: Dashboard API endpoints
    - **Token Refresh**: ✅ Has `baseQueryWithReauth`
    - **Issues**: ⚠️ No deduplication logic, no shared state coordination
    - **Status**: ⚠️ Needs improvement

### Integration Point

12. **`src/App.tsx`** (444 lines)
    - **Purpose**: Main app component with routing
    - **Key Features**:
      - Integrates `useIdleTimerHook()`
      - Renders `IdleTimeoutDialog`
      - Sets up `setupMultiTabSync()`
      - Sets up `setupActivityListeners()`
      - All routes wrapped in `ProtectedRoute`
    - **Status**: ✅ Properly integrated

---

## 🔄 Token Refresh Flow

### Proactive Refresh (While User is Active)

```
1. User logs in → Access token (30 min expiry)
2. useIdleTimer checks every 60 seconds
3. At 25 minutes (5 mins before expiry) → Refresh token API called
4. New tokens saved to Redux + localStorage
5. All API calls use new token automatically
6. Cycle continues every ~25 minutes
```

### Reactive Refresh (On 401 Error)

```
1. API call returns 401 Unauthorized
2. baseQueryWithReauth intercepts
3. Checks for refresh token
4. Calls refresh token API
5. Updates tokens in Redux + localStorage
6. Retries original API call with new token
```

---

## ⚠️ Issues Identified

### 1. Inconsistent Token Refresh Coordination

**Problem**: 
- `authApi.ts` has proper deduplication and shared state
- `estimatorApi.ts` has deduplication but doesn't use shared state
- `workspaceApi.ts` and `dashboardApi.ts` have no deduplication

**Impact**: 
- Multiple simultaneous refresh attempts possible
- Race conditions between different API services
- Potential for duplicate refresh token API calls

**Solution**: 
- All APIs should check `localStorage.tokenRefreshInProgress`
- All APIs should use shared refresh promise pattern
- Implement cooldown period in all APIs

### 2. Missing Shared State in Some APIs

**Problem**:
- `workspaceApi.ts` and `dashboardApi.ts` don't coordinate with `useIdleTimer` refresh
- They can trigger refresh while proactive refresh is in progress

**Solution**:
- Add `localStorage.tokenRefreshInProgress` check
- Add refresh deduplication logic
- Add cooldown period

### 3. Potential Race Condition

**Problem**:
- If `useIdleTimer` triggers refresh at 25 minutes
- And simultaneously an API call gets 401
- Both might try to refresh independently

**Current Mitigation**:
- ✅ `authApi.ts` has proper coordination
- ⚠️ Other APIs don't fully coordinate

---

## ✅ What's Working Well

1. **Proactive Token Refresh**: 
   - ✅ Refreshes at 25 minutes automatically
   - ✅ Updates both Redux and localStorage
   - ✅ All APIs use new token automatically

2. **Idle Detection**:
   - ✅ 14-minute timeout properly configured
   - ✅ Dialog shows with 60-second countdown
   - ✅ Works offline (network-independent)

3. **Multi-Tab Sync**:
   - ✅ Tokens sync across tabs
   - ✅ Logout syncs across tabs
   - ✅ Uses localStorage events

4. **Network Awareness**:
   - ✅ Idle timer works offline
   - ✅ Logout works offline
   - ✅ Network status logged

5. **Logging**:
   - ✅ Extensive logging for debugging
   - ✅ Token expiry information logged
   - ✅ Refresh attempts logged

---

## 🔧 Recommended Improvements

### Priority 1: Fix Token Refresh Coordination

**Update `workspaceApi.ts` and `dashboardApi.ts`** to match `authApi.ts` pattern:

```typescript
// Add shared refresh state check
const refreshInProgress = localStorage.getItem('tokenRefreshInProgress') === 'true';
if (refreshInProgress) {
  // Wait for existing refresh or skip
}

// Add deduplication
let isRefreshing = false;
let refreshPromise: Promise<any> | null = null;

// Add cooldown period
let lastSuccessfulRefreshTime = 0;
```

### Priority 2: Standardize Refresh Logic

**Create shared utility** for token refresh:
- `src/utils/tokenRefresh.ts`
- Centralized refresh logic
- Used by all API services
- Prevents duplication

### Priority 3: Add Refresh Metrics

**Track refresh statistics**:
- Number of refreshes per session
- Refresh success/failure rate
- Average time between refreshes

---

## 📊 Architecture Flow Diagram

```
┌─────────────────┐
│   User Login    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Access Token   │
│  (30 min expiry) │
└────────┬────────┘
         │
         ├─────────────────────────────────┐
         │                                 │
         ▼                                 ▼
┌──────────────────┐            ┌──────────────────┐
│  useIdleTimer    │            │  API Calls       │
│  (Proactive)     │            │  (Reactive)      │
└────────┬─────────┘            └────────┬─────────┘
         │                                 │
         │ Checks every 60s                │ On 401 Error
         │                                 │
         ▼                                 ▼
┌──────────────────┐            ┌──────────────────┐
│ At 25 minutes    │            │ baseQueryWithReauth│
│ Refresh Token    │            │ Refresh Token     │
└────────┬─────────┘            └────────┬─────────┘
         │                                 │
         └─────────────┬───────────────────┘
                       │
                       ▼
            ┌──────────────────┐
            │  Refresh Token    │
            │  API Call         │
            └────────┬──────────┘
                     │
                     ▼
            ┌──────────────────┐
            │  New Tokens       │
            │  (Redux + LS)     │
            └────────┬──────────┘
                     │
                     ▼
            ┌──────────────────┐
            │  Continue Session │
            │  (30 min cycle)   │
            └──────────────────┘
```

---

## 🎯 Session & Idle Configuration

### Current Settings

| Setting | Value | Location |
|---------|-------|----------|
| Access Token Expiry | 30 minutes | JWT payload |
| Proactive Refresh | 25 minutes (5 min before) | `useIdleTimer.ts` |
| Refresh Check Interval | 60 seconds | `useIdleTimer.ts` |
| Idle Timeout | 14 minutes | `useIdleTimer.ts` |
| Idle Dialog Countdown | 60 seconds | `IdleTimeoutDialog.tsx` |
| Refresh Cooldown | 2 minutes | `useIdleTimer.ts`, `authApi.ts` |
| Activity Events | mousedown, mousemove, keypress, scroll, touchstart, wheel, click | `useIdleTimer.ts` |

---

## 🧪 Testing Recommendations

### Manual Testing

1. **Token Refresh**:
   - Login and wait 25 minutes
   - Check console logs for refresh
   - Verify tokens updated in localStorage

2. **Idle Timeout**:
   - Login and stay idle for 14 minutes
   - Verify dialog appears
   - Test "Stay Active" button
   - Test auto-logout after 60 seconds

3. **Multi-Tab**:
   - Open app in 2 tabs
   - Logout in one tab
   - Verify other tab logs out

4. **Network Offline**:
   - Disconnect network
   - Stay idle for 15 minutes
   - Verify auto-logout works

5. **Token Refresh Coordination**:
   - Make multiple API calls simultaneously
   - Check console for duplicate refresh calls
   - Verify only one refresh happens

---

## 📝 Summary

### ✅ Strengths

1. Well-structured idle timer implementation
2. Proactive token refresh prevents expiry
3. Multi-tab synchronization works
4. Network-aware (works offline)
5. Extensive logging for debugging

### ⚠️ Areas for Improvement

1. **Token refresh coordination** across all API services
2. **Shared refresh state** in all APIs
3. **Standardized refresh logic** to prevent duplication
4. **Better error handling** for network failures during refresh

### 🎯 Priority Actions

1. ✅ Update `workspaceApi.ts` with shared refresh state
2. ✅ Update `dashboardApi.ts` with shared refresh state
3. ✅ Update `estimatorApi.ts` to use shared localStorage flag
4. ⚠️ Consider creating shared token refresh utility

---

## 📚 Related Documentation

- `TOKEN_MANAGEMENT_IMPLEMENTATION.md` - Token management details
- `ARCHITECTURE_ANALYSIS.md` - Overall architecture
- `COMPREHENSIVE_ANALYSIS.md` - Full project analysis

---

**Last Updated**: 2024
**Analysis Status**: Complete ✅



