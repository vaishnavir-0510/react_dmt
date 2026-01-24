// store/index.ts
import { configureStore } from '@reduxjs/toolkit';

import { workspaceApi } from '../services/workspaceApi';
import { systemsApi } from '../services/systemsApi';
import { environmentApi } from '../services/environmentApi';
import { objectsApi } from '../services/objectsApi';
import authReducer from './slices/authSlice';
import appReducer from './slices/appSlice';
import { userApi } from '../services/userApi';
import { usersApi } from '../services/usersApi';
import { accountApi } from '../services/accountApi';
import { projectApi } from '../services/projectApi';

import { projectEstimatorApi } from '../services/projectEstimatorApi';
import { planEstimatorApi } from '../services/planEstimatorApi';
import migrationReducer from './slices/migrationSlice';
import { metadataApi } from '../services/metadataApi';
import { cleanupApi } from '../services/cleanupApi';
import { cleanupDataApi } from '../services/cleanupDataApi';
import { cleanupFunctionsApi } from '../services/cleanupFunctionsApi';
import { cleanupRuleApi } from '../services/cleanupRuleApi';

import { validateFunctionsApi } from '../services/validateFunctionsApi';
import { validateDataApi } from '../services/validateDataApi';
import { validateApi } from '../services/validateApi';
import { validateRuleApi } from '../services/validateRuleApi';
import { mappingApi } from '../services/mappingApi';
import { transformApi } from '../services/transformApi';
import { transformActionsApi } from '../services/transformActionsApi';
import { transformRuleApi } from '../services/transformRuleApi';
import { filterApi } from '../services/filterApi';
import { loadApi } from '../services/loadApi';
import { entitiesApi } from '../services/entitiesApi';
import { backupApi } from '../services/backuploadApi';
import { managementApi } from '../services/managementApi';
import { backupApi as backupDashboardApi } from '../services/backupApi';
import { useDispatch } from 'react-redux';
import { authApi } from './api/authApi';
import { errorApi } from '../services/errorApi';
import { odfFileApi } from '../services/odfFileApi';
import { pipelineApi } from '../services/pipelineApi';
import { lookupApi } from '../services/lookupApi';

import { estimatorApi } from '../services/estimatorApi';
import { dashboardApi } from '../services/dashboardApi';
import { activityApi } from '../services/activityApi';
import { securityPoliciesApi } from '../services/securityPoliciesApi';
import { revealApi } from '../services/revealApi';
import { translationApi } from '../services/translationApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    app: appReducer,
    migration: migrationReducer,
    [authApi.reducerPath]: authApi.reducer,
    [backupDashboardApi.reducerPath]: backupDashboardApi.reducer,
    [workspaceApi.reducerPath]: workspaceApi.reducer,
    [systemsApi.reducerPath]: systemsApi.reducer,
    [environmentApi.reducerPath]: environmentApi.reducer,
    [objectsApi.reducerPath]: objectsApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [accountApi.reducerPath]: accountApi.reducer,
    [projectApi.reducerPath]: projectApi.reducer,
    [estimatorApi.reducerPath]: estimatorApi.reducer,
    [projectEstimatorApi.reducerPath]: projectEstimatorApi.reducer,
    [planEstimatorApi.reducerPath]: planEstimatorApi.reducer,
    [metadataApi.reducerPath]: metadataApi.reducer,
    [cleanupApi.reducerPath]: cleanupApi.reducer,
    [cleanupDataApi.reducerPath]: cleanupDataApi.reducer,
    [cleanupFunctionsApi.reducerPath]: cleanupFunctionsApi.reducer,
    [cleanupRuleApi.reducerPath]: cleanupRuleApi.reducer, // ✅ ADDED
    [validateApi.reducerPath]: validateApi.reducer,
    [validateDataApi.reducerPath]: validateDataApi.reducer,
    [validateFunctionsApi.reducerPath]: validateFunctionsApi.reducer,
    [validateRuleApi.reducerPath]: validateRuleApi.reducer, [mappingApi.reducerPath]: mappingApi.reducer,
    [transformApi.reducerPath]: transformApi.reducer,
    [transformActionsApi.reducerPath]: transformActionsApi.reducer,
    [transformRuleApi.reducerPath]: transformRuleApi.reducer,
    [filterApi.reducerPath]: filterApi.reducer,
    [loadApi.reducerPath]: loadApi.reducer, [entitiesApi.reducerPath]: entitiesApi.reducer, [backupApi.reducerPath]: backupApi.reducer,
    [managementApi.reducerPath]: managementApi.reducer,
    [errorApi.reducerPath]: errorApi.reducer, [odfFileApi.reducerPath]: odfFileApi.reducer,
    [pipelineApi.reducerPath]: pipelineApi.reducer,
    [lookupApi.reducerPath]: lookupApi.reducer,[dashboardApi.reducerPath]: dashboardApi.reducer,
    [activityApi.reducerPath]: activityApi.reducer,
    [securityPoliciesApi.reducerPath]: securityPoliciesApi.reducer,
    [revealApi.reducerPath]: revealApi.reducer,
    [translationApi.reducerPath]: translationApi.reducer,

  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // ignoredActions: ['persist/PERSIST'],
        ignoredActions: ['persist/PERSIST', 'auth/updateLastActivity'],
        ignoredPaths: ['auth.lastActivity'],

      },
    }).concat(
      authApi.middleware,
      backupDashboardApi.middleware,
      workspaceApi.middleware,
      systemsApi.middleware,
      environmentApi.middleware,
      objectsApi.middleware,
      userApi.middleware,
      usersApi.middleware,
      accountApi.middleware,
      projectApi.middleware,
      estimatorApi.middleware,
      projectEstimatorApi.middleware,
      planEstimatorApi.middleware,
      metadataApi.middleware,
      cleanupApi.middleware,
      cleanupDataApi.middleware,
      cleanupFunctionsApi.middleware,
      cleanupRuleApi.middleware,
      validateApi.middleware,
      validateDataApi.middleware,
      validateFunctionsApi.middleware,
      validateRuleApi.middleware,
      mappingApi.middleware,
      transformApi.middleware,
      transformActionsApi.middleware,
      transformRuleApi.middleware,
      filterApi.middleware,
      loadApi.middleware,
      entitiesApi.middleware,
      backupApi.middleware,
      errorApi.middleware,
      managementApi.middleware,
      odfFileApi.middleware,
      pipelineApi.middleware,
      lookupApi.middleware,
      dashboardApi.middleware,
      activityApi.middleware,
      securityPoliciesApi.middleware,
      revealApi.middleware,
      translationApi.middleware,
    ),

});


// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;