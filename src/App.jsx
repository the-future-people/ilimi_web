import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import SelectMembership from './pages/SelectMembership'
import RoleRedirect from './pages/RoleRedirect'
import ProtectedRoute from './components/ProtectedRoute'
import TeacherPortal from './pages/teacher/TeacherPortal'
import Classroom from './pages/teacher/Classroom'
import ClassDetail from './pages/teacher/ClassDetail'
import AdminPortal from './pages/admin/AdminPortal'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/select-membership" element={<SelectMembership />} />
      <Route path="/redirect" element={<RoleRedirect />} />
      <Route
              path="/teacher/classroom"
              element={
                <ProtectedRoute requiredRole="teacher">
                  <Classroom />
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