import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import DashboardPage from '../../components/Dashboard/DashboardPage';
import { FormField, FormSection } from '../../components/Form';
import Input from '../../components/Input';
import PageLoading from '../../components/PageLoading';
import SimpleFeed, { SimpleFeedItem } from '../../components/SimpleFeed';
import { TableRow } from '../../components/Table';
import { mfetchjson } from '../../helper';
import { useLoading } from '../../hooks';
import { Neighborhood } from '../../serverTypes';
import { snackAlert, snackAlertError } from '../../slices/mainSlice';

interface NeighborhoodsState {
  neighborhoods: Neighborhood[] | null;
}

export default function Neighborhoods() {
  const [loading, setLoading] = useLoading('loading');
  const [neighborhoodsState, setNeighborhoodsState] = useState<NeighborhoodsState>({
    neighborhoods: null,
  });

  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCode, setNewCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCode, setEditCode] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const dispatch = useDispatch();

  useEffect(() => {
    fetchNeighborhoods();
  }, []);

  const fetchNeighborhoods = async () => {
    try {
      setLoading('loading');
      const res = (await mfetchjson('/api/neighborhoods')) as Neighborhood[];
      setNeighborhoodsState({ neighborhoods: res });
      setLoading('loaded');
    } catch (error) {
      dispatch(snackAlertError(error));
      setLoading('error');
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) {
      dispatch(snackAlert('Neighborhood name is required'));
      return;
    }

    setIsCreating(true);
    try {
      const neighborhood = await mfetchjson('/api/admin/neighborhoods', {
        method: 'POST',
        body: JSON.stringify({
          name: newName,
          description: newDescription,
          code: newCode,
        }),
      });
      setNeighborhoodsState((prev) => ({
        ...prev,
        neighborhoods: [...(prev.neighborhoods || []), neighborhood],
      }));
      setNewName('');
      setNewDescription('');
      setNewCode('');
      dispatch(snackAlert('Neighborhood created successfully'));
    } catch (error) {
      dispatch(snackAlertError(error));
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditStart = (neighborhood: Neighborhood) => {
    setEditingId(neighborhood.id);
    setEditName(neighborhood.name);
    setEditDescription(neighborhood.description || '');
    setEditCode(neighborhood.code || '');
  };

  const handleEditSave = async () => {
    if (!editName.trim()) {
      dispatch(snackAlert('Neighborhood name is required'));
      return;
    }

    setIsEditing(true);
    try {
      const neighborhood = await mfetchjson(`/api/admin/neighborhoods/${editingId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editName,
          description: editDescription,
          code: editCode,
        }),
      });
      setNeighborhoodsState((prev) => ({
        ...prev,
        neighborhoods: (prev.neighborhoods || []).map((n) =>
          n.id === editingId ? neighborhood : n
        ),
      }));
      setEditingId(null);
      dispatch(snackAlert('Neighborhood updated successfully'));
    } catch (error) {
      dispatch(snackAlertError(error));
    } finally {
      setIsEditing(false);
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditName('');
    setEditDescription('');
    setEditCode('');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this neighborhood?')) {
      return;
    }

    try {
      await mfetchjson(`/api/admin/neighborhoods/${id}`, {
        method: 'DELETE',
      });
      setNeighborhoodsState((prev) => ({
        ...prev,
        neighborhoods: (prev.neighborhoods || []).filter((n) => n.id !== id),
      }));
      dispatch(snackAlert('Neighborhood deleted successfully'));
    } catch (error) {
      dispatch(snackAlertError(error));
    }
  };

  const handleRenderItem = (item: Neighborhood): React.ReactNode => {
    return (
      <TableRow columns={4}>
        <div className="table-column">{item.name}</div>
        <div className="table-column">{item.description || '—'}</div>
        <div className="table-column" style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>
          {item.code || '—'}
        </div>
        <div className="table-column" style={{ textAlign: 'right' }}>
          <button
            onClick={() => handleEditStart(item)}
            className="button-clear"
            style={{ color: '#1976d2', marginRight: '1rem' }}
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(item.id)}
            className="button-clear"
            style={{ color: '#d32f2f' }}
          >
            Delete
          </button>
        </div>
      </TableRow>
    );
  };

  if (loading !== 'loaded') {
    return <PageLoading />;
  }

  const feedItems: SimpleFeedItem<Neighborhood>[] = (neighborhoodsState.neighborhoods || []).map(
    (neighborhood) => {
      return { item: neighborhood, key: neighborhood.id };
    }
  );

  return (
    <DashboardPage className="dashboard-page-neighborhoods document" title="Neighborhoods">
      <FormSection heading={editingId ? 'Edit Neighborhood' : 'Create Neighborhood'}>
        <FormField label="Name">
          <Input
            value={editingId ? editName : newName}
            onChange={(e) => editingId ? setEditName(e.target.value) : setNewName(e.target.value)}
            placeholder="e.g. Oakdale"
            disabled={isCreating || isEditing}
          />
        </FormField>
        <FormField label="Description">
          <textarea
            value={editingId ? editDescription : newDescription}
            onChange={(e) => editingId ? setEditDescription(e.target.value) : setNewDescription(e.target.value)}
            placeholder="Optional description"
            rows={3}
            disabled={isCreating || isEditing}
            style={{ width: '100%' }}
          />
        </FormField>
        <FormField label="Code (optional)">
          <Input
            value={editingId ? editCode : newCode}
            onChange={(e) => editingId ? setEditCode(e.target.value) : setNewCode(e.target.value)}
            placeholder="e.g. 9442"
            disabled={isCreating || isEditing}
          />
        </FormField>
        <FormField>
          {editingId ? (
            <>
              <button
                onClick={handleEditSave}
                className="button button-main"
                disabled={isEditing || !editName.trim()}
                style={{ marginRight: '0.5rem' }}
              >
                {isEditing ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleEditCancel}
                className="button"
                disabled={isEditing}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={handleCreate}
              className="button button-main"
              disabled={isCreating || !newName.trim()}
            >
              {isCreating ? 'Creating...' : 'Create'}
            </button>
          )}
        </FormField>
      </FormSection>

      <div style={{ marginTop: '2rem' }}>
        <h2>Neighborhoods</h2>
        <SimpleFeed className="table" items={feedItems} onRenderItem={handleRenderItem} />
      </div>
    </DashboardPage>
  );
}
