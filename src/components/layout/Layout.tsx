import React from 'react';
import { Box, Toolbar } from '@mui/material';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { SettingsSidebar } from './SettingsSidebar';
import { IdleTimeoutDialog } from '../auth/IdleTimeoutDialog';
import { useIdleTimerHook } from '../../hooks/useIdleTimer';
import { setupActivityListeners } from '../../utils/session';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { currentView, isSidebarOpen } = useSelector((state: RootState) => state.app);
  const {
    showIdleDialog,
    countdown,
    handleStayActive,
    handleLogout,
  } = useIdleTimerHook();

  React.useEffect(() => {
    if (isAuthenticated) {
      const cleanup = setupActivityListeners();
      return cleanup;
    }
  }, [isAuthenticated]);

  const sidebarWidth = 280;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
      <Header />
      
      {/* Main container */}
      <Box sx={{ display: 'flex', width: '100%', mt: '64px', position: 'relative' }}>
        
        {/* Sidebar Area */}
        <Box sx={{ 
          width: (currentView === 'application' && isSidebarOpen) || currentView === 'settings' ? sidebarWidth : 0,
          transition: 'width 0.3s ease',
          overflow: 'hidden',
          flexShrink: 0,
          position: 'relative',
          zIndex: 1200, // Standard MUI drawer z-index
        }}>
          {currentView === 'application' && <Sidebar />}
          {currentView === 'settings' && <SettingsSidebar />}
        </Box>
        
        {/* Main Content Area */}
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1,
            p: 3,
            width: (currentView === 'application' && isSidebarOpen) || currentView === 'settings' ? `calc(100% - ${sidebarWidth}px)` : '100%',
            transition: 'width 0.3s ease',
            minHeight: 'calc(100vh - 64px)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {children}
        </Box>
      </Box>

      <IdleTimeoutDialog
        open={showIdleDialog}
        countdown={countdown}
        onStayActive={handleStayActive}
        onLogout={handleLogout}
      />
    </Box>
  );
};