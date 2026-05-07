import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Loader2, AlertCircle } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/utils';

export function Redirect() {
  const { shortCode } = useParams<{ shortCode: string }>();
  const [error, setError] = useState<string | null>(null);
  const isProcessing = useRef(false);

  useEffect(() => {
    async function performRedirect() {
      if (!shortCode || isProcessing.current) return;
      isProcessing.current = true;
      
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
            // Trigger analytics update
            const updatePromise = updateDoc(docRef, {
              clicks: increment(1),
              updatedAt: serverTimestamp()
            });

            // Race the update against a very short 150ms timeout.
            // This guarantees the redirect feels instant, even if the database write is slow,
            // while still allowing the write sufficient time to dispatch to the network.
            await Promise.race([
              updatePromise,
              new Promise((resolve) => setTimeout(resolve, 150))
            ]);
          } catch(err) {
            console.error("Analytics update skipped or failed", err);
          }
          
          // Use replace instead of href to avoid cluttering browser history
          window.location.replace(targetUrl);
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
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 h-[100dvh]">
      <div className="flex flex-col items-center animate-pulse">
        <Loader2 className="animate-spin text-indigo-600 mb-6" size={56} strokeWidth={3} />
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Bolt It!</h2>
        <p className="text-slate-500 font-medium mt-2">Connecting to your destination...</p>
      </div>
    </div>
  );
}
