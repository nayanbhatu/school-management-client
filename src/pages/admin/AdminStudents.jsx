import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import { useToast } from '../../context/ToastContext';
import { 
  GraduationCap, 
  Search, 
  Receipt, 
  UserPlus, 
  CheckCircle, 
  RefreshCw, 
  Loader2,
  Building2,
  Layers,
  ChevronRight,
  CreditCard
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const AdminStudents = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('directory'); // 'directory', 'enrolled', or 'pending-enrollment'
  const [students, setStudents] = useState([]);
  const [approvedApps, setApprovedApps] = useState([]);
  const [classes, setClasses] = useState([]);
  const [classSectionsMap, setClassSectionsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Class & Section filters for enrolled list & directory
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedDirectoryClassId, setSelectedDirectoryClassId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Enrollment Modal
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [selectedAppToEnroll, setSelectedAppToEnroll] = useState(null);
  const [availableSections, setAvailableSections] = useState([]);
  const [availableFeeStructures, setAvailableFeeStructures] = useState([]);
  const [enrollForm, setEnrollForm] = useState({
    section_id: '',
    fee_structure_id: ''
  });
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [enrollError, setEnrollError] = useState('');

  // Student Fee Details Drawer/Modal
  const [selectedStudentFees, setSelectedStudentFees] = useState(null);
  const [isFeesModalOpen, setIsFeesModalOpen] = useState(false);
  const [feesLoading, setFeesLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [stuRes, admRes, clsRes] = await Promise.all([
        api.get('/students'),
        api.get('/admissions', { status: 'APPROVED' }),
        api.get('/classes')
      ]);

      const enrolledList = stuRes.data || [];
      const approvedList = admRes.data || [];
      const classList = clsRes.data || [];

      // Filter approved apps that are not yet enrolled
      const enrolledAppIds = new Set(enrolledList.map((s) => s.application_id).filter(Boolean));
      const unenrolledApproved = approvedList.filter((a) => !enrolledAppIds.has(a.id));

      // Fetch sections for all classes concurrently for hierarchical directory
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

      setStudents(enrolledList);
      setApprovedApps(unenrolledApproved);
      setClasses(classList);
      setClassSectionsMap(secMap);
    } catch (err) {
      setError(err.message || 'Failed to load student enrollment records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openEnrollModal = async (app) => {
    setSelectedAppToEnroll(app);
    setEnrollError('');
    setEnrollForm({ section_id: '', fee_structure_id: '' });
    setIsEnrollModalOpen(true);

    try {
      // Fetch sections for the application's target class
      const [secRes, feeRes] = await Promise.all([
        api.get(`/classes/${app.target_class_id}/sections`),
        api.get('/fee-structures', { class_id: app.target_class_id })
      ]);

      setAvailableSections(secRes.data || []);
      const sortedFees = (feeRes.data || []).sort((a, b) => b.academic_year.localeCompare(a.academic_year));
      setAvailableFeeStructures(sortedFees);

      if (secRes.data && secRes.data.length > 0) {
        setEnrollForm((prev) => ({ ...prev, section_id: String(secRes.data[0].id) }));
      }
      if (sortedFees.length > 0) {
        const currentYearFee = sortedFees.find((f) => f.academic_year === '2026-2027') || sortedFees[0];
        setEnrollForm((prev) => ({ ...prev, fee_structure_id: String(currentYearFee.id) }));
      }
    } catch (err) {
      setEnrollError(err.message || 'Failed to fetch class sections or fee structures.');
    }
  };

  const handleEnrollSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAppToEnroll) return;
    setEnrollError('');

    if (!enrollForm.section_id || !enrollForm.fee_structure_id) {
      setEnrollError('Please select both a section and a fee structure.');
      return;
    }

    setEnrollLoading(true);
    try {
      const res = await api.post('/students/enroll', {
        application_id: selectedAppToEnroll.id,
        section_id: parseInt(enrollForm.section_id, 10),
        fee_structure_id: parseInt(enrollForm.fee_structure_id, 10)
      });

      toast.success(`Student ${selectedAppToEnroll.student_first_name} ${selectedAppToEnroll.student_last_name} enrolled successfully with 4 quarterly installments!`);
      setIsEnrollModalOpen(false);
      loadData();
    } catch (err) {
      setEnrollError(err.message || 'Enrollment failed.');
    } finally {
      setEnrollLoading(false);
    }
  };

  const viewStudentFees = async (student) => {
    setFeesLoading(true);
    setIsFeesModalOpen(true);
    try {
      const res = await api.get(`/students/${student.id}/fees`);
      setSelectedStudentFees(res.data);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch student fee ledger');
      setIsFeesModalOpen(false);
    } finally {
      setFeesLoading(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    const matchesClass = !selectedClassId || String(s.class_id) === String(selectedClassId);
    const query = searchQuery.toLowerCase();
    const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
    const sectionName = (s.section_name || '').toLowerCase();
    const matchesQuery = !query || fullName.includes(query) || sectionName.includes(query) || String(s.id).includes(query);
    return matchesClass && matchesQuery;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--text-main)', marginBottom: 4 }}>
            Students & Enrollment
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Manage active student rosters, class/section memberships, and enrollment from approved applications.
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
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid var(--border-subtle)', marginBottom: 24, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveTab('directory')}
          style={{
            padding: '10px 18px',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
            background: 'none',
            color: activeTab === 'directory' ? 'var(--crimson-700)' : 'var(--text-muted)',
            borderBottom: activeTab === 'directory' ? '2px solid var(--crimson-700)' : '2px solid transparent',
            marginBottom: -1,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <Layers size={16} />
          <span>Class Directory</span>
          <span style={{
            padding: '1px 7px',
            borderRadius: 10,
            fontSize: '0.75rem',
            backgroundColor: activeTab === 'directory' ? 'var(--crimson-50)' : 'var(--bg-subtle)',
            color: activeTab === 'directory' ? 'var(--crimson-700)' : 'var(--text-muted)'
          }}>
            {classes.length} Classes
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('enrolled')}
          style={{
            padding: '10px 18px',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
            background: 'none',
            color: activeTab === 'enrolled' ? 'var(--crimson-700)' : 'var(--text-muted)',
            borderBottom: activeTab === 'enrolled' ? '2px solid var(--crimson-700)' : '2px solid transparent',
            marginBottom: -1,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <GraduationCap size={16} />
          <span>All Students Roster</span>
          <span style={{
            padding: '1px 7px',
            borderRadius: 10,
            fontSize: '0.75rem',
            backgroundColor: activeTab === 'enrolled' ? 'var(--crimson-50)' : 'var(--bg-subtle)',
            color: activeTab === 'enrolled' ? 'var(--crimson-700)' : 'var(--text-muted)'
          }}>
            {students.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pending-enrollment')}
          style={{
            padding: '10px 18px',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
            background: 'none',
            color: activeTab === 'pending-enrollment' ? 'var(--crimson-700)' : 'var(--text-muted)',
            borderBottom: activeTab === 'pending-enrollment' ? '2px solid var(--crimson-700)' : '2px solid transparent',
            marginBottom: -1,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <UserPlus size={16} />
          <span>Approved Awaiting Enrollment</span>
          {approvedApps.length > 0 && (
            <span style={{
              padding: '1px 7px',
              borderRadius: 10,
              fontSize: '0.75rem',
              backgroundColor: '#ecfdf5',
              color: '#065f46',
              fontWeight: 700
            }}>
              {approvedApps.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: CLASS-WISE DIRECTORY */}
      {activeTab === 'directory' && (
        <div>
          {/* Controls Bar: Class Selection Pills & Search */}
          <div className="card" style={{ padding: '16px 20px', marginBottom: 20 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
              {/* Class Selector Pills */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', marginRight: 4 }}>
                  Select Class:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedDirectoryClassId('')}
                  className={`btn btn-sm ${selectedDirectoryClassId === '' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.8125rem', padding: '5px 12px' }}
                >
                  All Classes
                  <span style={{
                    marginLeft: 6,
                    padding: '1px 6px',
                    borderRadius: 10,
                    fontSize: '0.6875rem',
                    backgroundColor: selectedDirectoryClassId === '' ? 'rgba(255,255,255,0.25)' : 'var(--bg-subtle)'
                  }}>
                    {students.length}
                  </span>
                </button>
                {classes.map((cls) => {
                  const classStudentsCount = students.filter((s) => s.class_id === cls.id).length;
                  const isSelected = String(selectedDirectoryClassId) === String(cls.id);
                  return (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => setSelectedDirectoryClassId(String(cls.id))}
                      className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.8125rem', padding: '5px 12px' }}
                    >
                      {cls.name}
                      <span style={{
                        marginLeft: 6,
                        padding: '1px 6px',
                        borderRadius: 10,
                        fontSize: '0.6875rem',
                        backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : 'var(--bg-subtle)'
                      }}>
                        {classStudentsCount}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search Box */}
              <div className="filter-search-box" style={{ position: 'relative', width: 280, maxWidth: '100%' }}>
                <input
                  type="text"
                  placeholder="Search student by name or ID..."
                  className="form-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: 34, fontSize: '0.8125rem', padding: '8px 12px 8px 34px' }}
                />
                <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: 11, top: 10 }} />
              </div>
            </div>
          </div>

          {/* Directory Hierarchy: Class -> Section -> Students */}
          {loading ? (
            <div className="card" style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--crimson-700)' }} />
              <p>Loading class directory and enrolled student records...</p>
            </div>
          ) : classes.length === 0 ? (
            <div className="card" style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
              <Building2 size={36} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: 4 }}>No academic classes found</div>
              <p style={{ fontSize: '0.8125rem' }}>Set up institutional classes to begin organizing students.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {classes
                .filter((cls) => !selectedDirectoryClassId || String(cls.id) === String(selectedDirectoryClassId))
                .map((cls) => {
                  const sections = classSectionsMap[cls.id] || [];
                  const classStudents = students.filter((s) => s.class_id === cls.id);

                  return (
                    <div key={cls.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                      {/* Class Header Banner */}
                      <div style={{
                        padding: '16px 20px',
                        backgroundColor: 'var(--bg-subtle)',
                        borderBottom: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 12
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 34,
                            height: 34,
                            borderRadius: 8,
                            backgroundColor: 'var(--crimson-700)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Building2 size={18} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '1.0625rem', color: 'var(--text-main)' }}>
                              {cls.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Academic Level {cls.level} &bull; {sections.length} Section{sections.length === 1 ? '' : 's'}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{
                            padding: '3px 10px',
                            borderRadius: 12,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            backgroundColor: classStudents.length > 0 ? 'var(--crimson-50)' : 'var(--bg-card)',
                            color: classStudents.length > 0 ? 'var(--crimson-700)' : 'var(--text-muted)',
                            border: '1px solid var(--border-subtle)'
                          }}>
                            {classStudents.length} Enrolled Student{classStudents.length === 1 ? '' : 's'}
                          </span>
                        </div>
                      </div>

                      {/* Sections List */}
                      {sections.length === 0 ? (
                        <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                          <p style={{ fontSize: '0.8125rem' }}>No sections configured for {cls.name}.</p>
                        </div>
                      ) : (
                        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                          {sections.map((sec) => {
                            // Filter students belonging to this specific section + apply search query
                            const q = searchQuery.toLowerCase().trim();
                            const sectionStudents = students.filter((s) => {
                              if (s.section_id !== sec.id) return false;
                              if (!q) return true;
                              const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
                              const stdId = `STD-${String(s.id).padStart(4, '0')}`.toLowerCase();
                              return fullName.includes(q) || stdId.includes(q) || String(s.id).includes(q);
                            });

                            const totalInSection = students.filter((s) => s.section_id === sec.id).length;

                            return (
                              <div
                                key={sec.id}
                                style={{
                                  border: '1px solid var(--border-subtle)',
                                  borderRadius: 8,
                                  overflow: 'hidden',
                                  backgroundColor: '#ffffff'
                                }}
                              >
                                {/* Section Header */}
                                <div style={{
                                  padding: '10px 16px',
                                  backgroundColor: 'rgba(155, 34, 38, 0.03)',
                                  borderBottom: '1px solid var(--border-subtle)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  flexWrap: 'wrap',
                                  gap: 8
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{
                                      width: 24,
                                      height: 24,
                                      borderRadius: 4,
                                      backgroundColor: 'var(--crimson-50)',
                                      color: 'var(--crimson-700)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontWeight: 700,
                                      fontSize: '0.75rem'
                                    }}>
                                      {sec.name}
                                    </div>
                                    <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                                      Section {sec.name}
                                    </span>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{
                                      fontSize: '0.75rem',
                                      color: 'var(--text-muted)',
                                      fontWeight: 500
                                    }}>
                                      Roster: {totalInSection} / {sec.capacity} Capacity
                                    </span>
                                    {totalInSection >= sec.capacity && (
                                      <span style={{
                                        fontSize: '0.6875rem',
                                        padding: '2px 6px',
                                        borderRadius: 4,
                                        backgroundColor: '#fef2f2',
                                        color: '#b91c1c',
                                        fontWeight: 600
                                      }}>
                                        FULL
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Section Students Table or Empty State */}
                                {sectionStudents.length === 0 ? (
                                  <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <GraduationCap size={24} color="#cbd5e1" style={{ margin: '0 auto 6px' }} />
                                    <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-main)' }}>
                                      {searchQuery
                                        ? `No students matching "${searchQuery}" in Section ${sec.name}`
                                        : `No enrolled students in Section ${sec.name} yet`}
                                    </div>
                                    {!searchQuery && (
                                      <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: 2 }}>
                                        Enroll approved applicants from the "Approved Awaiting Enrollment" tab.
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="table-container" style={{ border: 'none', borderRadius: 0, margin: 0 }}>
                                    <table className="data-table" style={{ margin: 0 }}>
                                      <thead>
                                        <tr>
                                          <th>Student ID</th>
                                          <th>Full Name</th>
                                          <th>Date of Birth</th>
                                          <th>Academic Year</th>
                                          <th>Enrolled On</th>
                                          <th>Status</th>
                                          <th style={{ textAlign: 'right' }}>Actions</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {sectionStudents.map((st) => (
                                          <tr key={st.id}>
                                            <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
                                              STD-{String(st.id).padStart(4, '0')}
                                              {st.application_id && (
                                                <div style={{ fontSize: '0.6875rem', color: 'var(--text-light)' }}>
                                                  App #{st.application_id}
                                                </div>
                                              )}
                                            </td>
                                            <td>
                                              <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                                                {st.first_name} {st.last_name}
                                              </div>
                                            </td>
                                            <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                              {st.date_of_birth ? new Date(st.date_of_birth).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td>
                                              <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                                                {st.academic_year || '2026-2027'}
                                              </span>
                                            </td>
                                            <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                              {st.enrolled_at ? new Date(st.enrolled_at).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td>
                                              <span style={{
                                                padding: '2px 8px',
                                                borderRadius: 10,
                                                fontSize: '0.6875rem',
                                                fontWeight: 600,
                                                backgroundColor: '#ecfdf5',
                                                color: '#065f46'
                                              }}>
                                                Enrolled
                                              </span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                              <div style={{ display: 'inline-flex', gap: 6 }}>
                                                <button
                                                  type="button"
                                                  onClick={() => viewStudentFees(st)}
                                                  className="btn btn-secondary btn-sm"
                                                  style={{ padding: '3px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}
                                                >
                                                  <Receipt size={12} />
                                                  <span>Fee Ledger</span>
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => navigate(`/admin/payments?studentId=${st.id}`)}
                                                  className="btn btn-primary btn-sm"
                                                  style={{ padding: '3px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}
                                                >
                                                  <CreditCard size={12} />
                                                  <span>Pay Fee</span>
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
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}


      {/* TAB 1: ENROLLED STUDENTS */}
      {activeTab === 'enrolled' && (
        <>
          {/* Filters Bar */}
          <div className="card" style={{ padding: '14px 20px', marginBottom: 20 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Filter by Class:
                </div>
                <select
                  className="form-select"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  style={{ width: 180, padding: '7px 12px', fontSize: '0.8125rem' }}
                >
                  <option value="">All Academic Classes</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="filter-search-box" style={{ position: 'relative', width: 280, maxWidth: '100%' }}>
                <input
                  type="text"
                  placeholder="Search student by name or ID..."
                  className="form-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: 34, fontSize: '0.8125rem', padding: '8px 12px 8px 34px' }}
                />
                <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: 11, top: 10 }} />
              </div>
            </div>
          </div>

          {/* Enrolled Students Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--crimson-700)' }} />
                <p>Loading enrolled students roster...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
                <GraduationCap size={36} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
                <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: 4 }}>No enrolled students found</div>
                <p style={{ fontSize: '0.8125rem' }}>Switch to the "Approved Awaiting Enrollment" tab to enroll new candidates.</p>
              </div>
            ) : (
              <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>Full Name</th>
                      <th>Class & Section</th>
                      <th>Date of Birth</th>
                      <th>Academic Year</th>
                      <th>Enrolled On</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((st) => (
                      <tr key={st.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>STD-{String(st.id).padStart(4, '0')}</td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                            {st.first_name} {st.last_name}
                          </div>
                          {st.application_id && (
                            <div style={{ fontSize: '0.6875rem', color: 'var(--text-light)' }}>
                              App #{st.application_id}
                            </div>
                          )}
                        </td>
                        <td>
                          <span style={{ fontWeight: 600 }}>{st.class_name}</span>
                          <span style={{ marginLeft: 6, padding: '2px 7px', backgroundColor: 'var(--bg-subtle)', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>
                            Sec {st.section_name}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                          {st.date_of_birth ? new Date(st.date_of_birth).toLocaleDateString() : 'N/A'}
                        </td>
                        <td>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                            {st.academic_year || '2026-2027'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                          {st.enrolled_at ? new Date(st.enrolled_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => viewStudentFees(st)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                            >
                              <Receipt size={13} />
                              <span>Fee Ledger</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate(`/admin/payments?student_id=${st.id}`)}
                              className="btn btn-outline btn-sm"
                              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                            >
                              Payments
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
        </>
      )}

      {/* TAB 2: APPROVED AWAITING ENROLLMENT */}
      {activeTab === 'pending-enrollment' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--crimson-700)' }} />
              <p>Checking approved applications...</p>
            </div>
          ) : approvedApps.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
              <CheckCircle size={36} color="#10b981" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: 4 }}>
                All approved applications are enrolled!
              </div>
              <p style={{ fontSize: '0.8125rem' }}>
                There are no pending approved applicants awaiting section assignment.
              </p>
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Application ID</th>
                    <th>Candidate Name</th>
                    <th>Target Class</th>
                    <th>Parent / Contact</th>
                    <th>Approved Decision</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {approvedApps.map((app) => (
                    <tr key={app.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>#{app.id}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                          {app.student_first_name} {app.student_last_name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                          DOB: {app.date_of_birth ? new Date(app.date_of_birth).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{app.target_class_name || `Class ${app.target_class_id}`}</span>
                      </td>
                      <td>
                        <div>{app.parent_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{app.parent_email}</div>
                      </td>
                      <td>
                        <StatusBadge status="APPROVED" />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => openEnrollModal(app)}
                          className="btn btn-primary btn-sm"
                          style={{ padding: '6px 14px', fontSize: '0.8125rem' }}
                        >
                          <UserPlus size={14} />
                          <span>Complete Enrollment</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Enrollment Action Modal */}
      <Modal
        isOpen={isEnrollModalOpen}
        onClose={() => !enrollLoading && setIsEnrollModalOpen(false)}
        title={`Enroll Student: ${selectedAppToEnroll?.student_first_name} ${selectedAppToEnroll?.student_last_name}`}
        maxWidth="540px"
      >
        <form onSubmit={handleEnrollSubmit}>
          {enrollError && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: 'var(--status-rejected-bg)',
              color: 'var(--status-rejected-text)',
              border: '1px solid var(--status-rejected-border)',
              borderRadius: 8,
              fontSize: '0.8125rem',
              marginBottom: 16
            }}>
              {enrollError}
            </div>
          )}

          <div style={{
            padding: 14,
            backgroundColor: '#f8fafc',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            marginBottom: 18,
            fontSize: '0.8125rem'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><strong>Candidate:</strong> {selectedAppToEnroll?.student_first_name} {selectedAppToEnroll?.student_last_name}</div>
              <div><strong>Target Class:</strong> {selectedAppToEnroll?.target_class_name}</div>
              <div><strong>Parent:</strong> {selectedAppToEnroll?.parent_name}</div>
              <div><strong>Application:</strong> #{selectedAppToEnroll?.id}</div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Assign Section *</label>
            {availableSections.length === 0 ? (
              <div style={{ fontSize: '0.8125rem', color: 'var(--crimson-700)' }}>
                No sections defined for this class. Please create a section in Classes & Sections first.
              </div>
            ) : (
              <select
                className="form-select"
                value={enrollForm.section_id}
                onChange={(e) => setEnrollForm({ ...enrollForm, section_id: e.target.value })}
                required
              >
                <option value="">Select compatible section...</option>
                {availableSections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    Section {sec.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Apply Annual Fee Structure *</label>
            {availableFeeStructures.length === 0 ? (
              <div style={{ fontSize: '0.8125rem', color: 'var(--crimson-700)' }}>
                No active fee structures found for this class. Please define a fee structure first.
              </div>
            ) : (
              <select
                className="form-select"
                value={enrollForm.fee_structure_id}
                onChange={(e) => setEnrollForm({ ...enrollForm, fee_structure_id: e.target.value })}
                required
              >
                <option value="">Select annual fee structure...</option>
                {availableFeeStructures.map((fs) => (
                  <option key={fs.id} value={fs.id}>
                    Academic Year {fs.academic_year} — Annual Fee: {formatCurrency(fs.annual_fee)} (4 Quarters of {formatCurrency(Number(fs.annual_fee) / 4)})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            backgroundColor: 'var(--bg-subtle)',
            padding: 10,
            borderRadius: 6,
            marginBottom: 20
          }}>
            <strong>Automatic Schedule Generation:</strong> Upon enrollment, 4 quarterly installments (Q1, Q2, Q3, Q4) will be generated for this student with sequential due dates.
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              type="button"
              disabled={enrollLoading}
              onClick={() => setIsEnrollModalOpen(false)}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={enrollLoading || availableSections.length === 0 || availableFeeStructures.length === 0}
              className="btn btn-primary btn-sm"
            >
              {enrollLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Enrolling Candidate...</span>
                </>
              ) : (
                <span>Confirm Enrollment</span>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Student Fee Ledger Modal */}
      <Modal
        isOpen={isFeesModalOpen}
        onClose={() => setIsFeesModalOpen(false)}
        title="Student Fee Ledger & Quarterly Breakdown"
        maxWidth="640px"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => {
                const sid = selectedStudentFees?.student?.id;
                setIsFeesModalOpen(false);
                if (sid) navigate(`/admin/payments?student_id=${sid}`);
              }}
              className="btn btn-primary btn-sm"
            >
              <Receipt size={14} />
              <span>Record Payment in Fee Portal</span>
            </button>
            <button
              type="button"
              onClick={() => setIsFeesModalOpen(false)}
              className="btn btn-secondary btn-sm"
            >
              Close
            </button>
          </div>
        }
      >
        {feesLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px', color: 'var(--crimson-700)' }} />
            <p>Loading fee ledger...</p>
          </div>
        ) : selectedStudentFees ? (
          <div>
            {/* Student Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 16,
              backgroundColor: '#f8fafc',
              borderRadius: 8,
              border: '1px solid var(--border-subtle)',
              marginBottom: 16
            }}>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>
                  {selectedStudentFees.student.first_name} {selectedStudentFees.student.last_name}
                </h4>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Class: {selectedStudentFees.student.class_name} | Section: {selectedStudentFees.student.section_name}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Academic Year</div>
                <div style={{ fontWeight: 700 }}>{selectedStudentFees.fee_structure?.academic_year || '2026-2027'}</div>
              </div>
            </div>

            {/* Financial Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
              <div style={{ padding: 12, backgroundColor: 'var(--bg-subtle)', borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Annual Fee</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 800 }}>
                  {formatCurrency(selectedStudentFees.summary?.annual_fee || 0)}
                </div>
              </div>
              <div style={{ padding: 12, backgroundColor: '#ecfdf5', borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#065f46' }}>Total Paid</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#065f46' }}>
                  {formatCurrency(selectedStudentFees.summary?.total_paid || 0)}
                </div>
              </div>
              <div style={{ padding: 12, backgroundColor: '#fef2f2', borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#991b1b' }}>Pending Due</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#991b1b' }}>
                  {formatCurrency(selectedStudentFees.summary?.total_pending || 0)}
                </div>
              </div>
            </div>

            {/* 4 Quarterly Installments */}
            <div className="table-container" style={{ border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Quarter</th>
                    <th>Due Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Receipt #</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedStudentFees.installments.map((inst) => (
                    <tr key={inst.id}>
                      <td style={{ fontWeight: 600 }}>Quarter {inst.installment_number}</td>
                      <td style={{ fontSize: '0.8125rem' }}>
                        {inst.due_date ? new Date(inst.due_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td style={{ fontWeight: 700 }}>{formatCurrency(inst.amount)}</td>
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
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default AdminStudents;
