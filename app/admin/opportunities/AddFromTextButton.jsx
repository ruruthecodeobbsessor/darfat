'use client';
import { useEffect, useState } from 'react';
import { FileText, Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function AddFromTextButton() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Close with Escape, like any dialog.
  useEffect(() => {
    if (!open || loading) return;
    const onKey = (event) => event.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, loading]);

  const handleExtract = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/opportunities/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Successfully extracted ${data.count} opportunity(ies). They are saved as drafts.`);
        setOpen(false);
        setText('');
        router.refresh();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="pressable inline-flex h-11 items-center gap-2 rounded-xl bg-orange-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 focus-ring"
      >
        <Plus className="w-4 h-4" />
        زیادکردن لە دەقەوە
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onClick={() => !loading && setOpen(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="extract-title" onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-t-3xl bg-white p-6 shadow-xl sm:rounded-3xl">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 id="extract-title" className="flex items-center gap-2 text-[17px] font-semibold text-slate-900">
                <FileText className="h-5 w-5 text-orange-600" aria-hidden="true" />
                دەق لێرە دابنێ بۆ دەرهێنانی دەرفەت بە AI
              </h2>
              <button onClick={() => setOpen(false)} aria-label="داخستن" className="pressable flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 focus-ring">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <textarea
              className="mb-4 h-64 w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-[15px] leading-7 outline-none placeholder:text-slate-400 focus-visible:border-orange-500 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-orange-500/15"
              placeholder="دەقی ئیمەیڵ، پۆست، یان لاپەڕەیەک لێرە دابنێ..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={loading}
              dir="auto"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setOpen(false)}
                className="pressable h-11 rounded-xl px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100 focus-ring"
                disabled={loading}
              >
                پاشگەزبوونەوە
              </button>
              <button
                onClick={handleExtract}
                disabled={loading || !text.trim()}
                className="pressable flex h-11 items-center gap-2 rounded-xl bg-orange-600 px-6 text-sm font-semibold text-white hover:bg-orange-700 focus-ring disabled:opacity-45"
              >
                {loading ? 'لە کارکردندایە...' : 'دەرهێنان'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
