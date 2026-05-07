import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Loader2, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { handleFirestoreError, OperationType } from '../lib/utils';

export function Redirect() {
  const { shortCode } = useParams<{ shortCode: string }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function performRedirect() {
      if (!shortCode) return;
      
      try {
        const docRef = doc(db, 'links', shortCode);
        let docSnap;
        try {
          docSnap = await getDoc(docRef);
        } catch(err) {
          handleFirestoreError(err, OperationType.GET, `links/${shortCode}`, auth);
          return;
        }

        if (docSnap && docSnap.exists()) {
          const data = docSnap.data();
          const targetUrl = data.originalUrl;
          
          try {
            // Increment analytics
            await updateDoc(docRef, {
              clicks: increment(1),
              updatedAt: serverTimestamp()
            });
          } catch(err) {
            handleFirestoreError(err, OperationType.UPDATE, `links/${shortCode}`, auth);
            // We ignore error here to ensure redirect still works instead of returning
          }
          
          // Redirect
          window.location.href = targetUrl;
        } else {
          setError('We could not find that short link in our system.');
        }
      } catch (err) {
        console.error(err);
        setError('An error occurred while redirecting.');
      }
    }

    performRedirect();
  }, [shortCode]);

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 h-full">
        <div className="max-w-md w-full bg-white p-8 rounded-[40px] shadow-2xl shadow-rose-900/5 border border-slate-100 text-center">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Link Not Found</h2>
          <p className="text-slate-500 mb-8">{error}</p>
          <a href="/" className="inline-block bg-indigo-600 text-white px-8 py-4 rounded-[32px] font-black hover:bg-indigo-700 transition">
            Create a new SnipLink
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50">
      <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
      <h2 className="text-xl font-bold text-slate-900">Redirecting...</h2>
    </div>
  );
}
