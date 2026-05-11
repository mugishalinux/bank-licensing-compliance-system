import { ApplicationStatus } from '../../types';
import { STATUS_CLASS, STATUS_LABEL } from '../../utils/formatters';

export default function StatusBadge({ status }: { status: ApplicationStatus }) {
  return <span className={`tag ${STATUS_CLASS[status]}`}>{STATUS_LABEL[status]}</span>;
}
