import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import { formatCurrency } from '../../utils/formatters';
import { 
  Users2, 
  GraduationCap, 
  Search, 
  RefreshCw, 
  AlertCircle, 
  Receipt,
  BookOpen,
  Info
} from 'lucide-react';

export const TeacherDashboard = () => {
  const { user } = useAuth();

  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Student Details Modal
  const [selectedStudent, setSelectedStudent] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [studentsRes, assignmentsRes] = await Promise.all([
        api.get('/teacher/students'),
        api.get('/teacher/assignments')
      ]);
      setStudents(studentsRes.data || []);
      setAssignments(assignmentsRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load assigned student roster');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute unique classes and sections from assignments and students
  const assignedSections = Array.from(
    new Set([
      ...assignments.map((a) => `${a.class_name} — Section ${a.section_name}`),
      ...students.map((s) => {
        const cName = s.class?.name || s.class_name;
        const sName = s.section?.name || s.section_name;
        return (cName && sName) ? `${cName} — Section ${sName}` : null;
      }).filter(Boolean)
    ])
  );

  // Compute fee summary across assigned students
  let totalInstallments = 0;
  let paidInstallments = 0;
  students.forEach((s) => {
    const installments = s.fee_status?.installments || s.fees?.installments;
    if (Array.isArray(installments)) {
      installments.forEach((inst) => {
        totalInstallments++;
        if (inst.status === 'PAID') paidInstallments++;
      });
    }
  });

  const clearanceRate = totalInstallments > 0 ? Math.round((paidInstallments / totalInstallments) * 100) : 0;

  const filteredStudents = students.filter((s) => {
    const query = searchQuery.toLowerCase();
    const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
    const className = (s.class?.name || s.class_name || '').toLowerCase();
    const sectionName = (s.section?.name || s.section_name || '').toLowerCase();
    return !query || fullName.includes(query) || className.includes(query) || sectionName.includes(query);
  });

  const teacherName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.username;

  return (
    <div>
      {/* Welcome Banner */}
      <div style={{
        padding: '24px 28px',
        backgroundColor: '#ffffff',
        borderRadius: 12,
        border: '1px solid var(--border-subtle)',
        marginBottom: 24,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--crimson-700)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Faculty Classroom Workspace
            </span>
            <span style={{
              padding: '2px 8px',
              borderRadius: 12,
              backgroundColor: 'var(--crimson-50)',
              color: 'var(--crimson-700)',
              fontSize: '0.6875rem',
              fontWeight: 700,
              border: '1px solid var(--crimson-200)',
              letterSpacing: '0.02em'
            }}>
              AY 2026-2027
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--text-main)', marginBottom: 4 }}>
            Welcome, {teacherName}
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Review your allocated subject assignments and monitor enrolled students and quarterly fee clearance.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="btn btn-secondary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <RefreshCw size={14} />
          <span>Refresh Roster</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
        gap: 18,
        marginBottom: 24
      }}>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>Assigned Students</span>
            <div style={{ padding: 6, borderRadius: 8, backgroundColor: 'var(--crimson-50)', color: 'var(--crimson-700)' }}>
              <Users2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>
            {students.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Under your direct academic supervision
          </div>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>Classroom Sections</span>
            <div style={{ padding: 6, borderRadius: 8, backgroundColor: 'var(--crimson-50)', color: 'var(--crimson-700)' }}>
              <BookOpen size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>
            {assignedSections.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            {assignedSections.join(', ') || 'None assigned yet'}
          </div>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>Fee Clearance Rate</span>
            <div style={{ padding: 6, borderRadius: 8, backgroundColor: '#ecfdf5', color: '#065f46' }}>
              <Receipt size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: '#065f46' }}>
            {clearanceRate}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            {paidInstallments} of {totalInstallments} quarterly installments cleared
          </div>
        </div>
      </div>

      {/* My Assignments Section */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ 
              padding: 7, 
              borderRadius: 8, 
              backgroundColor: 'var(--crimson-50)', 
              color: 'var(--crimson-700)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BookOpen size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                My Teaching Assignments
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                Subject and classroom allocations assigned for Academic Year 2026-2027
              </p>
            </div>
          </div>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: 20,
            backgroundColor: assignments.length > 0 ? 'var(--crimson-50)' : 'var(--bg-subtle)',
            color: assignments.length > 0 ? 'var(--crimson-700)' : 'var(--text-muted)',
            border: `1px solid ${assignments.length > 0 ? 'var(--crimson-200)' : 'var(--border-subtle)'}`
          }}>
            {assignments.length} {assignments.length === 1 ? 'Subject Assigned' : 'Subjects Assigned'}
          </span>
        </div>

        {assignments.length === 0 ? (
          <div style={{
            padding: '28px',
            textAlign: 'center',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 8,
            color: 'var(--text-muted)',
            fontSize: '0.8125rem'
          }}>
            <p style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: 4 }}>No subjects currently assigned</p>
            <p style={{ margin: 0 }}>Your account has not been assigned to any subjects or sections yet. Please contact the school administrator.</p>
          </div>
        ) : (
          <div className="teacher-assignments-grid">
            {assignments.map((asgn) => (
              <div
                key={asgn.assignment_id || asgn.id}
                style={{
                  padding: '14px 18px',
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-subtle)',
                  borderLeft: '4px solid var(--crimson-700)',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-main)', marginBottom: 2 }}>
                    {asgn.subject_name}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    {asgn.class_name}, Section {asgn.section_name}
                  </div>
                </div>
                <span style={{
                  padding: '3px 8px',
                  borderRadius: 4,
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  backgroundColor: 'var(--crimson-50)',
                  color: 'var(--crimson-700)',
                  border: '1px solid var(--crimson-200)'
                }}>
                  Section {asgn.section_name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="card" style={{ padding: '14px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div className="filter-search-box" style={{ position: 'relative', width: 300, maxWidth: '100%' }}>
            <input
              type="text"
              placeholder="Search student by name or class..."
              className="form-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: 34, fontSize: '0.8125rem', padding: '8px 12px 8px 34px' }}
            />
            <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: 11, top: 10 }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            <Info size={15} />
            <span>Faculty View: Student Fee Tracking is read-only.</span>
          </div>
        </div>
      </div>

      {/* Student Roster Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--crimson-700)' }} />
            <p>Loading assigned student roster...</p>
          </div>
        ) : error ? (
          <div style={{ padding: 36, textAlign: 'center', color: 'var(--status-rejected-text)' }}>
            <AlertCircle size={28} style={{ margin: '0 auto 8px' }} />
            <p>{error}</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
            <GraduationCap size={36} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: 4 }}>
              {students.length === 0 ? 'No students currently assigned' : 'No students match your search'}
            </div>
            <p style={{ fontSize: '0.8125rem' }}>
              {students.length === 0 
                ? 'Your account has not been assigned to any classroom sections yet. Please consult the school administrator.'
                : 'Try adjusting your search criteria.'}
            </p>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Student Name</th>
                  <th>Class & Section</th>
                  <th>Date of Birth</th>
                  <th>Quarterly Fee Clearance (Q1 - Q4)</th>
                  <th style={{ textAlign: 'right' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((st) => {
                  const installments = st.fee_status?.installments || st.fees?.installments || [];
                  const className = st.class?.name || st.class_name || 'N/A';
                  const sectionName = st.section?.name || st.section_name || 'N/A';
                  return (
                    <tr key={st.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>STD-{String(st.id).padStart(4, '0')}</td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                          {st.first_name} {st.last_name}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{className}</span>
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                          <span style={{ padding: '2px 8px', backgroundColor: 'var(--bg-subtle)', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600, color: 'var(--crimson-700)' }}>
                            Section {sectionName}
                          </span>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        {st.date_of_birth ? new Date(st.date_of_birth).toLocaleDateString() : 'N/A'}
                      </td>
                      <td>
                        {/* 4 Quarter Pill Indicators */}
                        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                          {[1, 2, 3, 4].map((qNum) => {
                            const inst = installments.find((i) => i.installment_number === qNum);
                            const isPaid = inst?.status === 'PAID';
                            return (
                              <div
                                key={qNum}
                                title={
                                  inst
                                    ? `Q${qNum}: ${inst.status}${isPaid && inst.payment?.receipt_number ? ` (Receipt: ${inst.payment.receipt_number})` : ''}`
                                    : `Q${qNum}: Not Generated`
                                }
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: 4,
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  backgroundColor: isPaid ? '#ecfdf5' : '#fffbeb',
                                  color: isPaid ? '#065f46' : '#92400e',
                                  border: `1px solid ${isPaid ? '#a7f3d0' : '#fde68a'}`,
                                  cursor: 'default'
                                }}
                              >
                                Q{qNum}: {isPaid ? 'PAID' : (inst?.status || 'PENDING')}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedStudent(st)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        >
                          Profile & Ledger
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Student Details & Fee Roster Modal */}
      <Modal
        isOpen={Boolean(selectedStudent)}
        onClose={() => setSelectedStudent(null)}
        title={`Student Profile: ${selectedStudent?.first_name} ${selectedStudent?.last_name}`}
        maxWidth="580px"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <button
              type="button"
              onClick={() => setSelectedStudent(null)}
              className="btn btn-secondary btn-sm"
            >
              Close
            </button>
          </div>
        }
      >
        {selectedStudent && (() => {
          const studentInstallments = selectedStudent.fee_status?.installments || selectedStudent.fees?.installments || [];
          const modalClassName = selectedStudent.class?.name || selectedStudent.class_name || 'N/A';
          const modalSectionName = selectedStudent.section?.name || selectedStudent.section_name || 'N/A';

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Student Profile Card */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                padding: 16,
                backgroundColor: '#f8fafc',
                borderRadius: 8,
                border: '1px solid var(--border-subtle)',
                fontSize: '0.8125rem'
              }}>
                <div><strong>Student ID:</strong> STD-{String(selectedStudent.id).padStart(4, '0')}</div>
                <div><strong>Class & Section:</strong> {modalClassName} — Section {modalSectionName}</div>
                <div><strong>Date of Birth:</strong> {selectedStudent.date_of_birth ? new Date(selectedStudent.date_of_birth).toLocaleDateString() : 'N/A'}</div>
                <div><strong>Enrolled On:</strong> {selectedStudent.enrolled_at ? new Date(selectedStudent.enrolled_at).toLocaleDateString() : 'N/A'}</div>
              </div>

              {/* Quarterly Fee Breakdown */}
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>
                Quarterly Fee Clearance Status
              </h4>

              {studentInstallments.length === 0 ? (
                <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 8 }}>
                  No fee schedule assigned to this student.
                </div>
              ) : (
                <div className="table-container" style={{ border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Quarter</th>
                        <th>Amount</th>
                        <th>Due Date</th>
                        <th>Status</th>
                        <th>Receipt #</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentInstallments.map((inst) => (
                        <tr key={inst.id}>
                          <td style={{ fontWeight: 600 }}>Quarter {inst.installment_number}</td>
                          <td style={{ fontWeight: 700 }}>{formatCurrency(inst.amount)}</td>
                          <td style={{ fontSize: '0.8125rem' }}>
                            {inst.due_date ? new Date(inst.due_date).toLocaleDateString() : 'N/A'}
                          </td>
                          <td>
                            <StatusBadge status={inst.status} />
                          </td>
                          <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                            {inst.payment?.receipt_number || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            <div style={{
              padding: '10px 14px',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: 6,
              fontSize: '0.75rem',
              color: 'var(--text-muted)'
            }}>
              <strong>Note for Faculty:</strong> Fee collection and official receipt recording are restricted to administrative bursar staff. If a parent presents a fee inquiry, please direct them to the administration office.
            </div>
          </div>
        ); })()}
      </Modal>
    </div>
  );
};

export default TeacherDashboard;
