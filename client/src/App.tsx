import { Route, Routes } from "react-router"
import DoctorDashboard from "./pages/DoctorDashboard"
import HomePage from "./pages/HomePage"
import MainLayout from "./pages/MainLayout"
import PatientBookingPage from "./pages/PatientBookingPage"

function App() {

  return (
    <>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<DoctorDashboard />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/booking/doctor/:doctorId" element={<PatientBookingPage />} />
        </Route>
      </Routes>   
    </>
  )
}

export default App
