import { ApplicationStatus } from '../../types';
import { STATUS_LABELS, STATUS_COLORS } from '../../utils/formatters';

interface Props {
  status: ApplicationStatus;
}

export default function StatusBadge({ status }: Props) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
