const STATUS_STYLES = {
  created:     'bg-slate-100 text-slate-700',
  dispatched:  'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  resolved:    'bg-emerald-100 text-emerald-700',
  cancelled:   'bg-red-100 text-red-700',
  active:      'bg-emerald-100 text-emerald-700',
  inactive:    'bg-slate-100 text-slate-600',
  available:   'bg-emerald-100 text-emerald-700',
  out_of_service: 'bg-red-100 text-red-700',
};

const TYPE_STYLES = {
  medical:  'bg-emerald-100 text-emerald-700',
  fire:     'bg-orange-100 text-orange-700',
  crime:    'bg-blue-100 text-blue-700',
  accident: 'bg-amber-100 text-amber-700',
};

export default function Badge({ value, kind = 'status', className = '' }) {
  const map = kind === 'type' ? TYPE_STYLES : STATUS_STYLES;
  const style = map[value] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${style} ${className}`}>
      {value?.replace(/_/g, ' ')}
    </span>
  );
}
