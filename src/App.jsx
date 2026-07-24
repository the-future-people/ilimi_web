import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import SelectMembership from './pages/SelectMembership'
import RoleRedirect from './pages/RoleRedirect'
import ProtectedRoute from './components/ProtectedRoute'
import TeacherPortal from './pages/teacher/TeacherPortal'
import Classroom from './pages/teacher/Classroom'
import ClassDetail from './pages/teacher/ClassDetail'
import AdminPortal from './pages/admin/AdminPortal'
import StudentsClassesAdmissions from './pages/admin/StudentsClassesAdmissions'
import StudentDetail from './pages/admin/StudentDetail'
import EnrolWizard from './pages/admin/EnrolWizard'
import Register from './pages/Register'
import StudentDocumentationHub from './pages/admin/StudentDocumentationHub'
import StaffTabs from './pages/admin/StaffTabs'
import StaffRegistrationWizard from './pages/admin/StaffRegistrationWizard'
import PublicEnrolForm from './pages/PublicEnrolForm'
import OnboardingCenter from './pages/admin/OnboardingCenter'
import CommunicationsCenter from './pages/admin/CommunicationsCenter'
import LandingPage from './pages/public/LandingPage'
import { useAuth } from './context/AuthContext'

const ADMIN_ROLES = ['school_admin', 'branch_manager']

/**
 * The public landing page lives at "/". A logged-in visitor hitting the
 * marketing page is sent to the role redirect instead, so returning users
 * land in their dashboard rather than the pitch. While auth is still
 * resolving, render the landing page rather than flashing a redirect.
 */
function LandingOrRedirect() {
  const { user, loading } = useAuth()
  if (!loading && user) {
    return <Navigate to="/redirect" replace />
  }
  return <LandingPage />
}

function App() {
  return (
    <Routes>
      {/* ── Public ─────────────────────────────────────────────── */}
      <Route path="/" element={<LandingOrRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/select-membership" element={<SelectMembership />} />
      <Route path="/redirect" element={<RoleRedirect />} />
      <Route path="/enrol/:token" element={<PublicEnrolForm />} />

      {/* ── Admin ──────────────────────────────────────────────── */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole={ADMIN_ROLES}>
            <AdminPortal />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/students"
        element={
          <ProtectedRoute requiredRole={[...ADMIN_ROLES, 'registrar']}>
            <StudentsClassesAdmissions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/students/enrol"
        element={
          <ProtectedRoute requiredRole={ADMIN_ROLES}>
            <EnrolWizard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/students/onboarding"
        element={
          <ProtectedRoute requiredRole={ADMIN_ROLES}>
            <OnboardingCenter />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/students/documents"
        element={
          <ProtectedRoute requiredRole={ADMIN_ROLES}>
            <StudentDocumentationHub />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/students/:studentId"
        element={
          <ProtectedRoute requiredRole={ADMIN_ROLES}>
            <StudentDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/staff"
        element={
          <ProtectedRoute requiredRole={ADMIN_ROLES}>
            <StaffTabs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/staff/register"
        element={
          <ProtectedRoute requiredRole={ADMIN_ROLES}>
            <StaffRegistrationWizard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/communications"
        element={
          <ProtectedRoute requiredRole={ADMIN_ROLES}>
            <CommunicationsCenter />
          </ProtectedRoute>
        }
      />

      {/* ── Teacher ────────────────────────────────────────────── */}
      <Route
        path="/teacher"
        element={
          <ProtectedRoute requiredRole="teacher">
            <TeacherPortal />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/classroom"
        element={
          <ProtectedRoute requiredRole="teacher">
            <Classroom />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/classroom/:classroomId"
        element={
          <ProtectedRoute requiredRole="teacher">
            <ClassDetail />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App