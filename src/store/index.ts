// store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import { authApi } from './api/authApi';
import { workspaceApi } from '../services/workspaceApi';
import { systemsApi } from '../services/systemsApi';
import { environmentApi } from '../services/environmentApi';
import { objectsApi } from '../services/objectsApi';
import authReducer from './slices/authSlice';
import appReducer from './slices/appSlice';
import { userApi } from '../services/userApi';
import { usersApi } from '../services/usersApi';
import { accountApi } from '../services/accountApi';
import { estimatorApi } from '../services/estimatorApi';
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

export const store = configureStore({
  reducer: {
    auth: authReducer,
    app: appReducer,
    migration: migrationReducer,
    [authApi.reducerPath]: authApi.reducer,
    [workspaceApi.reducerPath]: workspaceApi.reducer,
    [systemsApi.reducerPath]: systemsApi.reducer,
    [environmentApi.reducerPath]: environmentApi.reducer,
    [objectsApi.reducerPath]: objectsApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [accountApi.reducerPath]: accountApi.reducer,
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
    [validateRuleApi.reducerPath]: validateRuleApi.reducer,[mappingApi.reducerPath]: mappingApi.reducer,

  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }).concat(
      authApi.middleware,
      workspaceApi.middleware,
      systemsApi.middleware,
      environmentApi.middleware,
      objectsApi.middleware,
      userApi.middleware,
      usersApi.middleware,
      accountApi.middleware,
      estimatorApi.middleware,
      projectEstimatorApi.middleware,
      planEstimatorApi.middleware,
      metadataApi.middleware,
      cleanupApi.middleware,
      cleanupDataApi.middleware,
      cleanupFunctionsApi.middleware,
      cleanupRuleApi.middleware ,// ✅ ADDED
       validateApi.middleware,
      validateDataApi.middleware,
      validateFunctionsApi.middleware,
      validateRuleApi.middleware,mappingApi.middleware,
      
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;