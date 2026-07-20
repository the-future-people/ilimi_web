import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import SelectMembership from './pages/SelectMembership'
import RoleRedirect from './pages/RoleRedirect'
import ProtectedRoute from './components/ProtectedRoute'
import TeacherPortal from './pages/teacher/TeacherPortal'
import Classroom from './pages/teacher/Classroom'
import ClassDetail from './pages/teacher/ClassDetail'
import AdminPortal from './pages/admin/AdminPortal'
import StudentList from './pages/admin/StudentList'
import StudentDetail from './pages/admin/StudentDetail'
import EnrolWizard from './pages/admin/EnrolWizard'
import Register from './pages/Register'
import StudentDocumentationHub from './pages/admin/StudentDocumentationHub'
import StaffList from './pages/admin/StaffList'
import StaffRegistrationWizard from './pages/admin/StaffRegistrationWizard'
import PublicEnrolForm from './pages/PublicEnrolForm'
import OnboardingCenter from './pages/admin/OnboardingCenter'
import CommunicationsCenter from './pages/admin/CommunicationsCenter'

function App() {
  return (
    <Routes>
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/select-membership" element={<SelectMembership />} />
      <Route path="/redirect" element={<RoleRedirect />} />
      <Route path="/admin/students/enrol" element={ <ProtectedRoute requiredRole={['school_admin', 'branch_manager']}> <EnrolWizard /> </ProtectedRoute>}/>
      <Route path="/enrol/:token" element={<PublicEnrolForm />} />
      <Route
        path="/admin/students/documents"
        element={
          <ProtectedRoute requiredRole={['school_admin', 'branch_manager']}>
            <StudentDocumentationHub />
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
        path="/admin/students/:studentId"
        element={
          <ProtectedRoute requiredRole={['school_admin', 'branch_manager']}>
            <StudentDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/staff"
        element={
          <ProtectedRoute requiredRole={['school_admin', 'branch_manager']}>
            <StaffList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/staff/register"
        element={
          <ProtectedRoute requiredRole={['school_admin', 'branch_manager']}>
            <StaffRegistrationWizard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/students/onboarding"
        element={
          <ProtectedRoute requiredRole={['school_admin', 'branch_manager']}>
            <OnboardingCenter />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin/students"
        element={
          <ProtectedRoute requiredRole={['school_admin', 'branch_manager']}>
            <StudentList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher"
        element={
          <ProtectedRoute requiredRole="teacher">
            <TeacherPortal />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole={['school_admin', 'branch_manager']}>
            <AdminPortal />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<RoleRedirect />} />
      <Route
        path="/admin/communications"
        element={
          <ProtectedRoute requiredRole={['school_admin', 'branch_manager']}>
            <CommunicationsCenter />
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