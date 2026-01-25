import { Route, Routes, Navigate } from "react-router"
import DoctorDashboard from "./pages/DoctorDashboard"
import HomePage from "./pages/HomePage"
import MainLayout from "./pages/MainLayout"
import PatientBookingPage from "./pages/PatientBookingPage"
import { LoginPage } from "./pages/LoginPage"
import { RegisterPage } from "./pages/RegisterPage"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { useAuth } from "./context/AuthContext"

// Strona główna - przekierowanie w zależności od roli
const HomeRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (user?.role === 'DOCTOR') {
    return <Navigate to="/doctor-dashboard" replace />;
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
          
          <Route path="doctor-dashboard" element={
            <ProtectedRoute allowedRoles={['DOCTOR']}>
              <DoctorDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="home" element={
            <ProtectedRoute allowedRoles={['PATIENT']}>
              <HomePage />
            </ProtectedRoute>
          } />
          
          <Route path="booking/doctor/:doctorId" element={
            <ProtectedRoute allowedRoles={['PATIENT']}>
              <PatientBookingPage />
            </ProtectedRoute>
          } />
        </Route>

        {/* 404 - strona nie znaleziona */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>   
    </>
  )
}

export default App
