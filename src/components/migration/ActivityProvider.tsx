// src/components/migration/ActivityProvider.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { useGetActivityStatusQuery, useUpdateActivityStatusMutation, type ActivityModel } from '../../services/activityApi';

interface ActivityProviderContextType {
  // Activity status maps
  activityStatusMap: Map<string, boolean>;
  readOnlyFlags: Map<string, boolean>;

  // Methods
  getActivityStatus: (objectId: string) => void;
  getCompletionStatus: (key: string) => boolean;
  getReadOnlyFlag: (key: string) => boolean;
  toggleCompletionStatus: (activity: string, objectId: string, currentStatus: boolean) => Promise<void>;
  updateStatusToggleButton: (activity: string, objectId: string, flag: boolean) => Promise<void>;
  setCompletionStatus: (key: string, value: boolean) => void;

  // Reveal mode
  canReveal: boolean;
  isRevealMode: boolean;
  activateRevealMode: () => void;

  // Loading states
  isLoading: boolean;
  error: string | null;
}

const ActivityProviderContext = createContext<ActivityProviderContextType | undefined>(undefined);

export const useActivity = () => {
  const context = useContext(ActivityProviderContext);
  if (!context) {
    throw new Error('useActivity must be used within an ActivityProvider');
  }
  return context;
};

interface ActivityProviderProps {
  children: React.ReactNode;
}

export const ActivityProvider: React.FC<ActivityProviderProps> = ({ children }) => {
  const { selectedObject } = useSelector((state: RootState) => state.migration);
  const { selectedEnvironment } = useSelector((state: RootState) => state.app);

  // State
  const [activityStatusMap, setActivityStatusMap] = useState<Map<string, boolean>>(new Map());
  const [readOnlyFlags, setReadOnlyFlags] = useState<Map<string, boolean>>(new Map());
  const [canReveal, setCanReveal] = useState(false);
  const [isRevealMode, setIsRevealMode] = useState(false);
  const [revealTimeout, setRevealTimeout] = useState<number | null>(null);

  // API hooks
  const [updateActivityStatus] = useUpdateActivityStatusMutation();
  const {
    data: activityData,
    isLoading,
    error,
    refetch
  } = useGetActivityStatusQuery(
    { objectId: selectedObject?.object_id || '' },
    { skip: !selectedObject?.object_id }
  );

  // Update state when activity data changes
  useEffect(() => {
    if (activityData) {
      const statusMap = new Map<string, boolean>();
      const readonlyMap = new Map<string, boolean>();

      activityData.forEach((activity: ActivityModel) => {
        statusMap.set(activity.activity, activity.is_completed);
        readonlyMap.set(activity.activity, activity.read_only);
      });

      setActivityStatusMap(statusMap);
      setReadOnlyFlags(readonlyMap);
    }
  }, [activityData]);

  // Environment change effect
  useEffect(() => {
    if (selectedObject?.object_id) {
      try {
        refetch();
      } catch (error) {
        // Query not started yet, ignore
        console.warn('Cannot refetch activity status on environment change: query not started yet');
      }
    }
  }, [selectedEnvironment?.id, selectedObject?.object_id, refetch]);

  // Reveal mode timeout
  useEffect(() => {
    if (isRevealMode) {
      const timeout = setTimeout(() => {
        setIsRevealMode(false);
        setRevealTimeout(null);
      }, 2 * 60 * 1000); // 2 minutes
      setRevealTimeout(timeout);

      return () => clearTimeout(timeout);
    }
  }, [isRevealMode]);

  // Methods
  const getActivityStatus = useCallback((objectId: string) => {
    if (selectedObject?.object_id) {
      try {
        refetch();
      } catch (error) {
        // Query not started yet, ignore
        console.warn('Cannot refetch activity status: query not started yet');
      }
    }
  }, [refetch, selectedObject?.object_id]);

  const getCompletionStatus = useCallback((key: string): boolean => {
    return activityStatusMap.get(key) || false;
  }, [activityStatusMap]);

  const getReadOnlyFlag = useCallback((key: string): boolean => {
    // Check environment restrictions
    const restrictedEnvs = ['prod', 'qa', 'uat'];
    const isRestrictedEnv = selectedEnvironment?.name &&
      restrictedEnvs.some(env => selectedEnvironment.name.toLowerCase().includes(env));

    if (isRestrictedEnv && !isRevealMode) {
      return true;
    }

    return readOnlyFlags.get(key) || false;
  }, [readOnlyFlags, selectedEnvironment, isRevealMode]);

  const toggleCompletionStatus = useCallback(async (
    activity: string,
    objectId: string,
    currentStatus: boolean
  ) => {
    const newStatus = !currentStatus;

    // Optimistically update UI
    setActivityStatusMap(prev => new Map(prev.set(activity, newStatus)));

    try {
      await updateActivityStatus({
        object_id: objectId,
        activity,
        flag: newStatus,
        allow: false,
      }).unwrap();

      // Success - state already updated
    } catch (error) {
      // Revert on failure
      setActivityStatusMap(prev => new Map(prev.set(activity, currentStatus)));
      throw error;
    }
  }, [updateActivityStatus]);

  const updateStatusToggleButton = useCallback(async (
    activity: string,
    objectId: string,
    flag: boolean
  ) => {
    try {
      await updateActivityStatus({
        object_id: objectId,
        activity,
        flag,
        allow: false,
      }).unwrap();

      // Refresh data
      try {
        refetch();
      } catch (error) {
        // Query not started yet, ignore
        console.warn('Cannot refetch activity status after update: query not started yet');
      }
    } catch (error) {
      throw error;
    }
  }, [updateActivityStatus, refetch]);

  const setCompletionStatus = useCallback((key: string, value: boolean) => {
    setActivityStatusMap(prev => new Map(prev.set(key, value)));
  }, []);

  const activateRevealMode = useCallback(() => {
    if (canReveal) {
      setIsRevealMode(true);
    }
  }, [canReveal]);

  const contextValue: ActivityProviderContextType = {
    activityStatusMap,
    readOnlyFlags,
    getActivityStatus,
    getCompletionStatus,
    getReadOnlyFlag,
    toggleCompletionStatus,
    updateStatusToggleButton,
    setCompletionStatus,
    canReveal,
    isRevealMode,
    activateRevealMode,
    isLoading,
    error: error ? 'Failed to load activity status' : null,
  };

  return (
    <ActivityProviderContext.Provider value={contextValue}>
      {children}
    </ActivityProviderContext.Provider>
  );
};