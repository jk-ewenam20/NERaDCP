import { RiAlertLine } from 'react-icons/ri';
import Modal from './UI/Modal';
import NewIncident from '../pages/NewIncident';

export default function NewIncidentModal({ open, onClose, onSuccess }) {
  return (
    <Modal open={open} onClose={onClose} size="lg" title={
      <span className="flex items-center gap-2">
        <span className="inline-flex items-center justify-center w-7 h-7 bg-red-500 rounded-lg">
          <RiAlertLine className="text-white text-base" />
        </span>
        Record New Incident
      </span>
    }>
      <NewIncident onClose={onClose} onSuccess={onSuccess} />
    </Modal>
  );
}
