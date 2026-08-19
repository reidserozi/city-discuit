import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { ButtonClose } from '../../components/Button';
import DashboardPage from '../../components/Dashboard/DashboardPage';
import { FormField } from '../../components/Form';
import { InputWithCount, useInputMaxLength } from '../../components/Input';
import Modal from '../../components/Modal';
import { mfetchjson } from '../../helper';
import { useLoading } from '../../hooks';
import { Community, CommunityItem } from '../../serverTypes';
import { snackAlertError } from '../../slices/mainSlice';

const Items = ({ community }: { community: Community }) => {
  const dispatch = useDispatch();
  const [items, _setItems] = useState<CommunityItem[]>([]);
  const setItems = (items: CommunityItem[]) => {
    _setItems(items.sort((a, b) => a.zIndex - b.zIndex));
  };

  const [isEditItem, setIsEditItem] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const [loading, setLoading] = useLoading();
  useEffect(() => {
    (async () => {
      try {
        const ritems = await mfetchjson(`/api/communities/${community.id}/items`);
        setItems(ritems);
        setLoading('loaded');
      } catch (error) {
        dispatch(snackAlertError(error));
        setLoading('error');
      }
    })();
  }, [community.id, dispatch, setLoading]);

  const itemMaxLength = 512;
  const [item, setItem] = useInputMaxLength(itemMaxLength);
  const descriptionMaxLength = 512;
  const [description, setDescription] = useInputMaxLength(descriptionMaxLength);

  const handleEditClose = () => {
    setEditOpen(false);
    setItem('');
    setDescription('');
  };

  const handleAddItem = () => {
    setIsEditItem(false);
    setEditOpen(true);
  };

  const [itemEditing, setItemEditing] = useState<CommunityItem | null>(null);
  const handleEditItem = (item: CommunityItem) => {
    setItemEditing(item);
    setIsEditItem(true);
    setItem(item.item);
    setDescription(item.description || '');
    setEditOpen(true);
  };

  const handleSave = async () => {
    try {
      if (isEditItem) {
        if (!itemEditing) return;
        const ritem = await mfetchjson(`/api/communities/${community.id}/items/${itemEditing.id}`, {
          method: 'PUT',
          body: JSON.stringify({ zIndex: itemEditing.zIndex, item, description }),
        });
        const nitems = [...items.filter((i) => i.id !== ritem.id), ritem];
        setItems(nitems);
      } else {
        const ritems = await mfetchjson(`/api/communities/${community.id}/items`, {
          method: 'POST',
          body: JSON.stringify({
            item,
            description,
          }),
        });
        setItems(ritems);
      }
      handleEditClose();
    } catch (error) {
      dispatch(snackAlertError(error));
    }
  };

  const handleDeleteItem = async (item: CommunityItem) => {
    if (confirm('Are you certain?')) {
      try {
        await mfetchjson(`/api/communities/${community.id}/items/${item.id}`, {
          method: 'DELETE',
        });
        setItems(items.filter((i) => i.id !== item.id));
      } catch (error) {
        dispatch(snackAlertError(error));
      }
    }
  };

  if (loading !== 'loaded') {
    return null;
  }

  const modalTitle = isEditItem ? 'Edit item' : 'Add item';
  const modalDisabled = item === '';

  return (
    <DashboardPage
      className="modtools-content modtools-items"
      title="Items"
      fullWidth
      titleRightContent={
        <button className="button-main" onClick={handleAddItem}>
          Add item
        </button>
      }
    >
      <Modal open={editOpen} onClose={handleEditClose}>
        <div className="modal-card">
          <div className="modal-card-head">
            <div className="modal-card-title">{modalTitle}</div>
            <ButtonClose onClick={handleEditClose} />
          </div>
          <form
            className="modal-card-content"
            onSubmit={(e) => {
              e.preventDefault();
              if (!modalDisabled) handleSave();
            }}
          >
            <FormField label="Item">
              <InputWithCount maxLength={itemMaxLength} value={item} onChange={setItem} autoFocus />
            </FormField>
            <FormField label="Description">
              <InputWithCount
                textarea
                rows={5}
                maxLength={descriptionMaxLength}
                value={description}
                onChange={setDescription}
                style={{ resize: 'vertical' }}
              />
            </FormField>
          </form>
          <div className="modal-card-actions">
            <button className="button-main" disabled={modalDisabled} onClick={handleSave}>
              Save
            </button>
            <button onClick={handleEditClose}>Cancel</button>
          </div>
        </div>
      </Modal>
      <div className="modtools-items-list">
        <div className="table">
          {items.map((item) => (
            <div className="table-row" key={item.id}>
              <div className="table column">{item.zIndex}</div>
              <div className="table-column">{item.item}</div>
              <div className="table-column">{item.description}</div>
              <div className="table-column" style={{ display: 'flex', justifyContent: 'center' }}>
                <button className="button-red" onClick={() => handleDeleteItem(item)}>
                  Delete
                </button>
              </div>
              <div className="table-column">
                <button onClick={() => handleEditItem(item)}>Edit</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardPage>
  );
};

export default Items;
