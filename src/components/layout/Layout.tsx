// // components/layout/Layout.tsx
// import React from 'react';
// import { Box } from '@mui/material';
// import { useSelector } from 'react-redux';
// import type { RootState } from '../../store';
// import { Header } from './Header';
// import { Sidebar } from './Sidebar';
// import { SettingsSidebar } from './SettingsSidebar';
// import { BackupSidebar } from './BackupSidebar';
// import { TranslationSidebar } from './TranslationSidebar';

// interface LayoutProps {
//   children: React.ReactNode;
// }

// export const Layout: React.FC<LayoutProps> = ({ children }) => {
//   const { currentView, currentApp, isSidebarOpen } = useSelector((state: RootState) => state.app);

//   const renderSidebar = () => {
//     if (currentView === 'settings') {
//       return <SettingsSidebar />;
//     }
    
//     switch (currentApp) {
//       case 'backup':
//         return <BackupSidebar />;
//       case 'translation':
//         return <TranslationSidebar />;
//       case 'migration':
//       default:
//         return <Sidebar />;
//     }
//   };

//   return (
//     <Box sx={{ display: 'flex' }}>
//       <Header />
      
//       {/* Render the appropriate sidebar */}
//       {renderSidebar()}
      
//       <Box
//         component="main"
//         sx={{
//           flexGrow: 1,
//           p: 3,
//           width: '100%', // Always take full width
//           transition: (theme) => theme.transitions.create(['margin'], {
//             easing: theme.transitions.easing.sharp,
//             duration: theme.transitions.duration.leavingScreen,
//           }),
//         }}
//       >
//         {/* Add top padding to account for the fixed header */}
//         <Box sx={{ mt: 8 }}>
//           {children}
//         </Box>
//       </Box>
//     </Box>
//   );
// };

// components/layout/Layout.tsx
import React from 'react';
import { Box } from '@mui/material';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { SettingsSidebar } from './SettingsSidebar';
import { BackupSidebar } from './BackupSidebar';
import { TranslationSidebar } from './TranslationSidebar';
import { FileMigrationSidebar } from './FileMigrationSidebar';
import { IdleTimeoutDialog } from '../auth/IdleTimeoutDialog';
import { useIdleTimerHook } from '../../hooks/useIdleTimer';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentView, currentApp, isSidebarOpen } = useSelector((state: RootState) => state.app);
  
  // Add the hook here
  const { 
    showIdleDialog, 
    countdown, 
    handleStayActive, 
    handleLogout 
  } = useIdleTimerHook();

  const renderSidebar = () => {
    if (currentView === 'settings') {
      return <SettingsSidebar />;
    }

    switch (currentApp) {
      case 'backup':
        return <BackupSidebar />;
      case 'translation':
        return <TranslationSidebar />;
      case 'file migration':
        return <FileMigrationSidebar />;
      case 'migration':
      default:
        return <Sidebar />;
    }
  };

  return (
    <Box sx={{ display: 'flex', overflowX: 'hidden' }}>
      <Header />
      
      {/* Render the appropriate sidebar */}
      {renderSidebar()}
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: '100%',
          overflowX: 'hidden',
          transition: (theme) => theme.transitions.create(['margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Box sx={{ mt: 8, overflowX: 'hidden' }}>
          {children}
        </Box>
      </Box>

      {/* Add the Idle Timeout Dialog */}
      <IdleTimeoutDialog 
        open={showIdleDialog}
        countdown={countdown}
        onStayActive={handleStayActive}
        onLogout={handleLogout}
      />
    </Box>
  );
};