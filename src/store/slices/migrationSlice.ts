// store/slices/migrationSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { MigrationObject, MigrationState, MigrationTab } from '../../types';

// Load initial state from localStorage for persistence
const loadInitialState = (): MigrationState => {
  // Don't load state if we're on login or register page (user is logged out)
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
  if (currentPath === '/login' || currentPath === '/register') {
    return {
      selectedObject: null,
      activeTab: 'summary',
      migrationName: '',
      summaryData: null,
      relationshipData: null,
      filterData: null,
      metadataData: null,
      cleanupData: null,
      transformData: null,
      mappingData: null,
      validateData: null,
      loadData: null,
      errorData: null,
      workflowsData: null,
    };
  }
  
  try {
    const stored = localStorage.getItem('migration_state');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load migration state from localStorage:', error);
  }
  
  return {
    selectedObject: null,
    activeTab: 'summary',
    migrationName: '',
     summaryData: null,
    relationshipData: null,
    filterData: null,
    metadataData: null,
    cleanupData: null,
    transformData: null,
    mappingData: null,
    validateData: null,
    loadData: null,
    errorData: null,
    workflowsData: null,
  };
};

const initialState: MigrationState = loadInitialState();

const migrationSlice = createSlice({
  name: 'migration',
  initialState,
  reducers: {
    setSelectedObject: (state, action: PayloadAction<MigrationObject | null>) => {
      state.selectedObject = action.payload;
      // Save to localStorage for persistence
      try {
        localStorage.setItem('migration_state', JSON.stringify(state));
      } catch (error) {
        console.error('Failed to save migration state to localStorage:', error);
      }
    },
    setActiveTab: (state, action: PayloadAction<MigrationTab>) => {
      state.activeTab = action.payload;
      // Save to localStorage for persistence
      try {
        localStorage.setItem('migration_state', JSON.stringify(state));
      } catch (error) {
        console.error('Failed to save migration state to localStorage:', error);
      }
    },
    setMigrationName: (state, action: PayloadAction<string>) => {
      state.migrationName = action.payload;
      // Save to localStorage for persistence
      try {
        localStorage.setItem('migration_state', JSON.stringify(state));
      } catch (error) {
        console.error('Failed to save migration state to localStorage:', error);
      }
    },
      setSummaryData: (state, action: PayloadAction<any>) => {
      state.summaryData = action.payload;
      // Save to localStorage for persistence
      try {
        localStorage.setItem('migration_state', JSON.stringify(state));
      } catch (error) {
        console.error('Failed to save migration state to localStorage:', error);
      }
    },
    // Individual tab data setters
    setRelationshipData: (state, action: PayloadAction<any>) => {
      state.relationshipData = action.payload;
      // Save to localStorage for persistence
      try {
        localStorage.setItem('migration_state', JSON.stringify(state));
      } catch (error) {
        console.error('Failed to save migration state to localStorage:', error);
      }
    },
    setFilterData: (state, action: PayloadAction<any>) => {
      state.filterData = action.payload;
      // Save to localStorage for persistence
      try {
        localStorage.setItem('migration_state', JSON.stringify(state));
      } catch (error) {
        console.error('Failed to save migration state to localStorage:', error);
      }
    },
    setMetadataData: (state, action: PayloadAction<any>) => {
      state.metadataData = action.payload;
      // Save to localStorage for persistence
      try {
        localStorage.setItem('migration_state', JSON.stringify(state));
      } catch (error) {
        console.error('Failed to save migration state to localStorage:', error);
      }
    },
    setCleanupData: (state, action: PayloadAction<any>) => {
      state.cleanupData = action.payload;
      // Save to localStorage for persistence
      try {
        localStorage.setItem('migration_state', JSON.stringify(state));
      } catch (error) {
        console.error('Failed to save migration state to localStorage:', error);
      }
    },
    setTransformData: (state, action: PayloadAction<any>) => {
      state.transformData = action.payload;
      // Save to localStorage for persistence
      try {
        localStorage.setItem('migration_state', JSON.stringify(state));
      } catch (error) {
        console.error('Failed to save migration state to localStorage:', error);
      }
    },
    setMappingData: (state, action: PayloadAction<any>) => {
      state.mappingData = action.payload;
      // Save to localStorage for persistence
      try {
        localStorage.setItem('migration_state', JSON.stringify(state));
      } catch (error) {
        console.error('Failed to save migration state to localStorage:', error);
      }
    },
    setValidateData: (state, action: PayloadAction<any>) => {
      state.validateData = action.payload;
      // Save to localStorage for persistence
      try {
        localStorage.setItem('migration_state', JSON.stringify(state));
      } catch (error) {
        console.error('Failed to save migration state to localStorage:', error);
      }
    },
    setLoadData: (state, action: PayloadAction<any>) => {
      state.loadData = action.payload;
      // Save to localStorage for persistence
      try {
        localStorage.setItem('migration_state', JSON.stringify(state));
      } catch (error) {
        console.error('Failed to save migration state to localStorage:', error);
      }
    },
    setErrorData: (state, action: PayloadAction<any>) => {
      state.errorData = action.payload;
      // Save to localStorage for persistence
      try {
        localStorage.setItem('migration_state', JSON.stringify(state));
      } catch (error) {
        console.error('Failed to save migration state to localStorage:', error);
      }
    },
    setWorkflowsData: (state, action: PayloadAction<any>) => {
      state.workflowsData = action.payload;
      // Save to localStorage for persistence
      try {
        localStorage.setItem('migration_state', JSON.stringify(state));
      } catch (error) {
        console.error('Failed to save migration state to localStorage:', error);
      }
    },
    clearMigrationData: (state) => {
      state.selectedObject = null;
      state.migrationName = '';
       state.summaryData = null;
      state.relationshipData = null;
      state.filterData = null;
      state.metadataData = null;
      state.cleanupData = null;
      state.transformData = null;
      state.mappingData = null;
      state.validateData = null;
      state.loadData = null;
      state.errorData = null;
      state.workflowsData = null;
      // Clear from localStorage
      try {
        localStorage.removeItem('migration_state');
      } catch (error) {
        console.error('Failed to clear migration state from localStorage:', error);
      }
    },
  },
});

export const {
  setSelectedObject,
  setActiveTab,
  setMigrationName,
  setSummaryData,
  setRelationshipData,
  setFilterData,
  setMetadataData,
  setCleanupData,
  setTransformData,
  setMappingData,
  setValidateData,
  setLoadData,
  setErrorData,
  setWorkflowsData,
  clearMigrationData,
} = migrationSlice.actions;

export default migrationSlice.reducer;