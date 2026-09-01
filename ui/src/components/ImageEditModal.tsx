import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { snackAlert } from '../slices/mainSlice';
import { processImageForUpload, ImageProcessingError } from '../helper/imageProcessing';
import { ButtonClose } from './Button';
import Modal from './Modal';

export interface ImageEditModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  imageUrl?: string;
  altText?: string | null;
  onUpload: (file: File) => void;
  onDelete: () => void;
  onSave: (altText: string) => void;
  uploading?: boolean;
  deleting?: boolean;
  canDelete?: boolean;
  isCircular?: boolean;
}

const ImageEditModal = ({
  open,
  onClose,
  title,
  imageUrl,
  altText: initialAltText,
  onUpload,
  onDelete,
  onSave,
  uploading,
  deleting,
  canDelete = true,
  isCircular = true,
}: ImageEditModalProps) => {
  const [altText, setAltText] = useState(initialAltText || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    setAltText(initialAltText || '');
  }, [open, initialAltText]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputFile = event.target.files?.[0];
    if (!inputFile) return;
    event.target.value = '';
    setIsProcessing(true);
    try {
      const { file } = await processImageForUpload(inputFile);
      onUpload(file);
    } catch (error) {
      dispatch(
        snackAlert(
          error instanceof ImageProcessingError
            ? error.message
            : `Could not process '${inputFile.name}'.`
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete the current image?')) {
      onDelete();
    }
  };

  const handleSave = () => {
    onSave(altText);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="modal-card image-edit-modal">
        <div className="modal-card-head">
          <div className="modal-card-title">{title}</div>
          <ButtonClose onClick={onClose} />
        </div>
        <div className="modal-card-content">
          <div className={`image-edit-preview ${isCircular ? 'image-edit-preview-circular' : ''}`}>
            {imageUrl ? (
              <img src={imageUrl} alt={altText} className="image-edit-placeholder" />
            ) : (
              <div className="image-edit-placeholder">No image</div>
            )}
          </div>
          <div className="image-edit-actions">
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading || isProcessing}>
              {isProcessing ? 'Converting…' : uploading ? 'Uploading...' : 'Upload new'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.heic,.heif"
              style={{ display: 'none' }}
              onChange={handleFileChange}
              disabled={uploading || isProcessing}
            />
            {canDelete && (
              <button onClick={handleDelete} disabled={deleting || !imageUrl}>
                {deleting ? <>Deleting...</> : 'Delete current'}
              </button>
            )}
          </div>
          <div className="image-edit-alt-label">Alt text</div>
          <textarea
            className="image-edit-alt-input"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            maxLength={1024}
            placeholder="Describe this image..."
          />
        </div>
        <div className="modal-card-actions">
          <button onClick={onClose}>Close</button>
          <button className="button-main" onClick={handleSave} disabled={!imageUrl}>
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ImageEditModal;
