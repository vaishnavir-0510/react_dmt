// store/slices/appSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Project, Environment, System } from '../../types';

interface AppState {
  selectedProject: Project | null;
  selectedEnvironment: Environment | null;
  selectedSystem: System | null;
  isSidebarOpen: boolean;
  activeMenu: string;
  isSettingsMenuOpen: boolean;
  currentView: 'application' | 'settings';
  currentApp: 'migration' | 'backup' | 'translation' | 'file migration' | null;
  lastRoute: string | null;
}

// Check if token exists and is valid
const isValidToken = (token: string | null): boolean => {
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

// Load initial state from localStorage for persistence
const loadInitialState = (): AppState => {
  // Check if user is authenticated (has valid token)
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const isAuthenticated = isValidToken(accessToken);
  
  // Don't load state if we're on login or register page (user is logged out)
  // Or if user is not authenticated (token expired or missing)
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
  if ((currentPath === '/login' || currentPath === '/register') || !isAuthenticated) {
    // Clear lastRoute if not authenticated or on auth pages to prevent redirect loops
    if ((!isAuthenticated || currentPath === '/login' || currentPath === '/register') && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('app_state');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.lastRoute) {
            // Clear lastRoute from stored state
            parsed.lastRoute = null;
            localStorage.setItem('app_state', JSON.stringify(parsed));
          }
        }
      } catch {
        // Ignore errors when clearing
      }
    }
    
    // Return default state for login page or unauthenticated users
    return {
      selectedProject: null,
      selectedEnvironment: null,
      selectedSystem: null,
      isSidebarOpen: true,
      activeMenu: 'dashboard',
      isSettingsMenuOpen: false,
      currentView: 'application',
      currentApp: 'migration',
      lastRoute: null,
    };
  }
  
  try {
    const stored = localStorage.getItem('app_state');
    if (stored) {
      const parsed = JSON.parse(stored);

      // Validate that the stored state has the correct structure
      if (parsed && typeof parsed === 'object') {
        return {
          selectedProject: parsed.selectedProject || null,
          selectedEnvironment: parsed.selectedEnvironment || null,
          selectedSystem: parsed.selectedSystem || null,
          isSidebarOpen: parsed.isSidebarOpen !== undefined ? parsed.isSidebarOpen : true,
          activeMenu: parsed.activeMenu || 'dashboard',
          isSettingsMenuOpen: parsed.isSettingsMenuOpen || false,
          currentView: parsed.currentView || 'application',
          currentApp: parsed.currentApp || 'migration',
          lastRoute: parsed.lastRoute || null,
        };
      }
    }
  } catch (error) {
    console.error('Failed to load app state from localStorage:', error);
  }

  // Try to get last route from localStorage first, then fallback to current URL
  let path = typeof window !== 'undefined' ? window.location.pathname : '/';
  
  // If we're at root and have a stored lastRoute, use it
  if (path === '/' && typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('app_state');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.lastRoute && parsed.lastRoute !== '/') {
          path = parsed.lastRoute;
        }
      }
    } catch {
      // Ignore error, use current path
    }
  }

  // Settings routes: account, users, projects, security-policies
  const settingsRoutes = ['/account', '/users', '/projects', '/security-policies'];
  const isSettingsRoute = settingsRoutes.includes(path);

  if (isSettingsRoute) {
    let activeMenu = 'account';
    if (path === '/users') activeMenu = 'user';
    if (path === '/projects') activeMenu = 'project';
    if (path === '/security-policies') activeMenu = 'security-policies';

    return {
      selectedProject: null,
      selectedEnvironment: null,
      selectedSystem: null,
      isSidebarOpen: true,
      activeMenu,
      isSettingsMenuOpen: true,
      currentView: 'settings',
      currentApp: null,
      lastRoute: path,
    };
  }

  // Application routes
  // Migration routes: /migration, /migration/:objectId, /migration/:objectId/:tabName
  // Migration tabs: summary, relationship, filter, metadata, cleanup, transform, mapping, validate, load, error, workflows
  const isMigrationRoute = path.startsWith('/migration') || path === '/dashboard' || path === '/entities' || path === '/management';
  const isBackupRoute = path.startsWith('/backup');
  const isTranslationRoute = path.startsWith('/translation');
  const isFileMigrationRoute = path.startsWith('/file-migration');

  if (isMigrationRoute || isBackupRoute || isTranslationRoute || isFileMigrationRoute) {
    let activeMenu = 'dashboard';
    let currentApp: 'migration' | 'backup' | 'translation' | 'file migration' = 'migration';

    // Determine current app
    if (isBackupRoute) currentApp = 'backup';
    if (isTranslationRoute) currentApp = 'translation';
    if (isFileMigrationRoute) currentApp = 'file migration';

    // Map routes to active menu
    // All migration routes (/migration/:objectId/:tabName) map to 'entities' menu
    if (path === '/entities' || path.startsWith('/migration')) activeMenu = 'entities';
    if (path === '/management') activeMenu = 'management';
    if (path === '/backup/dashboard') activeMenu = 'backup dashboard';
    if (path === '/backup/jobs') activeMenu = 'backup jobs';
    if (path === '/backup/restore') activeMenu = 'restore';
    if (path === '/backup/history') activeMenu = 'backup history';
    if (path === '/translation/dashboard') activeMenu = 'translation dashboard';
    if (path === '/translation/languages') activeMenu = 'language packs';
    if (path === '/translation/memory') activeMenu = 'translation memory';
    if (path === '/translation/progress') activeMenu = 'progress tracking';
    if (path === '/translation/translations') activeMenu = 'translations';
    if (path === '/file-migration/upload') activeMenu = 'file upload';
    if (path === '/file-migration/relationship') activeMenu = 'file relationship';
    if (path === '/file-migration/filter') activeMenu = 'file filter';
    if (path === '/file-migration/metadata') activeMenu = 'file metadata';
    if (path === '/file-migration/cleanup') activeMenu = 'file cleanup';
    if (path === '/file-migration/transform') activeMenu = 'file transform';
    if (path === '/file-migration/mapping') activeMenu = 'file mapping';
    if (path === '/file-migration/validate') activeMenu = 'file validate';
    if (path === '/file-migration/load') activeMenu = 'file load';
    if (path === '/file-migration/error') activeMenu = 'file error';
    if (path === '/file-migration/workflows') activeMenu = 'file workflows';
    if (path === '/file-migration/analysis') activeMenu = 'file analysis';
    if (path === '/file-migration/storage') activeMenu = 'file storage';

    return {
      selectedProject: null,
      selectedEnvironment: null,
      selectedSystem: null,
      isSidebarOpen: true,
      activeMenu,
      isSettingsMenuOpen: false,
      currentView: 'application',
      currentApp,
      lastRoute: path,
    };
  }

  // Default fallback
  return {
    selectedProject: null,
    selectedEnvironment: null,
    selectedSystem: null,
    isSidebarOpen: true,
    activeMenu: 'dashboard',
    isSettingsMenuOpen: false,
    currentView: 'application',
    currentApp: 'migration',
    lastRoute: path,
  };
};

