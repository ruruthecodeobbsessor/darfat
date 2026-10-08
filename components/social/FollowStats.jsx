export function FollowStats({ stats }) {
  const items = [
    ["پۆست", stats.posts],
    ["فۆڵۆوەر", stats.followers],
    ["فۆڵۆکراو", stats.following],
  ];
  return (
    <dl className="grid grid-cols-3 divide-x divide-x-reverse divide-slate-200 rounded-2xl border border-slate-200 bg-white text-center">
      {items.map(([label, value]) => (
        <div key={label} className="flex flex-col-reverse px-3 py-3">
          <dt className="text-xs text-slate-500">{label}</dt>
          <dd className="text-xl font-extrabold text-slate-900">{value.toLocaleString("ckb")}</dd>
        </div>
      ))}
    </dl>
  );
}
