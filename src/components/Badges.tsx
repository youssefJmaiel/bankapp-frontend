import { Check, X } from 'lucide-react';

export function ProcessedBadge({ processed }: { processed?: boolean }) {
  if (processed) {
    return (
      <span className="badge bg-mint-50 text-mint-700">
        <Check className="w-3 h-3" />
        Processed
      </span>
    );
  }
  return (
    <span className="badge bg-gold-50 text-gold-700">
      <X className="w-3 h-3" />
      Pending
    </span>
  );
}

export function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;

  const normalized = status.toLowerCase();
  let classes = 'bg-navy-50 text-navy-600';

  if (normalized.includes('active') || normalized.includes('completed') || normalized.includes('done')) {
    classes = 'bg-mint-50 text-mint-700';
  } else if (normalized.includes('pending') || normalized.includes('wait') || normalized.includes('queued')) {
    classes = 'bg-gold-50 text-gold-700';
  } else if (normalized.includes('inactive') || normalized.includes('cancel') || normalized.includes('fail')) {
    classes = 'bg-red-50 text-red-600';
  } else if (normalized.includes('progress') || normalized.includes('ongoing')) {
    classes = 'bg-blue-50 text-blue-600';
  }

  return <span className={`badge ${classes}`}>{status}</span>;
}
