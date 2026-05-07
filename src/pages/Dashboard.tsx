import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuth } from '../lib/useAuth';
import { handleFirestoreError, OperationType } from '../lib/utils';
import { Copy, Trash2, ExternalLink, QrCode, Check, BarChart2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';

export function Dashboard() {
  const { user, loading } = useAuth();
  const [links, setLinks] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrModal, setQrModal] = useState<{ isOpen: boolean; url: string }>({ isOpen: false, url: '' });

  const appUrl = (import.meta as any).env.VITE_APP_URL || window.location.origin;

  useEffect(() => {
    async function fetchLinks() {
      if (!user) {
        setFetching(false);
        return;
      }
      try {
        const q = query(collection(db, 'links'), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const fetched = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        // Sort on client side to avoid composite index requirement
        fetched.sort((a: any, b: any) => {
          const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return bTime - aTime;
        });
        setLinks(fetched);
      } catch (err) {
        try {
          handleFirestoreError(err, OperationType.LIST, 'links', auth);
        } catch(e) {
          console.error(e);
        }
      } finally {
        setFetching(false);
      }
    }
    fetchLinks();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this link?")) return;
    try {
      await deleteDoc(doc(db, 'links', id));
      setLinks(prev => prev.filter(l => l.id !== id));
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.DELETE, `links/${id}`, auth);
      } catch (e) {
        console.error(e);
        alert(e);
      }
    }
  };

  const copyLink = (code: string) => {
    const fullUrl = `${appUrl}/${code}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading || fetching) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-black text-slate-900 mb-2">Access Denied</h2>
        <p className="text-slate-600 mb-6">Please sign in to view your dashboard.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-1">Manage and track your shortened links</p>
        </div>
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex gap-8">
          <div>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-wider mb-1">Total Links</p>
            <p className="text-2xl font-black text-slate-900">{links.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        {links.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <BarChart2 className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <p className="text-lg font-bold text-slate-900">No links yet</p>
            <p className="mt-1">Go to the homepage to create your first short link.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                  <th className="px-6 py-4">Original URL</th>
                  <th className="px-6 py-4">Short Link</th>
                  <th className="px-6 py-4">Created</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {links.map((link) => (
                  <tr key={link.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <a href={link.originalUrl} target="_blank" rel="noreferrer" className="text-slate-900 font-semibold truncate max-w-[200px] sm:max-w-xs md:max-w-md inline-block hover:underline" title={link.originalUrl}>
                        {link.originalUrl.replace(/^https?:\/\//, '')}
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <a href={`/${link.shortCode}`} target="_blank" rel="noreferrer" className="text-indigo-600 font-bold flex items-center gap-1 hover:underline group">
                        {link.shortCode}
                        <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition" />
                      </a>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm whitespace-nowrap font-medium">
                      {link.createdAt ? format(link.createdAt.toMillis(), 'MMM d, yyyy') : 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          title="Copy Link"
                          onClick={() => copyLink(link.shortCode)}
                          className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                        >
                          {copiedId === link.shortCode ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                        </button>
                        <button
                          title="Show QR Code"
                          onClick={() => setQrModal({ isOpen: true, url: `${appUrl}/${link.shortCode}`})}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                        >
                          <QrCode size={18} />
                        </button>
                        <button
                          title="Delete Link"
                          onClick={() => handleDelete(link.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {qrModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setQrModal({ isOpen: false, url: '' })}>
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-900">QR Code</h3>
              <button onClick={() => setQrModal({ isOpen: false, url: '' })} className="text-slate-400 hover:text-slate-900">&times;</button>
            </div>
            <div className="p-8 flex items-center justify-center bg-slate-50">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <QRCodeSVG value={qrModal.url} size={200} level="H" includeMargin={false} />
              </div>
            </div>
            <div className="p-4 bg-white text-center">
              <p className="text-sm font-medium text-slate-500 mb-4 break-all">{qrModal.url}</p>
              <button 
                onClick={() => {
                  const svg = document.querySelector('svg');
                  if (svg) {
                    const svgData = new XMLSerializer().serializeToString(svg);
                    const canvas = document.createElement("canvas");
                    const svgSize = svg.getBoundingClientRect();
                    canvas.width = svgSize.width;
                    canvas.height = svgSize.height;
                    const ctx = canvas.getContext("2d");
                    const img = document.createElement("img");
                    img.setAttribute("src", "data:image/svg+xml;base64," + btoa(svgData));
                    img.onload = function() {
                      if(ctx) {
                        ctx.fillStyle = "white";
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(img, 0, 0);
                        const canvasdata = canvas.toDataURL("image/png");
                        const a = document.createElement("a");
                        a.download = "qr-code.png";
                        a.href = canvasdata;
                        a.click();
                      }
                    }
                  }
                }}
                className="w-full py-3 bg-indigo-600 text-white rounded-[16px] font-bold hover:bg-indigo-700 transition"
              >
                Download PNG
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
