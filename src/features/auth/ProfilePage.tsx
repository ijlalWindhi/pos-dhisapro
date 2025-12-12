import { useState } from 'react';
import { User, Lock, Save, Eye, EyeOff } from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authService } from '@/features/auth/services/authService';
import toast from 'react-hot-toast';

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  
  // Profile form
  const [name, setName] = useState(user?.name || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  
  // Password form
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!name.trim()) {
      toast.error('Nama tidak boleh kosong');
      return;
    }
    
    setIsUpdatingProfile(true);
    try {
      await authService.updateProfile(user.id, name.trim());
      if (refreshUser) await refreshUser();
      toast.success('Profil berhasil diperbarui');
    } catch (error) {
      toast.error('Gagal memperbarui profil');
      console.error('Update profile error:', error);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword) {
      toast.error('Masukkan password saat ini');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('Password baru minimal 6 karakter');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi password tidak cocok');
      return;
    }
    
    setIsUpdatingPassword(true);
    try {
      // Re-authenticate first
      await authService.reauthenticate(currentPassword);
      // Then update password
      await authService.updatePassword(newPassword);
      
      toast.success('Password berhasil diperbarui');
      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: unknown) {
      const err = error as Error;
      if (err.message?.includes('wrong-password') || err.message?.includes('invalid-credential')) {
        toast.error('Password saat ini salah');
      } else {
        toast.error('Gagal memperbarui password');
        console.error('Update password error:', error);
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <MainLayout title="Profil">
      <div className="page-header">
        <div>
          <h2 className="page-title">Profil Saya</h2>
          <p className="page-subtitle">Kelola informasi profil dan keamanan akun</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Info */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title flex items-center gap-2">
              <User size={18} />
              Informasi Profil
            </h3>
          </div>
          <form onSubmit={handleUpdateProfile}>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input bg-gray-100"
                  value={user?.email || ''}
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">Email tidak dapat diubah</p>
              </div>
              
              <div className="form-group">
                <label className="form-label">Nama</label>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masukkan nama"
                />
              </div>
              
              <div className="form-group mb-0">
                <label className="form-label">Role</label>
                <input
                  type="text"
                  className="form-input bg-gray-100"
                  value={user?.roleName || '-'}
                  disabled
                />
              </div>
            </div>
            <div className="card-footer">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isUpdatingProfile}
              >
                <Save size={16} />
                {isUpdatingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>

        {/* Password */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title flex items-center gap-2">
              <Lock size={18} />
              Keamanan
            </h3>
          </div>
          <div className="card-body">
            {!showPasswordForm ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock size={28} className="text-gray-400" />
                </div>
                <p className="text-gray-600 mb-4">Ubah password akun Anda untuk keamanan</p>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowPasswordForm(true)}
                >
                  Ubah Password
                </button>
              </div>
            ) : (
              <form onSubmit={handleUpdatePassword}>
                <div className="form-group">
                  <label className="form-label">Password Saat Ini</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      className="form-input pr-10"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Masukkan password saat ini"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Password Baru</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      className="form-input pr-10"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                
                <div className="form-group mb-0">
                  <label className="form-label">Konfirmasi Password Baru</label>
                  <input
                    type="password"
                    className="form-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password baru"
                  />
                </div>
                
                <div className="flex gap-2 mt-4">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={isUpdatingPassword}
                  >
                    <Save size={16} />
                    {isUpdatingPassword ? 'Menyimpan...' : 'Update Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
