import { useRef, useState } from 'react';
import TermsContent from '../pages/TermsContent';
import PrivacyPolicyContent from '../pages/PrivacyPolicyContent';
import Modal from './Modal';

export const TERMS_VERSION = '2026-08-18';

interface TermsGateModalProps {
  open: boolean;
  onClose: () => void;
  onAgree: (version: string) => void;
}

const TermsGateModal = ({ open, onClose, onAgree }: TermsGateModalProps) => {
  const [hasReachedEnd, setHasReachedEnd] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollHeight, scrollTop, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    if (distanceFromBottom < 4) {
      setHasReachedEnd(true);
    }
  };

  const handleAgree = () => {
    onAgree(TERMS_VERSION);
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} noOuterClickClose={true}>
      <div className="modal-card terms-gate-modal">
        <div className="modal-card-head">
          <div className="modal-card-title">Terms & Privacy Policy</div>
        </div>
        <div className="modal-card-content terms-gate-scroll" ref={scrollContainerRef} onScroll={handleScroll}>
          <TermsContent />
          <PrivacyPolicyContent />
        </div>
        <div className="modal-card-foot">
          <button
            className="button button-main"
            onClick={handleAgree}
            disabled={!hasReachedEnd}
          >
            I have read and agree
          </button>
          <button className="button button-clear" onClick={handleClose}>
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default TermsGateModal;
