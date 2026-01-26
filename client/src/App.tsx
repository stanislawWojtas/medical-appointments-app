import { Route, Routes, Navigate } from "react-router"
import DoctorDashboard from "./pages/DoctorDashboard"
import HomePage from "./pages/HomePage"
import MainLayout from "./pages/MainLayout"
import PatientBookingPage from "./pages/PatientBookingPage"
import MyAppointmentsPage from "./pages/MyAppointmentsPage"
import ReviewsPage from "./pages/ReviewsPage"
import AdminRegisterDoctor from "./pages/AdminRegisterDoctor"
import AdminPatients from "./pages/AdminPatients"
import AdminDoctorsReviews from "./pages/AdminDoctorsReviews"
import AdminNav from "./components/AdminNav"
import { LoginPage } from "./pages/LoginPage"
import { RegisterPage } from "./pages/RegisterPage"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { useAuth } from "./context/AuthContext"
import { Box } from "@chakra-ui/react"

// Strona główna - przekierowanie w zależności od roli
const HomeRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/home" replace />;
  }
  
  if (user?.role === 'DOCTOR') {
    return <Navigate to="/doctor/dashboard" replace />;
  } else if (user?.role === 'ADMIN') {
    return <Navigate to="/admin/register-doctor" replace />;
  } else {
    return <Navigate to="/home" replace />;
  }
};

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomeRedirect />} />
          
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          
          <Route path="doctor/dashboard" element={
            <ProtectedRoute allowedRoles={['DOCTOR']}>
              <DoctorDashboard />
            </ProtectedRoute>
          } />

          <Route path="doctor/reviews" element={
            <ProtectedRoute allowedRoles={['DOCTOR']}>
              <ReviewsPage />
            </ProtectedRoute>
          } />

          {/* ADMIN ROUTES */}
          <Route path="admin/register-doctor" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Box>
                <AdminNav />
                <AdminRegisterDoctor />
              </Box>
            </ProtectedRoute>
          } />

          <Route path="admin/patients" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Box>
                <AdminNav />
                <AdminPatients />
              </Box>
            </ProtectedRoute>
          } />

          <Route path="admin/reviews" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Box>
                <AdminNav />
                <AdminDoctorsReviews />
              </Box>
            </ProtectedRoute>
          } />
          
          <Route path="home" element={<HomePage />} />
          
          <Route path="booking/doctor/:doctorId" element={
            <ProtectedRoute allowedRoles={['PATIENT']}>
              <PatientBookingPage />
            </ProtectedRoute>
          } />
          
          <Route path="my-appointments" element={
            <ProtectedRoute allowedRoles={['PATIENT']}>
              <MyAppointmentsPage />
            </ProtectedRoute>
          } />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>   
    </>
  )
}

export default App
