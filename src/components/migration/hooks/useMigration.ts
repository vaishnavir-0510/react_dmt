// components/migration/hooks/useMigration.ts
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import type { MigrationObject, MigrationTab } from '../../../types';
import { 
  setSelectedObject, 
  setActiveTab, 
  setMigrationName,
  clearMigrationData 
} from '../../../store/slices/migrationSlice';

export const useMigration = () => {
  const dispatch = useDispatch();
  const migration = useSelector((state: RootState) => state.migration);

  const selectObject = (object: MigrationObject) => {
    dispatch(setSelectedObject(object));
  };

  const changeTab = (tab: MigrationTab) => {
    dispatch(setActiveTab(tab));
  };

  const updateMigrationName = (name: string) => {
    dispatch(setMigrationName(name));
  };

  const resetMigration = () => {
    dispatch(clearMigrationData());
  };

  return {
    ...migration,
    selectObject,
    changeTab,
    updateMigrationName,
    resetMigration,
  };
};