import React from 'react';
import {
  Tabs,
  Tab,
  Box,
  Badge
} from '@mui/material';
import { Store, Memory, Dashboard, Person } from '@mui/icons-material';

interface NavigationProps {
  currentTab: number;
  onTabChange: (newValue: number) => void;
  userRole: string;
}

const Navigation: React.FC<NavigationProps> = ({ currentTab, onTabChange, userRole }) => {
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    onTabChange(newValue);
  };

  // Role-based tab visibility
  const canManage = userRole === 'admin' || userRole === 'ajans';

  // Tab configuration based on role
  const getTabConfig = () => {
    if (canManage) {
      // Admin/Ajans: LED'ler, Mağazalar, Dashboard, Profil
      return [
        { label: "LED'ler", icon: <Memory />, index: 0 },
        { label: "Mağazalar", icon: <Store />, index: 1 },
        { label: "Dashboard", icon: <Dashboard />, index: 2 },
        { label: "Profil", icon: <Person />, index: 3 }
      ];
    } else {
      // Müşteri: LED'ler, Mağazalar, Profil (Dashboard yok)
      return [
        { label: "LED'ler", icon: <Memory />, index: 0 },
        { label: "Mağazalar", icon: <Store />, index: 1 },
        { label: "Profil", icon: <Person />, index: 2 }
      ];
    }
  };

  const tabs = getTabConfig();

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
      <Tabs value={currentTab} onChange={handleChange} aria-label="navigation tabs">
        {tabs.map((tab) => (
          <Tab 
            key={tab.index}
            icon={tab.icon} 
            label={tab.label} 
            iconPosition="start"
          />
        ))}
      </Tabs>
    </Box>
  );
};

export default Navigation;