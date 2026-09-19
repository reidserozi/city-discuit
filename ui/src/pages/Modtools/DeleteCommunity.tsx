import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router';
import { ButtonClose } from '../../components/Button';
import { FormField } from '../../components/Form';
import Input from '../../components/Input';
import Modal from '../../components/Modal';
import { mfetchjson } from '../../helper';
import { Community } from '../../serverTypes';
import { snackAlert, snackAlertError } from '../../slices/mainSlice';

const DeleteCommunity = ({ community }: { community: Community }) => {
  const dispatch = useDispatch();
  const history = useHistory();

  const [open, setOpen] = useState(false);
  const handleClose = () => setOpen(false);
  const [confirm, setConfirm] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOnDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await mfetchjson(`/api/communities/${community.id}`, { method: 'DELETE' });
      dispatch(snackAlert(`${community.name} has been deleted.`));
      history.push('/');
    } catch (error) {
      dispatch(snackAlertError(error));
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button className="button-red" onClick={() => setOpen(true)}>
        Delete community
      </button>
      <Modal open={open} onClose={handleClose}>
        <div className="modal-card">
          <div className="modal-card-head">
            <div className="modal-card-title">Delete {community.name}</div>
            <ButtonClose onClick={handleClose} />
          </div>
          <div className="form modal-card-content">
            <div className="form-field">
              <p>
                Proceed with caution: this permanently deletes the community and all of its posts.
                This cannot be undone.
              </p>
            </div>
            <FormField label="Type delete to continue:">
              <Input type="text" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </FormField>
          </div>
          <div className="modal-card-actions">
            <button
              className="button-red"
              onClick={handleOnDelete}
              disabled={confirm !== 'delete' || isDeleting}
            >
              Delete
            </button>
            <button onClick={handleClose}>Cancel</button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default DeleteCommunity;
