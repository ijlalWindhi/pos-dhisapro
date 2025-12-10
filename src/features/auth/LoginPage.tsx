import { Store, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import '@/styles/layout.css';
import '@/styles/button.css';
import '@/styles/form.css';

export function LoginPage() {
  const { signIn } = useAuth();
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
      await signIn(email, password);
      toast.success('Login berhasil!');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Email atau password salah');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-logo">
          <Store size={48} />
        </div>
        <h1 className="login-title">POS DhisaPro</h1>
        <p className="login-subtitle">Masuk untuk mengelola toko Anda</p>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              className="form-input form-input-lg"
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
              className="form-input form-input-lg"
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
            className="btn btn-primary btn-lg btn-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
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
