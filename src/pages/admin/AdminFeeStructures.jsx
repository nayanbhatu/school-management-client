import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import { useToast } from '../../context/ToastContext';
import { 
  CreditCard, 
  Plus, 
  Edit3, 
  Trash2,
  RefreshCw, 
  Loader2
} from 'lucide-react';
import { formatCurrency, RUPEE_SYMBOL } from '../../utils/formatters';
import { isValidAcademicYear } from '../../utils/validators';

export const AdminFeeStructures = () => {
  const toast = useToast();

  const [feeStructures, setFeeStructures] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    class_id: '',
    academic_year: '2026-2027',
    annual_fee: ''
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Edit Modal
  const [structureToEdit, setStructureToEdit] = useState(null);
  const [editAnnualFee, setEditAnnualFee] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete Modal
  const [structureToDelete, setStructureToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const openDeleteModal = (fs) => {
    setStructureToDelete(fs);
    setDeleteError('');
  };

  const handleDeleteSubmit = async (e) => {
    e.preventDefault();
    if (!structureToDelete) return;
    setDeleteError('');
    setDeleteLoading(true);
    try {
      await api.delete(`/fee-structures/${structureToDelete.id}`);
      toast.success(`Fee structure for ${structureToDelete.class_name} (${structureToDelete.academic_year}) deleted successfully.`);
      setStructureToDelete(null);
      loadData();
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete fee structure');
    } finally {
      setDeleteLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [feeRes, clsRes] = await Promise.all([
        api.get('/fee-structures'),
        api.get('/classes')
      ]);

      const rawFees = feeRes.data || [];
      rawFees.sort((a, b) => {
        if (b.academic_year !== a.academic_year) {
          return b.academic_year.localeCompare(a.academic_year);
        }
        return (a.class_level || 0) - (b.class_level || 0);
      });
      setFeeStructures(rawFees);
      setClasses(clsRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load fee structures');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError('');

    if (!createForm.class_id) {
      setCreateError('Please select a target class.');
      return;
    }

    if (!isValidAcademicYear(createForm.academic_year.trim())) {
      setCreateError('Academic year must follow YYYY-YYYY format with sequential years (e.g. 2026-2027).');
      return;
    }

    const feeNum = Number(createForm.annual_fee);
    if (isNaN(feeNum) || feeNum <= 0 || !isFinite(feeNum) || feeNum > 10000000) {
      setCreateError('Annual fee must be a valid positive amount.');
      return;
    }

    setCreateLoading(true);
    try {
      await api.post('/fee-structures', {
        class_id: parseInt(createForm.class_id, 10),
        academic_year: createForm.academic_year.trim(),
        annual_fee: feeNum
      });

      toast.success('Annual fee structure created successfully!');
      setIsCreateModalOpen(false);
      setCreateForm({ class_id: '', academic_year: '2026-2027', annual_fee: '' });
      loadData();
    } catch (err) {
      setCreateError(err.message || 'Failed to create fee structure');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!structureToEdit) return;
    setEditError('');

    const feeNum = Number(editAnnualFee);
    if (isNaN(feeNum) || feeNum <= 0 || !isFinite(feeNum) || feeNum > 10000000) {
      setEditError('Annual fee must be a valid positive amount.');
      return;
    }

    setEditLoading(true);
    try {
      await api.put(`/fee-structures/${structureToEdit.id}`, {
        annual_fee: feeNum
      });

      toast.success('Fee structure updated successfully!');
      setStructureToEdit(null);
      loadData();
    } catch (err) {
      setEditError(err.message || 'Failed to update fee structure');
    } finally {
      setEditLoading(false);
    }
  };

  const openEditModal = (fs) => {
    setStructureToEdit(fs);
    setEditAnnualFee(String(fs.annual_fee));
    setEditError('');
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--text-main)', marginBottom: 4 }}>
            Annual Fee Structures
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Configure standard annual tuition fees by class and academic year. Each fee schedule automatically derives 4 quarterly installments upon student enrollment.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={loadData}
            className="btn btn-secondary btn-sm"
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => { setCreateError(''); setIsCreateModalOpen(true); }}
            className="btn btn-primary btn-sm"
          >
            <Plus size={15} />
            <span>New Fee Structure</span>
          </button>
        </div>
      </div>

      {/* Fee Structures Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--crimson-700)' }} />
            <p>Loading fee structures...</p>
          </div>
        ) : feeStructures.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
            <CreditCard size={36} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: 4 }}>No fee structures defined</div>
            <p style={{ fontSize: '0.8125rem' }}>Create a fee structure for a class to enable student enrollment.</p>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Schedule #</th>
                  <th>Class</th>
                  <th>Academic Year</th>
                  <th>Annual Tuition Fee</th>
                  <th>Quarterly Installment (Q1-Q4)</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {feeStructures.map((fs) => {
                  const annualVal = Number(fs.annual_fee);
                  const quarterVal = annualVal / 4;
                  return (
                    <tr key={fs.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>#{fs.id}</td>
                      <td>
                        <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{fs.class_name}</span>
                        {fs.class_level && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 6 }}>
                            (Level {fs.class_level})
                          </span>
                        )}
                      </td>
                      <td>
                        <span style={{
                          padding: '3px 8px',
                          backgroundColor: fs.academic_year === '2026-2027' ? 'var(--crimson-50)' : 'var(--bg-subtle)',
                          color: fs.academic_year === '2026-2027' ? 'var(--crimson-700)' : 'var(--text-muted)',
                          border: fs.academic_year === '2026-2027' ? '1px solid var(--crimson-200)' : 'none',
                          borderRadius: 4,
                          fontWeight: 700,
                          fontSize: '0.8125rem'
                        }}>
                          {fs.academic_year} {fs.academic_year === '2026-2027' && '• Current'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--crimson-800)' }}>
                          {formatCurrency(annualVal)}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                          4 x <strong>{formatCurrency(quarterVal)}</strong>
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => openEditModal(fs)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                            title="Edit Fee Structure"
                          >
                            <Edit3 size={13} />
                            <span>Edit Fee</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteModal(fs)}
                            className="btn btn-secondary btn-sm"
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.75rem',
                              color: 'var(--crimson-700)',
                              borderColor: '#fecaca',
                              backgroundColor: '#ffffff'
                            }}
                            title="Delete Fee Structure"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => !createLoading && setIsCreateModalOpen(false)}
        title="Create New Annual Fee Structure"
        maxWidth="500px"
      >
        <form onSubmit={handleCreateSubmit}>
          {createError && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: 'var(--status-rejected-bg)',
              color: 'var(--status-rejected-text)',
              border: '1px solid var(--status-rejected-border)',
              borderRadius: 8,
              fontSize: '0.8125rem',
              marginBottom: 16
            }}>
              {createError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Academic Class *</label>
            <select
              className="form-select"
              value={createForm.class_id}
              onChange={(e) => setCreateForm({ ...createForm, class_id: e.target.value })}
              required
            >
              <option value="">Select Class...</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (Level {c.level})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Academic Year *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. 2026-2027"
              value={createForm.academic_year}
              onChange={(e) => setCreateForm({ ...createForm, academic_year: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Annual Tuition Fee ({RUPEE_SYMBOL}) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="form-input"
              placeholder="e.g. 40000"
              value={createForm.annual_fee}
              onChange={(e) => setCreateForm({ ...createForm, annual_fee: e.target.value })}
              required
            />
            {createForm.annual_fee && Number(createForm.annual_fee) > 0 && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Each quarterly installment will be {formatCurrency(Number(createForm.annual_fee) / 4)}.
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button
              type="button"
              disabled={createLoading}
              onClick={() => setIsCreateModalOpen(false)}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createLoading}
              className="btn btn-primary btn-sm"
            >
              {createLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Save Fee Structure</span>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={Boolean(structureToEdit)}
        onClose={() => !editLoading && setStructureToEdit(null)}
        title={`Edit Annual Fee: ${structureToEdit?.class_name} (${structureToEdit?.academic_year})`}
        maxWidth="480px"
      >
        <form onSubmit={handleEditSubmit}>
          {editError && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: 'var(--status-rejected-bg)',
              color: 'var(--status-rejected-text)',
              border: '1px solid var(--status-rejected-border)',
              borderRadius: 8,
              fontSize: '0.8125rem',
              marginBottom: 16
            }}>
              {editError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Updated Annual Tuition Fee ({RUPEE_SYMBOL}) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="form-input"
              value={editAnnualFee}
              onChange={(e) => setEditAnnualFee(e.target.value)}
              required
            />
            {editAnnualFee && Number(editAnnualFee) > 0 && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Revised quarterly installment will be {formatCurrency(Number(editAnnualFee) / 4)}.
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button
              type="button"
              disabled={editLoading}
              onClick={() => setStructureToEdit(null)}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editLoading}
              className="btn btn-primary btn-sm"
            >
              {editLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(structureToDelete)}
        onClose={() => !deleteLoading && setStructureToDelete(null)}
        title="Delete Annual Fee Structure"
        maxWidth="480px"
      >
        <form onSubmit={handleDeleteSubmit}>
          {deleteError && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: 'var(--status-rejected-bg)',
              color: 'var(--status-rejected-text)',
              border: '1px solid var(--status-rejected-border)',
              borderRadius: 8,
              fontSize: '0.8125rem',
              marginBottom: 16
            }}>
              {deleteError}
            </div>
          )}

          <div style={{ marginBottom: 16, fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
            Are you sure you want to delete the fee schedule for <strong>{structureToDelete?.class_name}</strong> ({structureToDelete?.academic_year}) of <strong>{formatCurrency(structureToDelete?.annual_fee || 0)}</strong>?
          </div>

          <div style={{ 
            padding: '10px 14px', 
            backgroundColor: '#fffbeb', 
            color: '#92400e', 
            border: '1px solid #fde68a', 
            borderRadius: 8, 
            fontSize: '0.75rem', 
            marginBottom: 20 
          }}>
            Note: Fee structures with active student enrollments or installments cannot be deleted to preserve financial auditability.
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              type="button"
              disabled={deleteLoading}
              onClick={() => setStructureToDelete(null)}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={deleteLoading}
              className="btn btn-danger btn-sm"
            >
              {deleteLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 size={14} />
                  <span>Delete Record</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminFeeStructures;
