import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import { useToast } from '../../context/ToastContext';
import { validateEmail, isValidEmail } from '../../utils/validators';
import { 
  Users2, 
  Plus, 
  Search, 
  RefreshCw, 
  Power, 
  BookOpen, 
  Loader2,
  KeyRound,
  Copy,
  Check
} from 'lucide-react';

export const AdminTeachers = () => {
  const toast = useToast();

  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Teacher Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    email: ''
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Status Toggle Modal
  const [selectedTeacherForStatus, setSelectedTeacherForStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // Teacher Profile / Assignments Modal
  const [selectedTeacherDetails, setSelectedTeacherDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Reset Credentials Modal
  const [selectedTeacherForReset, setSelectedTeacherForReset] = useState(null);
  const [resetMode, setResetMode] = useState('generate'); // 'generate' | 'custom'
  const [customPassword, setCustomPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccessData, setResetSuccessData] = useState(null);
  const [copied, setCopied] = useState(false);

  const loadTeachers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/teachers');
      setTeachers(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load faculty directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError('');

    const cleanUser = createForm.username.trim();
    if (!cleanUser || cleanUser.length < 3 || cleanUser.length > 50 || !/^[a-zA-Z0-9_]+$/.test(cleanUser)) {
      setCreateError('Username must be 3-50 alphanumeric characters or underscores.');
      return;
    }

    if (!createForm.password || createForm.password.length < 6) {
      setCreateError('Password must contain at least 6 characters.');
      return;
    }

    if (!createForm.first_name.trim() || !createForm.last_name.trim()) {
      setCreateError('First name and last name are required.');
      return;
    }

    const emailCheck = validateEmail(createForm.email);
    if (!emailCheck.isValid) {
      setCreateError(emailCheck.message || 'Please enter a valid email address (e.g. teacher@school.com).');
      return;
    }

    setCreateLoading(true);
    try {
      const res = await api.post('/teachers', {
        username: createForm.username.trim(),
        password: createForm.password,
        first_name: createForm.first_name.trim(),
        last_name: createForm.last_name.trim(),
        email: emailCheck.normalized
      });

      toast.success(`Faculty account for ${createForm.first_name} ${createForm.last_name} created successfully!`);
      setIsCreateModalOpen(false);
      setCreateForm({
        username: '',
        password: '',
        first_name: '',
        last_name: '',
        email: ''
      });
      loadTeachers();
    } catch (err) {
      setCreateError(err.message || 'Failed to create faculty account');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleStatusToggle = async () => {
    if (!selectedTeacherForStatus) return;
    setStatusLoading(true);
    const newStatus = !selectedTeacherForStatus.is_active;

    try {
      await api.patch(`/teachers/${selectedTeacherForStatus.id}/status`, {
        is_active: newStatus
      });

      toast.success(`Teacher account ${newStatus ? 'activated' : 'deactivated'} successfully!`);
      setTeachers((prev) =>
        prev.map((t) => (t.id === selectedTeacherForStatus.id ? { ...t, is_active: newStatus } : t))
      );
      setSelectedTeacherForStatus(null);
    } catch (err) {
      toast.error(err.message || 'Failed to update teacher account status');
    } finally {
      setStatusLoading(false);
    }
  };

  const viewTeacherAssignments = async (teacher) => {
    setDetailsLoading(true);
    setIsDetailsModalOpen(true);
    try {
      const res = await api.get(`/teachers/${teacher.id}`);
      setSelectedTeacherDetails(res.data);
    } catch (err) {
      toast.error(err.message || 'Failed to load teacher assignments');
      setIsDetailsModalOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleOpenResetModal = (teacher) => {
    setSelectedTeacherForReset(teacher);
    setResetMode('generate');
    setCustomPassword('');
    setResetError('');
    setResetSuccessData(null);
    setCopied(false);
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTeacherForReset) return;
    setResetError('');

    const payload = {};
    if (resetMode === 'custom') {
      if (!customPassword || customPassword.length < 6) {
        setResetError('Password must contain at least 6 characters.');
        return;
      }
      payload.password = customPassword;
    }

    setResetLoading(true);
    try {
      const res = await api.patch(`/teachers/${selectedTeacherForReset.id}/reset-password`, payload);
      setResetSuccessData(res.data);
      toast.success(`Credentials reset successfully for ${selectedTeacherForReset.first_name} ${selectedTeacherForReset.last_name}!`);
    } catch (err) {
      setResetError(err.message || 'Failed to reset teacher password');
    } finally {
      setResetLoading(false);
    }
  };

  const handleCopyPassword = () => {
    if (resetSuccessData?.temporary_password) {
      navigator.clipboard.writeText(resetSuccessData.temporary_password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.info('Temporary password copied to clipboard');
    }
  };

  const filteredTeachers = teachers.filter((t) => {
    const query = searchQuery.toLowerCase();
    const fullName = `${t.first_name} ${t.last_name}`.toLowerCase();
    const email = (t.email || '').toLowerCase();
    const username = (t.username || '').toLowerCase();
    return !query || fullName.includes(query) || email.includes(query) || username.includes(query);
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--text-main)', marginBottom: 4 }}>
            Faculty & Teachers
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Manage teaching faculty, login account credentials, active states, and classroom assignments.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={loadTeachers}
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
            <span>Create Faculty Account</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ padding: '14px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div className="filter-search-box" style={{ position: 'relative', width: 320, maxWidth: '100%' }}>
            <input
              type="text"
              placeholder="Search faculty by name, email, username..."
              className="form-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: 34, fontSize: '0.8125rem', padding: '8px 12px 8px 34px' }}
            />
            <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: 11, top: 10 }} />
          </div>

          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Total Faculty: <strong>{teachers.length}</strong> (Active: {teachers.filter((t) => t.is_active).length})
          </div>
        </div>
      </div>

      {/* Teachers Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--crimson-700)' }} />
            <p>Loading faculty accounts...</p>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
            <Users2 size={36} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: 4 }}>No faculty records found</div>
            <p style={{ fontSize: '0.8125rem' }}>Click "Create Faculty Account" to add your first instructor.</p>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Teacher ID</th>
                  <th>Faculty Name</th>
                  <th>Login Username</th>
                  <th>Email Address</th>
                  <th>Account Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.map((t) => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>TCH-{String(t.id).padStart(3, '0')}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        {t.first_name} {t.last_name}
                      </div>
                    </td>
                    <td>
                      <code style={{ fontSize: '0.8125rem', color: 'var(--crimson-700)' }}>{t.username}</code>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {t.email}
                    </td>
                    <td>
                      <StatusBadge status={t.is_active ? 'ACTIVE' : 'INACTIVE'} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => viewTeacherAssignments(t)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        >
                          <BookOpen size={13} />
                          <span>Assignments</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenResetModal(t)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                          title="Reset login credentials"
                        >
                          <KeyRound size={13} />
                          <span>Reset Password</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedTeacherForStatus(t)}
                          className={`btn btn-sm ${t.is_active ? 'btn-outline' : 'btn-primary'}`}
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        >
                          <Power size={13} />
                          <span>{t.is_active ? 'Deactivate' : 'Activate'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Teacher Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => !createLoading && setIsCreateModalOpen(false)}
        title="Create Faculty Record & Login Account"
        maxWidth="540px"
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Marcus"
                value={createForm.first_name}
                onChange={(e) => setCreateForm({ ...createForm, first_name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Bennett"
                value={createForm.last_name}
                onChange={(e) => setCreateForm({ ...createForm, last_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Teacher Email Address *</label>
            <input
              type="email"
              className="form-input"
              placeholder="e.g. m.bennett@oakridge.edu"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              required
            />
          </div>

          <div style={{
            padding: 14,
            backgroundColor: '#f8fafc',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            marginBottom: 16
          }}>
            <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, marginBottom: 10, color: 'var(--crimson-800)' }}>
              Portal Sign-In Credentials
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Portal Username *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. marcus_b"
                  value={createForm.username}
                  onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Initial Password *</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="At least 6 characters"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
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
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Create Faculty Account</span>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Status Activation/Deactivation Confirmation Modal */}
      <Modal
        isOpen={Boolean(selectedTeacherForStatus)}
        onClose={() => !statusLoading && setSelectedTeacherForStatus(null)}
        title={selectedTeacherForStatus?.is_active ? 'Confirm Faculty Deactivation' : 'Confirm Faculty Activation'}
        maxWidth="480px"
        footer={
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', width: '100%' }}>
            <button
              type="button"
              disabled={statusLoading}
              onClick={() => setSelectedTeacherForStatus(null)}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={statusLoading}
              onClick={handleStatusToggle}
              className={`btn btn-sm ${selectedTeacherForStatus?.is_active ? 'btn-danger' : 'btn-primary'}`}
            >
              {statusLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <span>Confirm {selectedTeacherForStatus?.is_active ? 'Deactivation' : 'Activation'}</span>
              )}
            </button>
          </div>
        }
      >
        <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
          Are you sure you want to {selectedTeacherForStatus?.is_active ? 'deactivate' : 'activate'} the account for{' '}
          <strong>{selectedTeacherForStatus?.first_name} {selectedTeacherForStatus?.last_name}</strong>?
        </p>
        {selectedTeacherForStatus?.is_active ? (
          <div style={{
            marginTop: 12,
            padding: 10,
            backgroundColor: 'var(--status-rejected-bg)',
            color: 'var(--status-rejected-text)',
            borderRadius: 6,
            fontSize: '0.8125rem'
          }}>
            Deactivating this account prevents the instructor from signing in to the Teacher Portal immediately.
          </div>
        ) : (
          <div style={{
            marginTop: 12,
            padding: 10,
            backgroundColor: 'var(--status-approved-bg)',
            color: 'var(--status-approved-text)',
            borderRadius: 6,
            fontSize: '0.8125rem'
          }}>
            Activating this account restores the instructor's sign-in access.
          </div>
        )}
      </Modal>

      {/* Teacher Profile & Assignments Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={`Faculty Profile: ${selectedTeacherDetails?.first_name} ${selectedTeacherDetails?.last_name}`}
        maxWidth="560px"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <button
              type="button"
              onClick={() => setIsDetailsModalOpen(false)}
              className="btn btn-secondary btn-sm"
            >
              Close
            </button>
          </div>
        }
      >
        {detailsLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px', color: 'var(--crimson-700)' }} />
            <p>Loading teacher assignments...</p>
          </div>
        ) : selectedTeacherDetails ? (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              padding: 14,
              backgroundColor: '#f8fafc',
              borderRadius: 8,
              border: '1px solid var(--border-subtle)',
              marginBottom: 18,
              fontSize: '0.8125rem'
            }}>
              <div><strong>Username:</strong> {selectedTeacherDetails.username}</div>
              <div><strong>Email:</strong> {selectedTeacherDetails.email}</div>
              <div><strong>Account Status:</strong> <StatusBadge status={selectedTeacherDetails.is_active ? 'ACTIVE' : 'INACTIVE'} /></div>
              <div><strong>Teacher ID:</strong> TCH-{String(selectedTeacherDetails.id).padStart(3, '0')}</div>
            </div>

            <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: 12 }}>
              Assigned Classes & Subjects ({selectedTeacherDetails.assignments?.length || 0})
            </h4>

            {(!selectedTeacherDetails.assignments || selectedTeacherDetails.assignments.length === 0) ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 8 }}>
                No active section or subject assignments for this teacher.
              </div>
            ) : (
              <div className="table-container" style={{ border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Class</th>
                      <th>Section</th>
                      <th>Subject</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTeacherDetails.assignments.map((asg) => (
                      <tr key={asg.assignment_id}>
                        <td style={{ fontWeight: 600 }}>{asg.class_name}</td>
                        <td>Section {asg.section_name}</td>
                        <td style={{ fontWeight: 600, color: 'var(--crimson-800)' }}>{asg.subject_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      {/* Reset Credentials Modal */}
      <Modal
        isOpen={Boolean(selectedTeacherForReset)}
        onClose={() => {
          if (!resetLoading) {
            setSelectedTeacherForReset(null);
            setResetSuccessData(null);
          }
        }}
        title={`Reset Credentials: ${selectedTeacherForReset?.first_name} ${selectedTeacherForReset?.last_name}`}
        maxWidth="500px"
        footer={
          resetSuccessData ? (
            <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
              <button
                type="button"
                onClick={() => {
                  setSelectedTeacherForReset(null);
                  setResetSuccessData(null);
                }}
                className="btn btn-primary btn-sm"
              >
                Done
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, width: '100%' }}>
              <button
                type="button"
                onClick={() => setSelectedTeacherForReset(null)}
                className="btn btn-secondary btn-sm"
                disabled={resetLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetPasswordSubmit}
                className="btn btn-primary btn-sm"
                disabled={resetLoading}
              >
                {resetLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <span>Confirm Password Reset</span>
                )}
              </button>
            </div>
          )
        }
      >
        {selectedTeacherForReset && (
          <div>
            {resetSuccessData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{
                  padding: 16,
                  backgroundColor: '#ecfdf5',
                  borderRadius: 8,
                  border: '1px solid #a7f3d0',
                  color: '#065f46',
                  fontSize: '0.875rem'
                }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>
                    Password Reset Successfully!
                  </div>
                  <div>
                    The login credentials for <strong>{selectedTeacherForReset.first_name} {selectedTeacherForReset.last_name}</strong> have been updated in the database.
                  </div>
                </div>

                <div style={{
                  padding: 16,
                  backgroundColor: '#f8fafc',
                  borderRadius: 8,
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10
                }}>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    Username: <strong style={{ color: 'var(--text-main)' }}>{resetSuccessData.username || selectedTeacherForReset.username}</strong>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 4 }}>
                      Temporary / New Password:
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <code style={{
                        flex: 1,
                        padding: '10px 14px',
                        backgroundColor: '#ffffff',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 6,
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: 'var(--crimson-800)',
                        letterSpacing: '0.05em'
                      }}>
                        {resetSuccessData.temporary_password}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopyPassword}
                        className="btn btn-secondary btn-sm"
                        style={{ height: 42, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        title="Copy to clipboard"
                      >
                        {copied ? <Check size={16} color="#059669" /> : <Copy size={16} />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: '10px 14px',
                  backgroundColor: '#fffbeb',
                  borderRadius: 6,
                  fontSize: '0.8125rem',
                  color: '#92400e',
                  border: '1px solid #fde68a'
                }}>
                  <strong>Security Notice:</strong> Please securely share this temporary password with the faculty member. The password will not be displayed again after closing this window.
                </div>
              </div>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{
                  padding: 14,
                  backgroundColor: '#f8fafc',
                  borderRadius: 8,
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.8125rem'
                }}>
                  <div><strong>Account:</strong> {selectedTeacherForReset.first_name} {selectedTeacherForReset.last_name}</div>
                  <div><strong>Username:</strong> <code style={{ color: 'var(--crimson-700)' }}>{selectedTeacherForReset.username}</code></div>
                  <div><strong>Email:</strong> {selectedTeacherForReset.email}</div>
                </div>

                {resetError && (
                  <div style={{
                    padding: '8px 12px',
                    backgroundColor: 'var(--status-rejected-bg)',
                    borderRadius: 6,
                    color: 'var(--status-rejected-text)',
                    fontSize: '0.8125rem'
                  }}>
                    {resetError}
                  </div>
                )}

                <div>
                  <label className="form-label">Password Mode</label>
                  <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.875rem' }}>
                      <input
                        type="radio"
                        name="resetMode"
                        value="generate"
                        checked={resetMode === 'generate'}
                        onChange={() => setResetMode('generate')}
                      />
                      <span>Generate Secure Temporary Password</span>
                    </label>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.875rem' }}>
                      <input
                        type="radio"
                        name="resetMode"
                        value="custom"
                        checked={resetMode === 'custom'}
                        onChange={() => setResetMode('custom')}
                      />
                      <span>Enter Custom Password</span>
                    </label>
                  </div>
                </div>

                {resetMode === 'custom' && (
                  <div>
                    <label className="form-label">New Password *</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Minimum 6 characters"
                      value={customPassword}
                      onChange={(e) => setCustomPassword(e.target.value)}
                      required
                    />
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      Must be at least 6 characters.
                    </div>
                  </div>
                )}

                {resetMode === 'generate' && (
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
                    A secure 12-character temporary password will be generated automatically and displayed for you to copy after confirmation.
                  </p>
                )}
              </form>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminTeachers;
