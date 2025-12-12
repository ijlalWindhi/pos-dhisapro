import { Store, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from './hooks/useAuth';

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Email dan password harus diisi');
      return;
    }
    
    setIsLoading(true);
    try {
      const redirectPath = await signIn(email, password);
      toast.success('Login berhasil!');
      // Redirect to first accessible page based on permissions
      navigate({ to: redirectPath });
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Email atau password salah');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 to-primary-800 p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center mx-auto mb-4 text-white">
          <Store size={32} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">POS DhisaPro</h1>
        <p className="text-sm text-gray-500 mb-6">Masuk untuk mengelola toko Anda</p>
        
        <form onSubmit={handleSubmit} className="text-left">
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              className="form-input"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              autoComplete="email"
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              autoComplete="current-password"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary btn-full mt-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <span>Masuk</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
