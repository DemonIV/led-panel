// frontend/src/components/Dashboard.tsx - DÜZELTİLMİŞ VERSİYON
import React, { useState } from 'react';
import { Container, Box } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';
import Navigation from './Navigation';
import LEDList from './LEDList';
import MagazaList from './MagazaList';
import UserProfile from './UserProfile';
import RealDashboard from './RealDashboard';
import AspectRulesManagement from './AspectRulesManagement';
import CleanupManagement from './CleanupManagement';
import ProjectManagement from './ProjectManagement';

const Dashboard: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const { user } = useAuth();

  const handleTabChange = (newValue: number) => {
    setCurrentTab(newValue);
  };

  const renderTabContent = () => {
  const canManage = user?.role === 'admin' || user?.role === 'ajans';
  
  if (canManage) {
    // Admin/Ajans tab yapısı: 0=LED, 1=Mağaza, 2=TipKuralları, 3=Temizlik, 4=Dashboard, 5=Profil
    switch (currentTab) {
      case 0: return <LEDList />;
      case 1: return <MagazaList />;
      case 2: return <AspectRulesManagement />;
      case 3: return <CleanupManagement />;     // ✅ YENİ
      case 4: return <RealDashboard />;
      case 5: return <UserProfile />;
      case 6: return <ProjectManagement />; // Admin/Ajans tab yapısında 
      default: return <LEDList />;
    }
  } else {
    // Müşteri tab yapısı: 0=LED, 1=Mağaza, 2=Profil (Temizlik yok)
    switch (currentTab) {
      case 0: return <LEDList />;
      case 1: return <MagazaList />;
      case 2: return <UserProfile />;
      default: return <LEDList />;
    }
  }
};

  return (
    <Box>
      <Header />
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Navigation 
          currentTab={currentTab} 
          onTabChange={handleTabChange}
          userRole={user?.role || ''}
        />
        {renderTabContent()}
      </Container>
    </Box>
  );
};

export default Dashboard;