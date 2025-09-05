// frontend/src/components/Navigation.tsx
import React from 'react';
import { Tabs, Tab, Box, Paper } from '@mui/material';
import {
  Tv,
  Store,
  AspectRatio,
  CleaningServices,
  Dashboard,
  AccountCircle,
  Movie,
  ViewModule
} from '@mui/icons-material';

interface NavigationProps {
  currentTab: number;
  onTabChange: (newValue: number) => void;
  userRole: string;
}

const Navigation: React.FC<NavigationProps> = ({ currentTab, onTabChange, userRole }) => {
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    onTabChange(newValue);
  };

  const canManage = userRole === 'admin' || userRole === 'ajans';

  const adminTabs = [
    { label: 'LED Paneller', icon: <Tv /> },
    { label: 'Mağazalar', icon: <Store /> },
    { label: 'Tip Kuralları', icon: <AspectRatio /> },
    { label: 'Temizlik', icon: <CleaningServices /> },
    { label: 'Dashboard', icon: <Dashboard /> },
    { label: 'Profil', icon: <AccountCircle /> },
    { label: 'Projeler', icon: <Movie /> },
    { label: 'Template\'ler', icon: <ViewModule /> },
   
    { label: 'LED Paneller', value: 0 },
    { label: 'Mağazalar', value: 1 },
    { label: 'Projeler', value: 2 }, // YENİ
    { label: 'Template\'ler', value: 3 }, // YENİ
    { label: 'Render Queue', value: 4 }, // YENİ
  ];

  const customerTabs = [
    { label: 'LED Paneller', value: 0 },
    { label: 'Mağazalar', value: 1 },
    { label: 'LED Paneller', icon: <Tv /> },
    { label: 'Mağazalar', icon: <Store /> },
    { label: 'Profil', icon: <AccountCircle /> }
  ];

  const tabs = canManage ? adminTabs : customerTabs;

  return (
    <Paper elevation={1} sx={{ mb: 3 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={currentTab}
          onChange={handleChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="dashboard navigation"
        >
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              icon={tab.icon}
              label={tab.label}
              iconPosition="start"
              sx={{ minHeight: 64 }}
            />
          ))}
        </Tabs>
      </Box>
    </Paper>
  );
};

export default Navigation;