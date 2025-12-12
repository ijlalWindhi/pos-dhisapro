import { ShieldX, ArrowLeft } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function ForbiddenPage() {
  const { getDefaultRoute } = useAuth();
  const defaultRoute = getDefaultRoute();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-danger-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldX className="w-10 h-10 text-danger-600" />
        </div>
        <h1 className="text-6xl font-bold text-gray-900 mb-2">403</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Akses Ditolak</h2>
        <p className="text-gray-500 mb-8">
          Anda tidak memiliki izin untuk mengakses halaman ini. 
          Silakan hubungi administrator jika Anda merasa ini adalah kesalahan.
        </p>
        <Link to={defaultRoute} className="btn btn-primary">
          <ArrowLeft size={18} />
          <span>Kembali</span>
        </Link>
      </div>
    </div>
  );
}
