import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link2, Scissors, Shield, ArrowRight, Check, Copy } from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/useAuth';
import { handleFirestoreError, OperationType } from '../lib/utils';
import { auth } from '../lib/firebase';

function generateShortCode() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function Home() {
  const { user } = useAuth();
  const [url, setUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shortUrl, setShortUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setIsLoading(true);
    setShortUrl(null);
    setError(null);
    setIsCopied(false);

    try {
      // Basic URL validation
      const validUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
      new URL(validUrl); // Throws if invalid

      let code = customAlias.trim() || generateShortCode();
      if (customAlias) {
        if (!/^[a-zA-Z0-9_\-]+$/.test(customAlias)) {
          throw new Error('Custom alias can only contain letters, numbers, hyphens, and underscores.');
        }
      }
      
      let unique = false;
      let path = `links/${code}`;
      
      if (customAlias) {
        try {
          const docRef = doc(db, 'links', code);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
             throw new Error('Custom alias is already taken. Please choose another.');
          } else {
             unique = true;
          }
        } catch(err: any) {
          if (err.message === 'Custom alias is already taken. Please choose another.') throw err;
          handleFirestoreError(err, OperationType.GET, path, auth);
        }
      } else {
        // Ensure uniqueness safely
        for (let attempts = 0; attempts < 5; attempts++) {
          try {
            const docRef = doc(db, 'links', code);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
              unique = true;
              break;
            }
          } catch (err) {
            handleFirestoreError(err, OperationType.GET, path, auth);
          }
          code = generateShortCode();
          path = `links/${code}`;
        }
      }

      if (!unique) throw new Error('Could not generate a unique code. Try again.');

      const linkData = {
        originalUrl: validUrl,
        shortCode: code,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...(user ? { userId: user.uid } : {})
      };

      try {
        await setDoc(doc(db, 'links', code), linkData);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path, auth);
      }

      const appUrl = (import.meta as any).env.VITE_APP_URL || window.location.origin;
      setShortUrl(`${appUrl}/${code}`);
      setUrl('');
      setCustomAlias('');
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (shortUrl) {
      navigator.clipboard.writeText(shortUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 w-full max-w-5xl mx-auto">
      <div className="w-full text-center space-y-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            SnipLink 2.0 is Live
          </span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-6xl font-black text-slate-900 leading-tight"
        >
          Shorten. Share. <span className="text-indigo-600 underline decoration-indigo-200">Succeed.</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-slate-500 max-w-3xl mx-auto"
        >
          The all-in-one link engine with SEO-ready slugs, and instant branding.
        </motion.p>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-4xl bg-white p-4 rounded-[40px] shadow-2xl border border-slate-100"
      >
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex flex-col sm:flex-row items-stretch gap-2 bg-slate-50 rounded-[32px] p-2 border border-slate-100/50">
            <div className="relative flex-1 flex items-center px-4">
              <Link2 className="absolute left-6 text-slate-400" size={24} />
              <input
                type="url"
                placeholder="Paste your long, messy link here..."
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border-none bg-transparent text-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0"
              />
            </div>
            {user && (
              <div className="relative w-full sm:w-64 flex items-center border-t sm:border-t-0 sm:border-l border-slate-200 pl-2">
                <span className="absolute left-6 text-slate-400 font-medium select-none">/</span>
                <input
                  type="text"
                  placeholder="Custom alias (opt)"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value)}
                  className="w-full pl-10 pr-4 py-4 rounded-2xl border-none bg-transparent text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0 text-md"
                />
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading || !url}
            className="flex items-center justify-center gap-2 px-10 py-5 bg-indigo-600 text-white rounded-[32px] text-lg font-black hover:bg-indigo-700 transition-colors shadow-xl shadow-indigo-200 disabled:opacity-75 disabled:cursor-not-allowed shrink-0"
          >
            {isLoading ? (
              <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <Scissors size={20} strokeWidth={2.5} />
                Bolt It!
              </>
            )}
          </button>
        </form>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-4 text-red-600 bg-red-50 rounded-xl"
          >
            {error}
          </motion.div>
        )}
        
        {shortUrl && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-2xl mt-8 p-6 bg-white rounded-2xl border border-gray-100 shadow-lg shadow-gray-200/50"
          >
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Your short link</h3>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <a href={shortUrl} target="_blank" rel="noreferrer" className="text-xl font-semibold text-blue-600 hover:text-blue-700 truncate w-full sm:w-auto">
                {shortUrl}
              </a>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition flex-shrink-0 w-full sm:w-auto justify-center"
              >
                {isCopied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                {isCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            {!user && (
              <div className="mt-4 text-center text-sm text-slate-500">
                Log in to claim this link and customize aliases!
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl"
      >
        <div className="bg-white p-6 justify-start rounded-3xl border border-slate-100 shadow-sm flex flex-col items-start transition hover:shadow-md">
          <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center mb-4">
            <Link2 size={22} strokeWidth={2.5} />
          </div>
          <h3 className="font-bold text-slate-800 text-lg">SEO Optimized</h3>
          <p className="text-sm text-slate-500 mt-1">Perfect indexable slugs for Google ranking and speedy delivery.</p>
        </div>
        <div className="bg-white p-6 justify-start rounded-3xl border border-slate-100 shadow-sm flex flex-col items-start transition hover:shadow-md">
          <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center mb-4">
            <Shield size={22} strokeWidth={2.5} />
          </div>
          <h3 className="font-bold text-slate-800 text-lg">Privacy First</h3>
          <p className="text-sm text-slate-500 mt-1">No tracking, no cookies. Lightning fast and completely private redirects.</p>
        </div>
        <div className="bg-white p-6 justify-start rounded-3xl border border-slate-100 shadow-sm flex flex-col items-start transition hover:shadow-md">
          <div className="w-10 h-10 bg-violet-100 text-violet-600 rounded-lg flex items-center justify-center mb-4">
            <Scissors size={22} strokeWidth={2.5} />
          </div>
          <h3 className="font-bold text-slate-800 text-lg">Custom Links</h3>
          <p className="text-sm text-slate-500 mt-1">Personalize your brands links for better click-through rates.</p>
        </div>
      </motion.div>
    </div>
  );
}
