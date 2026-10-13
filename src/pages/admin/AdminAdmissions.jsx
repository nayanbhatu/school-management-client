import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import { useToast } from '../../context/ToastContext';
import { validateEmail, isValidEmail, validateIndianPhoneNumber, isValidPastDate } from '../../utils/validators';
import { 
  FileCheck2, 
  Search, 
  Filter, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  User, 
  GraduationCap,
  Loader2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export const AdminAdmissions = () => {
  const toast = useToast();
  const location = useLocation();

  const [applications, setApplications] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedApp, setSelectedApp] = useState(null);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [pendingDecision, setPendingDecision] = useState(null); // 'APPROVED' or 'REJECTED'
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [decisionNotification, setDecisionNotification] = useState(null);

  // New Application Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    student_first_name: '',
    student_last_name: '',
    date_of_birth: '',
    target_class_id: '',
    parent_name: '',
    parent_email: '',
    parent_phone: ''
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [admRes, clsRes] = await Promise.all([
        api.get('/admissions'),
        api.get('/classes')
      ]);
      setApplications(admRes.data || []);
      setClasses(clsRes.data || []);

      // Check if URL has ?id= to open specific application
      const params = new URLSearchParams(location.search);
      const openId = params.get('id');
      if (openId && admRes.data) {
        const found = admRes.data.find((a) => String(a.id) === openId);
        if (found) setSelectedApp(found);
      }
    } catch (err) {
      setError(err.message || 'Failed to load admission applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDecisionClick = (app, decision) => {
    setSelectedApp(app);
    setPendingDecision(decision);
    setDecisionNotification(null);
    setIsDecisionModalOpen(true);
  };

  const submitDecision = async () => {
    if (!selectedApp || !pendingDecision) return;
    setDecisionLoading(true);
    try {
      const res = await api.patch(`/admissions/${selectedApp.id}/status`, {
        status: pendingDecision
      });

      toast.success(`Application #${selectedApp.id} ${pendingDecision.toLowerCase()} successfully!`);

      if (res.notification) {
        setDecisionNotification(res.notification);
      }

      // Update local state
      setApplications((prev) =>
        prev.map((a) => (a.id === selectedApp.id ? { ...a, status: pendingDecision } : a))
      );
      setSelectedApp((prev) => (prev ? { ...prev, status: pendingDecision } : null));

      setTimeout(() => {
        setIsDecisionModalOpen(false);
      }, 2000);
    } catch (err) {
      toast.error(err.message || `Failed to record decision for application #${selectedApp.id}`);
    } finally {
      setDecisionLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError('');

    // 1. Validate student name
    if (!createForm.student_first_name.trim() || !createForm.student_last_name.trim()) {
      setCreateError('Student first name and last name are required.');
      return;
    }

    // 2. Validate date of birth
    const dobCheck = isValidPastDate(createForm.date_of_birth);
    if (!dobCheck.isValid) {
      setCreateError(dobCheck.message || 'Date of birth must be a valid past date.');
      return;
    }

    // 3. Validate target class
    if (!createForm.target_class_id) {
      setCreateError('Please select a target class.');
      return;
    }

    // 4. Validate parent full name
    if (!createForm.parent_name.trim()) {
      setCreateError('Parent / Guardian full name is required.');
      return;
    }

    // 5. Validate parent email
    const trimmedEmail = createForm.parent_email.trim();
    if (!trimmedEmail) {
      setCreateError('Parent email address is required.');
      return;
    }
    const emailCheck = validateEmail(trimmedEmail);
    if (!emailCheck.isValid) {
      setCreateError(emailCheck.message || 'Please enter a valid email address (e.g. parent@example.com).');
      return;
    }

    // 6. Validate parent phone (Indian mobile number)
    const trimmedPhone = createForm.parent_phone.trim();
    if (!trimmedPhone) {
      setCreateError('Parent phone number is required.');
      return;
    }
    const phoneCheck = validateIndianPhoneNumber(trimmedPhone);
    if (!phoneCheck.isValid) {
      setCreateError(phoneCheck.message || 'Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setCreateLoading(true);
    try {
      const res = await api.post('/admissions', {
        student_first_name: createForm.student_first_name.trim(),
        student_last_name: createForm.student_last_name.trim(),
        date_of_birth: createForm.date_of_birth,
        target_class_id: parseInt(createForm.target_class_id, 10),
        parent_name: createForm.parent_name.trim(),
        parent_email: emailCheck.normalized,
        parent_phone: phoneCheck.normalized
      });

      toast.success('New admission application registered successfully!');
      setIsCreateModalOpen(false);
      setCreateForm({
        student_first_name: '',
        student_last_name: '',
        date_of_birth: '',
        target_class_id: '',
        parent_name: '',
        parent_email: '',
        parent_phone: ''
      });
      loadData();
    } catch (err) {
      setCreateError(err.message || 'Failed to register application');
    } finally {
      setCreateLoading(false);
    }
  };

  const filteredApplications = applications.filter((app) => {
    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
    const query = searchQuery.toLowerCase();
    const studentName = `${app.student_first_name} ${app.student_last_name}`.toLowerCase();
    const parentName = (app.parent_name || '').toLowerCase();
    const parentEmail = (app.parent_email || '').toLowerCase();

    const matchesQuery = 
      !query || 
      studentName.includes(query) || 
      parentName.includes(query) || 
      parentEmail.includes(query) ||
      String(app.id).includes(query);

    return matchesStatus && matchesQuery;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--text-main)', marginBottom: 4 }}>
            Admissions Management
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Review candidate applications with concurrency locks and automatic parent email notifications.
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
            <span>New Application</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 24 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: '1px solid',
                  backgroundColor: statusFilter === st ? 'var(--crimson-700)' : '#ffffff',
                  color: statusFilter === st ? '#ffffff' : 'var(--text-muted)',
                  borderColor: statusFilter === st ? 'var(--crimson-700)' : 'var(--border-subtle)',
                  transition: 'all 150ms ease'
                }}
              >
                {st === 'ALL' ? 'All Applications' : st}
                {st === 'PENDING' && (
                  <span style={{
                    marginLeft: 6,
                    padding: '1px 6px',
                    borderRadius: 10,
                    fontSize: '0.6875rem',
                    backgroundColor: statusFilter === st ? 'rgba(255,255,255,0.25)' : 'var(--crimson-50)',
                    color: statusFilter === st ? '#ffffff' : 'var(--crimson-700)'
                  }}>
                    {applications.filter((a) => a.status === 'PENDING').length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="filter-search-box" style={{ position: 'relative', width: 280, maxWidth: '100%' }}>
            <input
              type="text"
              placeholder="Search by student, parent, email..."
              className="form-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: 34, fontSize: '0.8125rem' }}
            />
            <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: 11, top: 11 }} />
          </div>

        </div>
      </div>

      {/* Applications Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--crimson-700)' }} />
            <p>Loading candidate applications...</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
            <FileCheck2 size={36} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: 4 }}>No applications match your filter</div>
            <p style={{ fontSize: '0.8125rem' }}>Try clearing your search query or switching status filters.</p>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Application ID</th>
                  <th>Student Name</th>
                  <th>Target Class</th>
                  <th>Date of Birth</th>
                  <th>Parent / Contact</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((app) => {
                  const isPending = app.status === 'PENDING';
                  return (
                    <tr key={app.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>#{app.id}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                          {app.student_first_name} {app.student_last_name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                          Applied: {new Date(app.applied_at || Date.now()).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 500 }}>
                          {app.target_class_name || `Class ID ${app.target_class_id}`}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        {app.date_of_birth ? new Date(app.date_of_birth).toLocaleDateString() : 'N/A'}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{app.parent_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{app.parent_email}</div>
                      </td>
                      <td>
                        <StatusBadge status={app.status} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => setSelectedApp(app)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          >
                            Details
                          </button>

                          {isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleDecisionClick(app, 'APPROVED')}
                                className="btn btn-primary btn-sm"
                                style={{ padding: '4px 10px', fontSize: '0.75rem', backgroundColor: '#059669', borderColor: '#059669' }}
                                title="Approve application"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDecisionClick(app, 'REJECTED')}
                                className="btn btn-danger btn-sm"
                                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                title="Reject application"
                              >
                                Reject
                              </button>
                            </>
                          )}
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

      {/* Details View Modal */}
      <Modal
        isOpen={Boolean(selectedApp && !isDecisionModalOpen)}
        onClose={() => setSelectedApp(null)}
        title={`Application #${selectedApp?.id} Profile`}
        maxWidth="540px"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Status: <StatusBadge status={selectedApp?.status} />
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              {selectedApp?.status === 'PENDING' && (
                <>
                  <button
                    type="button"
                    onClick={() => { handleDecisionClick(selectedApp, 'APPROVED'); }}
                    className="btn btn-primary btn-sm"
                    style={{ backgroundColor: '#059669', borderColor: '#059669' }}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => { handleDecisionClick(selectedApp, 'REJECTED'); }}
                    className="btn btn-danger btn-sm"
                  >
                    Reject
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="btn btn-secondary btn-sm"
              >
                Close
              </button>
            </div>
          </div>
        }
      >
        {selectedApp && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
              padding: 16,
              backgroundColor: '#f8fafc',
              borderRadius: 8,
              border: '1px solid var(--border-subtle)'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Student Name</div>
                <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>
                  {selectedApp.student_first_name} {selectedApp.student_last_name}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target Class</div>
                <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>
                  {selectedApp.target_class_name || `Class ID ${selectedApp.target_class_id}`}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Date of Birth</div>
                <div style={{ fontSize: '0.875rem' }}>
                  {selectedApp.date_of_birth ? new Date(selectedApp.date_of_birth).toLocaleDateString() : 'N/A'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Applied At</div>
                <div style={{ fontSize: '0.875rem' }}>
                  {new Date(selectedApp.applied_at || Date.now()).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-main)' }}>
                Parent / Guardian Contact
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <User size={15} color="var(--text-muted)" />
                  <span>{selectedApp.parent_name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Mail size={15} color="var(--text-muted)" />
                  <span>{selectedApp.parent_email}</span>
                </div>
                {selectedApp.parent_phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Phone size={15} color="var(--text-muted)" />
                    <span>{selectedApp.parent_phone}</span>
                  </div>
                )}
              </div>
            </div>

            {selectedApp.status !== 'PENDING' && (
              <div style={{
                padding: '12px 16px',
                backgroundColor: selectedApp.status === 'APPROVED' ? 'var(--status-approved-bg)' : 'var(--status-rejected-bg)',
                borderRadius: 8,
                fontSize: '0.8125rem',
                color: selectedApp.status === 'APPROVED' ? 'var(--status-approved-text)' : 'var(--status-rejected-text)'
              }}>
                This application has already been decided as <strong>{selectedApp.status}</strong>. Its status is immutable.
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Decision Confirmation Modal with Notification Feedback */}
      <Modal
        isOpen={isDecisionModalOpen}
        onClose={() => !decisionLoading && setIsDecisionModalOpen(false)}
        title={`Confirm Decision: ${pendingDecision}`}
        maxWidth="500px"
        footer={
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', width: '100%' }}>
            <button
              type="button"
              disabled={decisionLoading}
              onClick={() => setIsDecisionModalOpen(false)}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={decisionLoading}
              onClick={submitDecision}
              className={`btn btn-sm ${pendingDecision === 'APPROVED' ? 'btn-primary' : 'btn-danger'}`}
              style={pendingDecision === 'APPROVED' ? { backgroundColor: '#059669', borderColor: '#059669' } : {}}
            >
              {decisionLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving Decision...</span>
                </>
              ) : (
                <span>Confirm {pendingDecision}</span>
              )}
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
            Are you sure you want to <strong>{pendingDecision?.toLowerCase()}</strong> the application for{' '}
            <strong>{selectedApp?.student_first_name} {selectedApp?.student_last_name}</strong>?
          </p>

          <div style={{
            padding: 12,
            backgroundColor: '#f8fafc',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            fontSize: '0.8125rem',
            color: 'var(--text-muted)'
          }}>
            <strong>Transaction & Notification guarantee:</strong> The decision status will be committed to the Neon database first. Then, an automated notification will be dispatched to <strong>{selectedApp?.parent_email}</strong>.
          </div>

          {decisionNotification && (
            <div style={{
              padding: 12,
              borderRadius: 8,
              fontSize: '0.8125rem',
              backgroundColor: decisionNotification.sent ? 'var(--status-approved-bg)' : 'var(--bg-subtle)',
              color: decisionNotification.sent ? 'var(--status-approved-text)' : 'var(--text-main)',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>
                {decisionNotification.sent ? 'Email Notification Sent' : 'Notification Handled'}
              </div>
              <div>Mode: <code>{decisionNotification.mode}</code></div>
              {decisionNotification.messageId && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Message ID: {decisionNotification.messageId}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* New Application Registration Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => !createLoading && setIsCreateModalOpen(false)}
        title="Register New Admission Application"
        maxWidth="560px"
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
              <label className="form-label">Student First Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Liam"
                value={createForm.student_first_name}
                onChange={(e) => setCreateForm({ ...createForm, student_first_name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Student Last Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Vance"
                value={createForm.student_last_name}
                onChange={(e) => setCreateForm({ ...createForm, student_last_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Date of Birth *</label>
              <input
                type="date"
                className="form-input"
                value={createForm.date_of_birth}
                onChange={(e) => setCreateForm({ ...createForm, date_of_birth: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Target Class *</label>
              <select
                className="form-select"
                value={createForm.target_class_id}
                onChange={(e) => setCreateForm({ ...createForm, target_class_id: e.target.value })}
                required
              >
                <option value="">Select Target Class...</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Level {c.level})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Parent / Guardian Full Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Eleanor Vance"
              value={createForm.parent_name}
              onChange={(e) => setCreateForm({ ...createForm, parent_name: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Parent Email Address *</label>
              <input
                type="email"
                className="form-input"
                placeholder="e.g. parent@domain.com"
                value={createForm.parent_email}
                onChange={(e) => setCreateForm({ ...createForm, parent_email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Parent Phone Number *</label>
              <input
                type="tel"
                className="form-input"
                placeholder="e.g. +91 98765 43210 or 9876543210"
                value={createForm.parent_phone}
                onChange={(e) => setCreateForm({ ...createForm, parent_phone: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
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
                  <span>Registering...</span>
                </>
              ) : (
                <span>Register Application</span>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminAdmissions;
