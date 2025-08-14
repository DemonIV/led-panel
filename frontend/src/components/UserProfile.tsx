import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Divider,
  Card,
  CardContent,
  Stack
} from '@mui/material';
import { Person, AdminPanelSettings, Business, AccountCircle, Login } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface LoginLog {
  logID: number;
  action: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

interface UserProfileData {
  userID: number;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  recentLogins: LoginLog[];
}

const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const response = await api.get('/auth/profile');
      setProfileData(response.data);
    } catch (error) {
      console.error('Profil verisi alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <AdminPanelSettings />;
      case 'ajans': return <Business />;
      case 'musteri': return <AccountCircle />; // CustomerSupport yerine
      default: return <Person />;
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'Sistem Yöneticisi';
      case 'ajans': return 'Ajans Kullanıcısı';
      case 'musteri': return 'Müşteri';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'error';
      case 'ajans': return 'warning';
      case 'musteri': return 'info';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR');
  };

  const getBrowserInfo = (userAgent: string) => {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Bilinmeyen';
  };

  if (loading) {
    return <Typography>Profil yükleniyor...</Typography>;
  }

  if (!profileData) {
    return <Typography>Profil verisi alınamadı.</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Kullanıcı Profili
      </Typography>

      <Stack spacing={3}>
        {/* Kullanıcı Bilgileri ve Yetkiler yan yana */}
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {/* Kullanıcı Bilgileri */}
          <Card sx={{ flex: 1, minWidth: 300 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ width: 64, height: 64, mr: 2, bgcolor: 'primary.main' }}>
                  {getRoleIcon(profileData.role)}
                </Avatar>
                <Box>
                  <Typography variant="h5" gutterBottom>
                    {profileData.username}
                  </Typography>
                  <Chip 
                    label={getRoleText(profileData.role)}
                    color={getRoleColor(profileData.role)}
                    icon={getRoleIcon(profileData.role)}
                  />
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    E-posta
                  </Typography>
                  <Typography variant="body1">
                    {profileData.email}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Kullanıcı ID
                  </Typography>
                  <Typography variant="body1">
                    #{profileData.userID}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Hesap Oluşturulma
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(profileData.createdAt)}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Yetkilendirmeler */}
          <Card sx={{ flex: 1, minWidth: 300 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Yetkilendirmeler
              </Typography>

              <Box sx={{ mt: 2 }}>
                {profileData.role === 'admin' && (
                  <Stack spacing={1}>
                    <Chip label="LED Ekleme/Düzenleme" color="success" size="small" />
                    <Chip label="LED Silme" color="success" size="small" />
                    <Chip label="Mağaza Yönetimi" color="success" size="small" />
                    <Chip label="Kullanıcı Yönetimi" color="success" size="small" />
                    <Chip label="Tüm Raporlar" color="success" size="small" />
                  </Stack>
                )}

                {profileData.role === 'ajans' && (
                  <Stack spacing={1}>
                    <Chip label="LED Ekleme/Düzenleme" color="success" size="small" />
                    <Chip label="Mağaza Ekleme/Düzenleme" color="success" size="small" />
                    <Chip label="Tarih Görüntüleme" color="success" size="small" />
                    <Chip label="LED Silme" color="error" size="small" />
                  </Stack>
                )}

                {profileData.role === 'musteri' && (
                  <Stack spacing={1}>
                    <Chip label="LED Görüntüleme" color="success" size="small" />
                    <Chip label="Filtreleme" color="success" size="small" />
                    <Chip label="LED Ekleme/Düzenleme" color="error" size="small" />
                    <Chip label="Tarih Görüntüleme" color="error" size="small" />
                  </Stack>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Giriş Logları */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Login sx={{ mr: 1 }} />
              Son Giriş Logları
            </Typography>

            {profileData.recentLogins && profileData.recentLogins.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Tarih</TableCell>
                      <TableCell>IP Adresi</TableCell>
                      <TableCell>Tarayıcı</TableCell>
                      <TableCell>İşlem</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {profileData.recentLogins.map((log) => (
                      <TableRow key={log.logID}>
                        <TableCell>
                          {formatDate(log.createdAt)}
                        </TableCell>
                        <TableCell>
                          {log.ipAddress || 'Bilinmiyor'}
                        </TableCell>
                        <TableCell>
                          {getBrowserInfo(log.userAgent || '')}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={log.action} 
                            color="primary" 
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Henüz giriş logu bulunmuyor.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
};

export default UserProfile;