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
import AccountantPortal from './pages/accountant/AccountantPortal'
import CollectPayment from './pages/accountant/CollectPayment'
import RegistrarPortal from './pages/registrar/RegistrarPortal'
import GuardianManagement from './pages/registrar/GuardianManagement'
import StaffSetup from './pages/StaffSetup'
import ForgotPassword from './pages/ForgotPassword'
import StaffDetail from './pages/admin/StaffDetail'

/**
 * Routes are guarded by what a page needs, not by job title.
 *
 * Roles and their permissions live in the database per school now, so a
 * school that gives fees to its administrator gets working fee screens
 * without anything here changing. Naming roles in a guard would have
 * broken that the first time a school was set up differently.
 *
 * The teacher routes are the exception: a teaching workspace belongs to
 * someone who teaches, which is a property of the person rather than a
 * domain permission.
 */

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
      {/* ── Public ─────────────────────────────────────────────────────── */}
      <Route path="/" element={<LandingOrRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/select-membership" element={<SelectMembership />} />
      <Route path="/redirect" element={<RoleRedirect />} />
      <Route path="/enrol/:token" element={<PublicEnrolForm />} />
      <Route path="/staff/setup/:token" element={<StaffSetup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* ── Admin ──────────────────────────────────────────────────────── */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredDomain="students" requiredLevel="view">
            <AdminPortal />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/students"
        element={
          <ProtectedRoute requiredDomain="students" requiredLevel="view">
            <StudentsClassesAdmissions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/students/enrol"
        element={
          <ProtectedRoute requiredDomain="students">
            <EnrolWizard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/students/onboarding"
        element={
          <ProtectedRoute requiredDomain="students">
            <OnboardingCenter />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/students/documents"
        element={
          <ProtectedRoute requiredDomain="documents">
            <StudentDocumentationHub />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/students/:studentId"
        element={
          <ProtectedRoute requiredDomain="students" requiredLevel="view">
            <StudentDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/staff"
        element={
          <ProtectedRoute requiredDomain="staff" requiredLevel="view">
            <StaffTabs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/staff/register"
        element={
          <ProtectedRoute requiredDomain="staff">
            <StaffRegistrationWizard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/staff/:staffId"
        element={
          <ProtectedRoute requiredDomain="staff" requiredLevel="view">
            <StaffDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/communications"
        element={
          <ProtectedRoute requiredDomain="communications" requiredLevel="request">
            <CommunicationsCenter />
          </ProtectedRoute>
        }
      />

      {/* ── Fees ───────────────────────────────────────────────────────── */}
      <Route
        path="/accountant"
        element={
          <ProtectedRoute requiredDomain="fees" requiredLevel="view">
            <AccountantPortal />
          </ProtectedRoute>
        }
      />
      <Route
        path="/accountant/collect"
        element={
          <ProtectedRoute requiredDomain="fees">
            <CollectPayment />
          </ProtectedRoute>
        }
      />

      {/* ── Registry ───────────────────────────────────────────────────── */}
      <Route
        path="/registrar"
        element={
          <ProtectedRoute requiredDomain="students" requiredLevel="view">
            <RegistrarPortal />
          </ProtectedRoute>
        }
      />
      <Route
        path="/registrar/guardians"
        element={
          <ProtectedRoute requiredDomain="parents">
            <GuardianManagement />
          </ProtectedRoute>
        }
      />

      {/* ── Teacher ────────────────────────────────────────────────────── */}
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