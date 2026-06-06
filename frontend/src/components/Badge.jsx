const statusColors = {
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  paid: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  selected: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  confirmed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  delivered: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  pending_payment: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  draft: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  open: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  blocked: 'bg-red-50 text-red-700 ring-red-600/20',
  rejected: 'bg-red-50 text-red-700 ring-red-600/20',
  overdue: 'bg-red-50 text-red-700 ring-red-600/20',
  cancelled: 'bg-red-50 text-red-700 ring-red-600/20',
  published: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  submitted: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
};

const Badge = ({ status, size = 'md' }) => {
  const normalized = (status || '').toLowerCase().replace(/\s+/g, '_');
  const colorClass = statusColors[normalized] || 'bg-slate-50 text-slate-600 ring-slate-500/20';
  const sizeClass = sizeClasses[size] || sizeClasses.md;

  const displayText = (status || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ring-1 ring-inset animate-fade-in ${colorClass} ${sizeClass}`}
    >
      {displayText}
    </span>
  );
};

export default Badge;
