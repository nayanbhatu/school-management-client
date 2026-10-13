import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import { useToast } from '../../context/ToastContext';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Search, 
  Loader2
} from 'lucide-react';

export const AdminAssignments = () => {
  const toast = useToast();

  const [assignments, setAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sections, setSections] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Assignment Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({
    teacher_id: '',
    class_id: '',
    section_id: '',
    subject_id: ''
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Delete Assignment Confirmation
  const [assignmentToDelete, setAssignmentToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [asgRes, teaRes, clsRes, subRes] = await Promise.all([
        api.get('/teacher-assignments'),
        api.get('/teachers'),
        api.get('/classes'),
        api.get('/subjects')
      ]);

      setAssignments(asgRes.data || []);
      setTeachers(teaRes.data || []);
      setClasses(clsRes.data || []);
      setSubjects(subRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load teacher academic assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When class changes in modal, load its sections
  const handleClassChange = async (classId) => {
    setAssignForm((prev) => ({ ...prev, class_id: classId, section_id: '' }));
    setSections([]);
    if (!classId) return;

    try {
      const secRes = await api.get(`/classes/${classId}/sections`);
      setSections(secRes.data || []);
    } catch (err) {
      toast.error('Failed to load sections for selected class');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError('');

    if (!assignForm.teacher_id || !assignForm.section_id || !assignForm.subject_id) {
      setCreateError('Please select a teacher, class, section, and subject.');
      return;
    }

    setCreateLoading(true);
    try {
      await api.post('/teacher-assignments', {
        teacher_id: parseInt(assignForm.teacher_id, 10),
        section_id: parseInt(assignForm.section_id, 10),
        subject_id: parseInt(assignForm.subject_id, 10)
      });

      toast.success('Teacher assigned to section and subject successfully!');
      setIsCreateModalOpen(false);
      setAssignForm({ teacher_id: '', class_id: '', section_id: '', subject_id: '' });
      loadData();
    } catch (err) {
      setCreateError(err.message || 'Failed to record assignment');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!assignmentToDelete) return;
    setDeleteLoading(true);

    try {
      await api.del(`/teacher-assignments/${assignmentToDelete.id}`);
      toast.success('Academic assignment removed successfully!');
      setAssignments((prev) => prev.filter((a) => a.id !== assignmentToDelete.id));
      setAssignmentToDelete(null);
    } catch (err) {
      toast.error(err.message || 'Failed to remove assignment');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredAssignments = assignments.filter((a) => {
    const query = searchQuery.toLowerCase();
    const teacherName = `${a.teacher_first_name} ${a.teacher_last_name}`.toLowerCase();
    const subjectName = (a.subject_name || '').toLowerCase();
    const className = (a.class_name || '').toLowerCase();
    const sectionName = (a.section_name || '').toLowerCase();

    return !query || teacherName.includes(query) || subjectName.includes(query) || className.includes(query) || sectionName.includes(query);
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--text-main)', marginBottom: 4 }}>
            Academic Assignments
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Map faculty instructors to class sections and specific curriculum subjects.
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
            <span>New Subject Assignment</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ padding: '14px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div className="filter-search-box" style={{ position: 'relative', width: 320, maxWidth: '100%' }}>
            <input
              type="text"
              placeholder="Search by teacher, subject, class..."
              className="form-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: 34, fontSize: '0.8125rem', padding: '8px 12px 8px 34px' }}
            />
            <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: 11, top: 10 }} />
          </div>

          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Total Active Assignments: <strong>{assignments.length}</strong>
          </div>
        </div>
      </div>

      {/* Assignments Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--crimson-700)' }} />
            <p>Loading academic assignments...</p>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
            <BookOpen size={36} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: 4 }}>No assignments found</div>
            <p style={{ fontSize: '0.8125rem' }}>Assign faculty members to class sections using the button above.</p>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Assignment #</th>
                  <th>Faculty Instructor</th>
                  <th>Class & Level</th>
                  <th>Section</th>
                  <th>Subject</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.map((a) => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>#{a.id}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        {a.teacher_first_name} {a.teacher_last_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{a.teacher_email}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{a.class_name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 6 }}>
                        (Level {a.class_level})
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>Section {a.section_name}</span>
                    </td>
                    <td>
                      <span style={{
                        padding: '3px 8px',
                        backgroundColor: 'var(--crimson-50)',
                        color: 'var(--crimson-700)',
                        borderRadius: 4,
                        fontSize: '0.8125rem',
                        fontWeight: 600
                      }}>
                        {a.subject_name}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => setAssignmentToDelete(a)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 8px', color: 'var(--crimson-700)' }}
                        title="Delete assignment"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Assignment Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => !createLoading && setIsCreateModalOpen(false)}
        title="Assign Faculty to Section & Subject"
        maxWidth="520px"
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
            <label className="form-label">Select Active Faculty Member *</label>
            <select
              className="form-select"
              value={assignForm.teacher_id}
              onChange={(e) => setAssignForm({ ...assignForm, teacher_id: e.target.value })}
              required
            >
              <option value="">Select faculty instructor...</option>
              {teachers.filter((t) => t.is_active).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.first_name} {t.last_name} ({t.email})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Academic Class *</label>
              <select
                className="form-select"
                value={assignForm.class_id}
                onChange={(e) => handleClassChange(e.target.value)}
                required
              >
                <option value="">Select class...</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Section *</label>
              <select
                className="form-select"
                value={assignForm.section_id}
                onChange={(e) => setAssignForm({ ...assignForm, section_id: e.target.value })}
                disabled={!assignForm.class_id || sections.length === 0}
                required
              >
                <option value="">Select section...</option>
                {sections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    Section {sec.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Curriculum Subject *</label>
            <select
              className="form-select"
              value={assignForm.subject_id}
              onChange={(e) => setAssignForm({ ...assignForm, subject_id: e.target.value })}
              required
            >
              <option value="">Select subject...</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} ({sub.code})
                </option>
              ))}
            </select>
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
                  <span>Assigning...</span>
                </>
              ) : (
                <span>Confirm Assignment</span>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(assignmentToDelete)}
        onClose={() => !deleteLoading && setAssignmentToDelete(null)}
        title="Remove Academic Assignment"
        maxWidth="460px"
        footer={
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', width: '100%' }}>
            <button
              type="button"
              disabled={deleteLoading}
              onClick={() => setAssignmentToDelete(null)}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleteLoading}
              onClick={handleDeleteSubmit}
              className="btn btn-danger btn-sm"
            >
              {deleteLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Removing...</span>
                </>
              ) : (
                <span>Remove Assignment</span>
              )}
            </button>
          </div>
        }
      >
        <p style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
          Are you sure you want to remove the assignment of <strong>{assignmentToDelete?.teacher_first_name} {assignmentToDelete?.teacher_last_name}</strong> teaching <strong>{assignmentToDelete?.subject_name}</strong> in <strong>{assignmentToDelete?.class_name} Section {assignmentToDelete?.section_name}</strong>?
        </p>
      </Modal>
    </div>
  );
};

export default AdminAssignments;
