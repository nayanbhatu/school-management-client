import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import { 
  FileCheck2, 
  GraduationCap, 
  Users2, 
  Receipt, 
  ArrowRight, 
  Clock, 
  AlertCircle,
  RefreshCw,
  Plus
} from 'lucide-react';

export const AdminOverview = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [stats, setStats] = useState({
    totalAdmissions: 0,
    pendingAdmissions: 0,
    enrolledStudents: 0,
    totalTeachers: 0,
    activeTeachers: 0,
    totalClasses: 0
  });

  const [recentApplications, setRecentApplications] = useState([]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [admRes, stuRes, teaRes, clsRes] = await Promise.all([
        api.get('/admissions'),
        api.get('/students'),
        api.get('/teachers'),
        api.get('/classes')
      ]);

      const applications = admRes.data || [];
      const pendingCount = applications.filter((a) => a.status === 'PENDING').length;
      
      const students = stuRes.data || [];
      const teachers = teaRes.data || [];
      const activeTeacherCount = teachers.filter((t) => t.is_active).length;
      const classes = clsRes.data || [];

      setStats({
        totalAdmissions: applications.length,
        pendingAdmissions: pendingCount,
        enrolledStudents: students.length,
        totalTeachers: teachers.length,
        activeTeachers: activeTeacherCount,
        totalClasses: classes.length
      });

      // Show the 6 most recent applications
      setRecentApplications(applications.slice(0, 6));
    } catch (err) {
      setError(err.message || 'Failed to load administrative overview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--crimson-700)' }} />
        <p>Loading operational dashboard metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: 24,
        backgroundColor: 'var(--status-rejected-bg)',
        border: '1px solid var(--status-rejected-border)',
        borderRadius: 12,
        color: 'var(--status-rejected-text)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
        <button type="button" onClick={loadData} className="btn btn-secondary btn-sm">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Page Title & Refresh */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.75rem', color: 'var(--text-main)', margin: 0 }}>
              Operations Overview
            </h1>
            <span style={{
              padding: '3px 10px',
              borderRadius: 20,
              backgroundColor: 'var(--crimson-50)',
              color: 'var(--crimson-700)',
              fontWeight: 700,
              fontSize: '0.75rem',
              border: '1px solid var(--crimson-200)',
              letterSpacing: '0.02em'
            }}>
              AY 2026-2027
            </span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Real-time status of admissions, student enrollments, faculty, and fee clearance for Academic Year 2026-2027.
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          className="btn btn-secondary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <RefreshCw size={14} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* 4 Metric Cards */}
      <div className="overview-stats-grid">
        {/* Metric 1 */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>Admissions</span>
            <div style={{ padding: 6, borderRadius: 8, backgroundColor: 'var(--crimson-50)', color: 'var(--crimson-700)' }}>
              <FileCheck2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: 'var(--text-main)' }}>
            {stats.totalAdmissions}
          </div>
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem' }}>
            <span className="badge badge-pending" style={{ padding: '2px 6px' }}>
              {stats.pendingAdmissions} Pending Decision
            </span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>Enrolled Students</span>
            <div style={{ padding: 6, borderRadius: 8, backgroundColor: 'var(--crimson-50)', color: 'var(--crimson-700)' }}>
              <GraduationCap size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: 'var(--text-main)' }}>
            {stats.enrolledStudents}
          </div>
          <div style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Across {stats.totalClasses} academic classes
          </div>
        </div>

        {/* Metric 3 */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>Faculty Staff</span>
            <div style={{ padding: 6, borderRadius: 8, backgroundColor: 'var(--crimson-50)', color: 'var(--crimson-700)' }}>
              <Users2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: 'var(--text-main)' }}>
            {stats.totalTeachers}
          </div>
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem' }}>
            <span className="badge badge-approved" style={{ padding: '2px 6px' }}>
              {stats.activeTeachers} Active Faculty
            </span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>Fee Operations</span>
            <div style={{ padding: 6, borderRadius: 8, backgroundColor: 'var(--crimson-50)', color: 'var(--crimson-700)' }}>
              <Receipt size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: 'var(--text-main)' }}>
            4 Quarters
          </div>
          <div style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Installment schedule tracking
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="card" style={{ marginBottom: 32, padding: 20 }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: 14 }}>
          Operational Workflows
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <button
            type="button"
            onClick={() => navigate('/admin/admissions')}
            className="btn btn-primary btn-sm"
          >
            <FileCheck2 size={15} />
            <span>Review Admissions ({stats.pendingAdmissions})</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin/students')}
            className="btn btn-secondary btn-sm"
          >
            <GraduationCap size={15} />
            <span>Enroll Approved Applicants</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin/payments')}
            className="btn btn-secondary btn-sm"
          >
            <Receipt size={15} />
            <span>Record Installment Payment</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin/teachers')}
            className="btn btn-secondary btn-sm"
          >
            <Plus size={15} />
            <span>Create Faculty Account</span>
          </button>
        </div>
      </div>

      {/* Recent Applications Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Recent Admission Applications</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Latest candidate submissions requiring evaluation
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin/admissions')}
            className="btn btn-outline btn-sm"
          >
            <span>View All Applications</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {recentApplications.length === 0 ? (
          <div style={{ padding: '36px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            No admission applications found.
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Student Name</th>
                  <th>Target Class</th>
                  <th>Parent / Guardian</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentApplications.map((app) => (
                  <tr key={app.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>#{app.id}</td>
                    <td style={{ fontWeight: 600 }}>{app.student_first_name} {app.student_last_name}</td>
                    <td>{app.target_class_name || `Class ${app.target_class_id}`}</td>
                    <td>
                      <div>{app.parent_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{app.parent_email}</div>
                    </td>
                    <td>
                      <StatusBadge status={app.status} />
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/admissions?id=${app.id}`)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOverview;
