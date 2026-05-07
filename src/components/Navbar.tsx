import { Link } from 'react-router-dom';
import { useAuth } from '../lib/useAuth';
import { auth } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { Link as LinkIcon, LogIn, LogOut, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
  const { user, loading } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <nav className="sticky top-0 z-50 w-full h-20 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-12 flex items-center justify-between shrink-0">
      <div className="w-full mx-auto max-w-7xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-700 transition">
              <LinkIcon size={24} strokeWidth={2} className="text-white" />
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tight italic">SnipLink</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {!loading && (
            user ? (
              <>
                <Link to="/dashboard" className="text-sm font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5">
                  <LayoutDashboard size={16} />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
                <div className="h-4 w-px bg-slate-300"></div>
                <div className="flex items-center gap-3">
                  <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`} alt="Avatar" className="w-8 h-8 rounded-full border border-slate-200" />
                  <button onClick={handleLogout} className="text-sm font-bold text-slate-700 hover:text-rose-600 flex items-center gap-1.5 transition">
                    <LogOut size={16} />
                    <span className="hidden sm:inline">Log Out</span>
                  </button>
                </div>
              </>
            ) : (
              <button 
                onClick={handleLogin} 
                disabled={isLoggingIn}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-full text-sm font-bold shadow-lg shadow-indigo-200 flex items-center gap-2 hover:bg-indigo-700 transition disabled:opacity-50"
              >
                <LogIn size={18} />
                {isLoggingIn ? 'Connecting...' : 'Login'}
              </button>
            )
          )}
        </div>
      </div>
    </nav>
  );
}
