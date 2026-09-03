import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import DashboardPage from '../../components/Dashboard/DashboardPage';
import { FormField, FormSection } from '../../components/Form';
import Input from '../../components/Input';
import PageLoading from '../../components/PageLoading';
import SimpleFeed, { SimpleFeedItem } from '../../components/SimpleFeed';
import { TableRow } from '../../components/Table';
import { mfetchjson, validEmail } from '../../helper';
import { useLoading } from '../../hooks';
import { Neighborhood } from '../../serverTypes';
import { snackAlert, snackAlertError } from '../../slices/mainSlice';

// Each .table-row is its own independent CSS grid (see Table.tsx), so an `auto`
// column's width is computed from that row's own content only -- it does NOT
// stay in sync with the same column in other rows. A row with no "Send code"
// button ends up with a narrower actions column than one with it, and the
// header row (empty cell) collapses to near zero, so column boundaries drift
// between rows. Fixed pixel widths for Code/Actions keep every row identical
// regardless of what that row happens to render.
const NEIGHBORHOOD_GRID_COLUMNS =
  'minmax(100px, 1fr) minmax(100px, 1fr) minmax(180px, 1.8fr) 110px 230px';

interface NeighborhoodsState {
  neighborhoods: Neighborhood[] | null;
}

export default function Neighborhoods() {
  const [loading, setLoading] = useLoading('loading');
  const [neighborhoodsState, setNeighborhoodsState] = useState<NeighborhoodsState>({
    neighborhoods: null,
  });

  const [newName, setNewName] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactEmailError, setNewContactEmailError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editContactName, setEditContactName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editContactEmail, setEditContactEmail] = useState('');
  const [editContactEmailError, setEditContactEmailError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [sendingCodeId, setSendingCodeId] = useState<string | null>(null);

  const dispatch = useDispatch();

  useEffect(() => {
    fetchNeighborhoods();
  }, []);

  const fetchNeighborhoods = async () => {
    try {
      setLoading('loading');
      const res = (await mfetchjson('/api/admin/neighborhoods')) as Neighborhood[];
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

    if (newContactEmail && !validEmail(newContactEmail)) {
      setNewContactEmailError('Please enter a valid email address');
      return;
    }

    setIsCreating(true);
    try {
      const neighborhood = await mfetchjson('/api/admin/neighborhoods', {
        method: 'POST',
        body: JSON.stringify({
          name: newName,
          contactName: newContactName,
          code: newCode,
          contactEmail: newContactEmail,
        }),
      });
      setNeighborhoodsState((prev) => ({
        ...prev,
        neighborhoods: [...(prev.neighborhoods || []), neighborhood],
      }));
      setNewName('');
      setNewContactName('');
      setNewCode('');
      setNewContactEmail('');
      setNewContactEmailError('');
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
    setEditContactName(neighborhood.contactName || '');
    setEditCode(neighborhood.code || '');
    setEditContactEmail(neighborhood.contactEmail || '');
    setEditContactEmailError('');
  };

  const handleEditSave = async () => {
    if (!editName.trim()) {
      dispatch(snackAlert('Neighborhood name is required'));
      return;
    }

    if (editContactEmail && !validEmail(editContactEmail)) {
      setEditContactEmailError('Please enter a valid email address');
      return;
    }

    setIsEditing(true);
    try {
      const neighborhood = await mfetchjson(`/api/admin/neighborhoods/${editingId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editName,
          contactName: editContactName,
          code: editCode,
          contactEmail: editContactEmail,
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
    setEditContactName('');
    setEditCode('');
    setEditContactEmail('');
    setEditContactEmailError('');
  };

  const handleSendCode = async (neighborhood: Neighborhood) => {
    if (
      !window.confirm(
        `Email the code for ${neighborhood.name} to ${neighborhood.contactEmail}?`
      )
    ) {
      return;
    }

    setSendingCodeId(neighborhood.id);
    try {
      const res = (await mfetchjson(`/api/admin/neighborhoods/${neighborhood.id}/send_code`, {
        method: 'POST',
      })) as { message?: string };
      dispatch(snackAlert(res.message || 'Code sent'));
    } catch (error) {
      dispatch(snackAlertError(error));
    } finally {
      setSendingCodeId(null);
    }
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

  const handleRenderHead = (): React.ReactNode => {
    return (
      <TableRow columns={5} head style={{ gridTemplateColumns: NEIGHBORHOOD_GRID_COLUMNS }}>
        <div className="table-column">Name</div>
        <div className="table-column">Contact name</div>
        <div className="table-column">Contact email</div>
        <div className="table-column">Code</div>
        <div className="table-column"></div>
      </TableRow>
    );
  };

  const handleRenderItem = (item: Neighborhood): React.ReactNode => {
    return (
      <TableRow columns={5} style={{ gridTemplateColumns: NEIGHBORHOOD_GRID_COLUMNS }}>
        <div className="table-column">{item.name}</div>
        <div className="table-column">{item.contactName || '—'}</div>
        <div className="table-column" style={{ overflowWrap: 'normal', wordBreak: 'normal' }}>
          {item.contactEmail || '—'}
        </div>
        <div className="table-column" style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>
          {item.code || '—'}
        </div>
        <div className="table-column table-actions">
          {item.code && item.contactEmail && (
            <button
              onClick={() => handleSendCode(item)}
              className="button-clear button-action-edit"
              disabled={sendingCodeId === item.id}
              title={`Email the code to ${item.contactEmail}`}
            >
              {sendingCodeId === item.id ? 'Sending...' : 'Send code'}
            </button>
          )}
          <button
            onClick={() => handleEditStart(item)}
            className="button-clear button-action-edit"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(item.id)}
            className="button-clear button-action-delete"
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
        <FormField label="Contact name">
          <Input
            value={editingId ? editContactName : newContactName}
            onChange={(e) => editingId ? setEditContactName(e.target.value) : setNewContactName(e.target.value)}
            placeholder="e.g. Martin — the neighborhood leader's name"
            disabled={isCreating || isEditing}
          />
        </FormField>
        <FormField label="Contact email">
          <Input
            type="email"
            value={editingId ? editContactEmail : newContactEmail}
            onChange={(e) => {
              const value = e.target.value;
              if (editingId) {
                setEditContactEmail(value);
                if (value && !validEmail(value)) {
                  setEditContactEmailError('Invalid email');
                } else {
                  setEditContactEmailError('');
                }
              } else {
                setNewContactEmail(value);
                if (value && !validEmail(value)) {
                  setNewContactEmailError('Invalid email');
                } else {
                  setNewContactEmailError('');
                }
              }
            }}
            placeholder="e.g. martin@example.com"
            disabled={isCreating || isEditing}
            error={editingId ? !!editContactEmailError : !!newContactEmailError}
          />
          {(editingId ? editContactEmailError : newContactEmailError) && (
            <div style={{ color: '#d32f2f', fontSize: '12px', marginTop: '4px' }}>
              {editingId ? editContactEmailError : newContactEmailError}
            </div>
          )}
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
        <SimpleFeed
          className="table"
          items={feedItems}
          onRenderItem={handleRenderItem}
          onRenderHead={handleRenderHead}
        />
      </div>
    </DashboardPage>
  );
}
