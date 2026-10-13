import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';

// Layouts
import AdminLayout from './components/AdminLayout';
import TeacherLayout from './components/TeacherLayout';

// Admin Views
import AdminOverview from './pages/admin/AdminOverview';
import AdminAdmissions from './pages/admin/AdminAdmissions';
import AdminStudents from './pages/admin/AdminStudents';
import AdminTeachers from './pages/admin/AdminTeachers';
import AdminAssignments from './pages/admin/AdminAssignments';
import AdminClasses from './pages/admin/AdminClasses';
import AdminFeeStructures from './pages/admin/AdminFeeStructures';
import AdminPayments from './pages/admin/AdminPayments';

// Teacher Views
import TeacherDashboard from './pages/teacher/TeacherDashboard';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Admin Portal (Restricted to role: 'admin') */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminOverview />} />
                <Route path="admissions" element={<AdminAdmissions />} />
                <Route path="students" element={<AdminStudents />} />
                <Route path="teachers" element={<AdminTeachers />} />
                <Route path="assignments" element={<AdminAssignments />} />
                <Route path="classes" element={<AdminClasses />} />
                <Route path="fees" element={<AdminFeeStructures />} />
                <Route path="payments" element={<AdminPayments />} />
              </Route>
            </Route>

            {/* Teacher Portal (Restricted to role: 'teacher') */}
            <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
              <Route path="/teacher" element={<TeacherLayout />}>
                <Route index element={<TeacherDashboard />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
