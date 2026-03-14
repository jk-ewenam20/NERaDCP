import { RiInboxLine } from 'react-icons/ri';

export default function EmptyState({ message = 'No data found', icon: Icon = RiInboxLine }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
      <Icon className="text-5xl mb-3" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
