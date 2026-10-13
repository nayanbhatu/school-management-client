import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import { useToast } from '../../context/ToastContext';
import { 
  Building2, 
  BookOpen, 
  Plus, 
  RefreshCw, 
  Loader2 
} from 'lucide-react';

export const AdminClasses = () => {
  const toast = useToast();

  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classSectionsMap, setClassSectionsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add Subject Modal
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '' });
  const [subjectLoading, setSubjectLoading] = useState(false);
  const [subjectError, setSubjectError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [clsRes, subRes] = await Promise.all([
        api.get('/classes'),
        api.get('/subjects')
      ]);

      const classList = clsRes.data || [];
      setClasses(classList);
      setSubjects(subRes.data || []);

      // Fetch sections for all classes concurrently
      const sectionPromises = classList.map(async (c) => {
        try {
          const secRes = await api.get(`/classes/${c.id}/sections`);
          return { classId: c.id, sections: secRes.data || [] };
        } catch {
          return { classId: c.id, sections: [] };
        }
      });

      const sectionResults = await Promise.all(sectionPromises);
      const secMap = {};
      sectionResults.forEach((r) => {
        secMap[r.classId] = r.sections;
      });
      setClassSectionsMap(secMap);

    } catch (err) {
      setError(err.message || 'Failed to load classes and curriculum catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    setSubjectError('');

    if (!subjectForm.name.trim() || !subjectForm.code.trim()) {
      setSubjectError('Subject name and code are required.');
      return;
    }

    setSubjectLoading(true);
    try {
      await api.post('/subjects', {
        name: subjectForm.name.trim(),
        code: subjectForm.code.trim().toUpperCase()
      });

      toast.success(`Subject ${subjectForm.name} registered successfully!`);
      setIsSubjectModalOpen(false);
      setSubjectForm({ name: '', code: '' });
      loadData();
    } catch (err) {
      setSubjectError(err.message || 'Failed to create subject');
    } finally {
      setSubjectLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--text-main)', marginBottom: 4 }}>
            Classes, Sections & Subjects
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Institutional academic structure, section divisions, and curriculum catalog.
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
            onClick={() => { setSubjectError(''); setIsSubjectModalOpen(true); }}
            className="btn btn-primary btn-sm"
          >
            <Plus size={15} />
            <span>Add Subject</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--crimson-700)' }} />
          <p>Loading academic structural records...</p>
        </div>
      ) : (
        <div className="admin-classes-grid">
          
          {/* Column 1: Classes & Sections */}
          <div>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Building2 size={20} color="var(--crimson-700)" />
                  <h3 style={{ fontSize: '1.125rem' }}>Academic Classes ({classes.length})</h3>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {classes.map((cls) => {
                  const secList = classSectionsMap[cls.id] || [];
                  return (
                    <div 
                      key={cls.id}
                      style={{
                        padding: 16,
                        backgroundColor: '#fafbfc',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 8
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <div>
                          <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-main)' }}>
                            {cls.name}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 8 }}>
                            Level {cls.level}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                          {secList.length} Sections
                        </span>
                      </div>

                      {/* Sections Pills */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {secList.map((sec) => (
                          <span
                            key={sec.id}
                            style={{
                              padding: '3px 10px',
                              backgroundColor: '#ffffff',
                              border: '1px solid var(--border-medium)',
                              borderRadius: 4,
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: 'var(--text-main)'
                            }}
                          >
                            Section {sec.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Column 2: Curriculum Subjects */}
          <div>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BookOpen size={20} color="var(--crimson-700)" />
                  <h3 style={{ fontSize: '1.125rem' }}>Curriculum Subjects ({subjects.length})</h3>
                </div>
              </div>

              <div className="table-container" style={{ border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Subject Code</th>
                      <th>Subject Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((sub) => (
                      <tr key={sub.id}>
                        <td>
                          <code style={{
                            padding: '2px 6px',
                            backgroundColor: 'var(--crimson-50)',
                            color: 'var(--crimson-800)',
                            borderRadius: 4,
                            fontWeight: 700,
                            fontSize: '0.8125rem'
                          }}>
                            {sub.code}
                          </code>
                        </td>
                        <td style={{ fontWeight: 600 }}>{sub.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Add Subject Modal */}
      <Modal
        isOpen={isSubjectModalOpen}
        onClose={() => !subjectLoading && setIsSubjectModalOpen(false)}
        title="Register New Curriculum Subject"
        maxWidth="460px"
      >
        <form onSubmit={handleCreateSubject}>
          {subjectError && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: 'var(--status-rejected-bg)',
              color: 'var(--status-rejected-text)',
              border: '1px solid var(--status-rejected-border)',
              borderRadius: 8,
              fontSize: '0.8125rem',
              marginBottom: 16
            }}>
              {subjectError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Subject Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. World History"
              value={subjectForm.name}
              onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Subject Code *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. HIST-101"
              value={subjectForm.code}
              onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button
              type="button"
              disabled={subjectLoading}
              onClick={() => setIsSubjectModalOpen(false)}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={subjectLoading}
              className="btn btn-primary btn-sm"
            >
              {subjectLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <span>Add Subject</span>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminClasses;