const initialState: AppState = loadInitialState();

// Helper to save state to localStorage
const saveStateToLocalStorage = (state: AppState) => {
  try {
    localStorage.setItem('app_state', JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save app state to localStorage:', error);
  }
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setSelectedProject: (state, action: PayloadAction<Project | null>) => {
      state.selectedProject = action.payload;
      // Set current app based on project type
      if (action.payload) {
        const projectType = action.payload.project_type;
        state.currentApp = projectType === 'filemigration' ? 'file migration' : (projectType || 'migration');
      }
      saveStateToLocalStorage(state);
    },
    setSelectedEnvironment: (state, action: PayloadAction<Environment | null>) => {
      state.selectedEnvironment = action.payload;
      saveStateToLocalStorage(state);
    },
    setSelectedSystem: (state, action: PayloadAction<System | null>) => {
      state.selectedSystem = action.payload;
      saveStateToLocalStorage(state);
    },
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
      saveStateToLocalStorage(state);
    },
    setActiveMenu: (state, action: PayloadAction<string>) => {
      state.activeMenu = action.payload;
      saveStateToLocalStorage(state);
    },
    openSettingsMenu: (state) => {
      state.isSettingsMenuOpen = true;
      state.currentView = 'settings';
      state.activeMenu = 'account';
      state.currentApp = null;
      saveStateToLocalStorage(state);
    },
    closeSettingsMenu: (state) => {
      state.isSettingsMenuOpen = false;
      state.currentView = 'application';
      // Reset to appropriate dashboard based on project type
      if (state.selectedProject?.project_type === 'backup') {
        state.activeMenu = 'backup dashboard';
        state.currentApp = 'backup';
      } else if (state.selectedProject?.project_type === 'translation') {
        state.activeMenu = 'translation dashboard';
        state.currentApp = 'translation';
      } else if (state.selectedProject?.project_type === 'file migration' || state.selectedProject?.project_type === 'filemigration') {
        state.activeMenu = 'file upload';
        state.currentApp = 'file migration';
      } else {
        state.activeMenu = 'dashboard';
        state.currentApp = 'migration';
      }
      saveStateToLocalStorage(state);
    },
    switchToApplicationView: (state) => {
      state.currentView = 'application';
      state.isSettingsMenuOpen = false;
      // Set appropriate app based on selected project
      if (state.selectedProject?.project_type === 'backup') {
        state.currentApp = 'backup';
      } else if (state.selectedProject?.project_type === 'translation') {
        state.currentApp = 'translation';
      } else if (state.selectedProject?.project_type === 'file migration' || state.selectedProject?.project_type === 'filemigration') {
        state.currentApp = 'file migration';
      } else {
        state.currentApp = 'migration';
      }
      saveStateToLocalStorage(state);
    },
    switchToSettingsView: (state) => {
      state.currentView = 'settings';
      state.isSettingsMenuOpen = true;
      state.currentApp = null;
      saveStateToLocalStorage(state);
    },
    setCurrentApp: (state, action: PayloadAction<'migration' | 'backup' | 'translation' | 'file migration'>) => {
      state.currentApp = action.payload;
      saveStateToLocalStorage(state);
    },
    // Enhanced action to sync state with current route
    // Handles route synchronization and state updates based on current pathname
    // Only updates state if it's different to avoid unnecessary re-renders
    syncStateWithRoute: (state, action: PayloadAction<{ pathname: string }>) => {
      const { pathname } = action.payload;

      // Don't save login or register routes as lastRoute
      if (pathname === '/login' || pathname === '/register') {
        return;
      }

      // Settings routes: account, users, projects, security-policies
      const settingsRoutes = ['/account', '/users', '/projects', '/security-policies'];
      
      // Migration routes: /migration, /migration/:objectId, /migration/:objectId/:tabName
      // Migration tabs: summary, relationship, filter, metadata, cleanup, transform, mapping, validate, load, error, workflows
      const isMigrationRoute = pathname.startsWith('/migration') || pathname === '/dashboard' || pathname === '/entities' || pathname === '/management';
      const isBackupRoute = pathname.startsWith('/backup');
      const isTranslationRoute = pathname.startsWith('/translation');
      const isFileMigrationRoute = pathname.startsWith('/file-migration');

      // Handle settings routes: account, users, projects
      if (settingsRoutes.includes(pathname)) {
        // Only update if state is different to avoid unnecessary re-renders
        if (state.currentView !== 'settings') {
          state.currentView = 'settings';
        }
        if (!state.isSettingsMenuOpen) {
          state.isSettingsMenuOpen = true;
        }
        if (state.currentApp !== null) {
          state.currentApp = null;
        }

        // Set active menu based on settings route
        let newActiveMenu = 'account';
        if (pathname === '/users') newActiveMenu = 'user';
        if (pathname === '/projects') newActiveMenu = 'project';
        if (pathname === '/security-policies') newActiveMenu = 'security-policies';
        if (state.activeMenu !== newActiveMenu) {
          state.activeMenu = newActiveMenu;
        }
      } else if (isMigrationRoute || isBackupRoute || isTranslationRoute || isFileMigrationRoute) {
        // Only update if state is different to avoid unnecessary re-renders
        if (state.currentView !== 'application') {
          state.currentView = 'application';
        }
        if (state.isSettingsMenuOpen) {
          state.isSettingsMenuOpen = false;
        }

        // Set current app based on route
        let newCurrentApp: 'migration' | 'backup' | 'translation' | 'file migration' = 'migration';
        if (isBackupRoute) newCurrentApp = 'backup';
        else if (isTranslationRoute) newCurrentApp = 'translation';
        else if (isFileMigrationRoute) newCurrentApp = 'file migration';
        
        if (state.currentApp !== newCurrentApp) {
          state.currentApp = newCurrentApp;
        }

        // Set active menu based on route
        // Migration routes: all /migration/:objectId/:tabName routes map to 'entities' menu
        // Migration tabs handled: summary, relationship, filter, metadata, cleanup, transform, mapping, validate, load, error, workflows
        if (pathname === '/dashboard') state.activeMenu = 'dashboard';
        if (pathname === '/entities' || pathname.startsWith('/migration')) state.activeMenu = 'entities';
        if (pathname === '/management') state.activeMenu = 'management';
        if (pathname === '/backup/dashboard') state.activeMenu = 'backup dashboard';
        if (pathname === '/backup/jobs') state.activeMenu = 'backup jobs';
        if (pathname === '/backup/restore') state.activeMenu = 'restore';
        if (pathname === '/backup/history') state.activeMenu = 'backup history';
        if (pathname === '/translation/dashboard') state.activeMenu = 'translation dashboard';
        if (pathname === '/translation/languages') state.activeMenu = 'language packs';
        if (pathname === '/translation/memory') state.activeMenu = 'translation memory';
        if (pathname === '/translation/progress') state.activeMenu = 'progress tracking';
        if (pathname === '/translation/translations') state.activeMenu = 'translations';
        if (pathname === '/file-migration/upload') state.activeMenu = 'file upload';
        if (pathname === '/file-migration/relationship') state.activeMenu = 'file relationship';
        if (pathname === '/file-migration/filter') state.activeMenu = 'file filter';
        if (pathname === '/file-migration/metadata') state.activeMenu = 'file metadata';
        if (pathname === '/file-migration/cleanup') state.activeMenu = 'file cleanup';
        if (pathname === '/file-migration/transform') state.activeMenu = 'file transform';
        if (pathname === '/file-migration/mapping') state.activeMenu = 'file mapping';
        if (pathname === '/file-migration/validate') state.activeMenu = 'file validate';
        if (pathname === '/file-migration/load') state.activeMenu = 'file load';
        if (pathname === '/file-migration/error') state.activeMenu = 'file error';
        if (pathname === '/file-migration/workflows') state.activeMenu = 'file workflows';
        if (pathname === '/file-migration/analysis') state.activeMenu = 'file analysis';
        if (pathname === '/file-migration/storage') state.activeMenu = 'file storage';
      }

      // Store the current route
      state.lastRoute = pathname;
      saveStateToLocalStorage(state);
    },
    clearSelectedProject: (state) => {
      state.selectedProject = null;
      state.currentApp = 'migration';
      saveStateToLocalStorage(state);
    },
    clearSelectedSystem: (state) => {
      state.selectedSystem = null;
      saveStateToLocalStorage(state);
    },
    clearSelectedEnvironment: (state) => {
      state.selectedEnvironment = null;
      saveStateToLocalStorage(state);
    },
    clearAllSelections: (state) => {
      state.selectedProject = null;
      state.selectedSystem = null;
      state.selectedEnvironment = null;
      state.currentApp = 'migration';
      saveStateToLocalStorage(state);
    },
    // Add action to clear app state from localStorage
    clearAppState: (state) => {
      state.selectedProject = null;
      state.selectedEnvironment = null;
      state.selectedSystem = null;
      state.activeMenu = 'dashboard';
      state.isSettingsMenuOpen = false;
      state.currentView = 'application';
      state.currentApp = 'migration';
      state.lastRoute = null;
      try {
        localStorage.removeItem('app_state');
      } catch (error) {
        console.error('Failed to clear app state from localStorage:', error);
      }
    },
  },
});

export const {
  setSelectedProject,
  setSelectedEnvironment,
  setSelectedSystem,
  toggleSidebar,
  setActiveMenu,
  openSettingsMenu,
  closeSettingsMenu,
  switchToApplicationView,
  switchToSettingsView,
  setCurrentApp,
  syncStateWithRoute,
  clearSelectedProject,
  clearSelectedSystem,
  clearSelectedEnvironment,
  clearAllSelections,
  clearAppState,
} = appSlice.actions;
export default appSlice.reducer;

