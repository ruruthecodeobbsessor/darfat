'use client';
import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function CheckButton({ sourceId }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCheck = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/sources/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId })
      });
      await res.json();
      router.refresh();
    } catch (err) {
      alert('Error: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleCheck}
      disabled={loading}
      className="pressable inline-flex h-9 items-center gap-2 rounded-lg bg-orange-50 px-3 text-[13px] font-semibold text-orange-800 hover:bg-orange-100 focus-ring disabled:opacity-50"
    >
      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
      پشکنین
    </button>
  );
}
