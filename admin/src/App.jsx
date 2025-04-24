// eslint-disable-next-line no-unused-vars
import React, { useContext } from 'react'
import Login from './pages/Login'
import { ToastContainer } from 'react-toastify';
import { AdminContext } from './context/AdminContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { Route, Routes } from 'react-router-dom';
import Dashboard from "./pages/Admin/Dashboard.jsx"
import AddDoctor from "./pages/Admin/AddDoctor.jsx"
import AllApointments from "./pages/Admin/AllApointments.jsx"
import DoctorsList from "./pages/Admin/DoctorsList.jsx"
import { DoctorContext } from './context/DoctorContext.jsx';
import DoctorDashboard from './pages/Doctor/DoctorDashboard.jsx';
import DoctorAppointments from './pages/Doctor/DoctorAppointments.jsx';
import DoctorProfile from './pages/Doctor/DoctorProfile.jsx';
import AddSpeciality from './pages/Admin/AddSpeciality.jsx';
import DoctorScheduleForm from './pages/Doctor/DoctorScheduleForm.jsx';
import GuestPatientTable from './pages/Admin/GuestPatientTable.jsx';
import GuestPatientForm from './pages/Admin/GuestPatientFormAdd.jsx';
import AppointmentForm from './pages/Admin/AppointmentForm.jsx';


const App = () => {

  const { aToken } = useContext(AdminContext)
  const { dToken } = useContext(DoctorContext)


  return aToken || dToken ? (
    <div className='bg-[#F8F9FD]'>
      <ToastContainer />
      <Navbar />
      <div className='flex items-start'>
        <Sidebar />
        <Routes>

          {/* ADMIN ROUTES */}
          <Route path='/' element={<></>} />
          <Route path='/admin-dashboard' element={<Dashboard />} />
          <Route path='/all-appointments' element={<AllApointments />} />
          <Route path='/add-doctor' element={<AddDoctor />} />
          <Route path='/doctor-list' element={<DoctorsList />} />
          <Route path='/add-speciality' element={<AddSpeciality />} />
          <Route path='/guest-patients' element={<GuestPatientTable />} />
          <Route path="/add-patient" element={<GuestPatientForm />} />
          <Route path="/add-patient/:patientId" element={<GuestPatientForm />} />
          <Route path="/patients/:patientId/book-appointment" element={<AppointmentForm />} />


          {/* DOCTOR ROUTES */}
          <Route path='/doctor-dashboard' element={<DoctorDashboard />} />
          <Route path='/doctor-appointments' element={<DoctorAppointments />} />
          <Route path='/doctor-profile' element={<DoctorProfile />} />
          <Route path='/doctor-schedule' element={<DoctorScheduleForm />} />

        </Routes >
      </div >
    </div >
  ) : (
    <>
      <Login />
      <ToastContainer />
    </>
  )
}

export default App
