import React from 'react';
import {
  Tabs,
  Tab,
  Box,
  Badge
} from '@mui/material';
import { Store, Memory, Dashboard, Person ,Settings,CleaningServices,Movie} from '@mui/icons-material';
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
    // Admin/Ajans: 0=LED, 1=Mağaza, 2=TipKuralları, 3=Temizlik, 4=Dashboard, 5=Profil
    return [
      { label: "LED'ler", icon: <Memory />, index: 0 },
      { label: "Mağazalar", icon: <Store />, index: 1 },
      { label: "Tip Kuralları", icon: <Settings />, index: 2 },        // ✅ Index 2
      { label: "Temizlik", icon: <CleaningServices />, index: 3 },     // ✅ Index 3
      { label: "Dashboard", icon: <Dashboard />, index: 4 },           // ✅ Index 4
      { label: "Profil", icon: <Person />, index: 5 },                  // ✅ Index 5
      { label: "Projeler", icon: <Movie />, index: 6 }
    ];
  } else {
    // Müşteri: 0=LED, 1=Mağaza, 2=Profil
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
      key={`tab-${tab.index}`}  // ✅ Unique key eklendi
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