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
}

// Helper function to determine view and menu from URL
const getInitialStateFromUrl = (): Partial<AppState> => {
  if (typeof window === 'undefined') {
    return {};
  }

  const path = window.location.pathname;
  
  // Settings routes
  const settingsRoutes = ['/account', '/users', '/projects'];
  const isSettingsRoute = settingsRoutes.includes(path);
  
  if (isSettingsRoute) {
    let activeMenu = 'account';
    
    // Map routes to active menu
    if (path === '/users') activeMenu = 'user';
    if (path === '/projects') activeMenu = 'project';
    
    return {
      currentView: 'settings',
      isSettingsMenuOpen: true,
      activeMenu,
    };
  }
  
  // Application routes (including migration)
  const applicationRoutes = ['/dashboard', '/entities', '/management'];
  const isMigrationRoute = path.startsWith('/migration');
  const isApplicationRoute = applicationRoutes.includes(path) || isMigrationRoute;
  
  if (isApplicationRoute || isMigrationRoute) {
    let activeMenu = 'dashboard';
    
    // Map routes to active menu
    if (path === '/entities') activeMenu = 'entities';
    if (path === '/management') activeMenu = 'management';
    if (isMigrationRoute) activeMenu = 'entities'; // Migration is part of entities
    
    return {
      currentView: 'application',
      isSettingsMenuOpen: false,
      activeMenu,
    };
  }
  
  // Default fallback
  return {
    currentView: 'application',
    isSettingsMenuOpen: false,
    activeMenu: 'dashboard',
  };
};

const urlState = getInitialStateFromUrl();

const initialState: AppState = {
  selectedProject: null,
  selectedEnvironment: null,
  selectedSystem: null,
  isSidebarOpen: true,
  activeMenu: urlState.activeMenu || 'dashboard',
  isSettingsMenuOpen: urlState.isSettingsMenuOpen || false,
  currentView: urlState.currentView || 'application',
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setSelectedProject: (state, action: PayloadAction<Project | null>) => {
      state.selectedProject = action.payload;
    },
    setSelectedEnvironment: (state, action: PayloadAction<Environment | null>) => {
      state.selectedEnvironment = action.payload;
    },
    setSelectedSystem: (state, action: PayloadAction<System | null>) => {
      state.selectedSystem = action.payload;
    },
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    setActiveMenu: (state, action: PayloadAction<string>) => {
      state.activeMenu = action.payload;
    },
    openSettingsMenu: (state) => {
      state.isSettingsMenuOpen = true;
      state.currentView = 'settings';
      state.activeMenu = 'account';
    },
    closeSettingsMenu: (state) => {
      state.isSettingsMenuOpen = false;
      state.currentView = 'application';
      state.activeMenu = 'dashboard';
    },
    switchToApplicationView: (state) => {
      state.currentView = 'application';
      state.isSettingsMenuOpen = false;
      // Don't reset activeMenu - keep it based on current route
    },
    switchToSettingsView: (state) => {
      state.currentView = 'settings';
      state.isSettingsMenuOpen = true;
      // Don't reset activeMenu - keep it based on current route
    },
    // Add action to sync state with current route
    syncStateWithRoute: (state, action: PayloadAction<{ pathname: string }>) => {
      const { pathname } = action.payload;
      
      const settingsRoutes = ['/account', '/users', '/projects'];
      const applicationRoutes = ['/dashboard', '/entities', '/management'];
      const isMigrationRoute = pathname.startsWith('/migration');
      
      if (settingsRoutes.includes(pathname)) {
        state.currentView = 'settings';
        state.isSettingsMenuOpen = true;
        
        // Set active menu based on route
        if (pathname === '/account') state.activeMenu = 'account';
        if (pathname === '/users') state.activeMenu = 'user';
        if (pathname === '/projects') state.activeMenu = 'project';
      } else if (applicationRoutes.includes(pathname) || isMigrationRoute) {
        state.currentView = 'application';
        state.isSettingsMenuOpen = false;
        
        // Set active menu based on route
        if (pathname === '/dashboard') state.activeMenu = 'dashboard';
        if (pathname === '/entities') state.activeMenu = 'entities';
        if (pathname === '/management') state.activeMenu = 'management';
        if (isMigrationRoute) state.activeMenu = 'entities'; // Migration is part of entities
      }
      // Note: For other routes, we don't change the state to avoid overriding
      // when navigating to routes that might not be in these lists
    },
    clearSelectedProject: (state) => {
      state.selectedProject = null;
    },
    clearSelectedSystem: (state) => {
      state.selectedSystem = null;
    },
    // Add action to clear selected environment for consistency
    clearSelectedEnvironment: (state) => {
      state.selectedEnvironment = null;
    },
    // Optional: Add a clear all action for resetting selections
    clearAllSelections: (state) => {
      state.selectedProject = null;
      state.selectedSystem = null;
      state.selectedEnvironment = null;
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
  syncStateWithRoute,
  clearSelectedProject,
  clearSelectedSystem,
  clearSelectedEnvironment,
  clearAllSelections,
} = appSlice.actions;
export default appSlice.reducer;