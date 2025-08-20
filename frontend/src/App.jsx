// eslint-disable-next-line no-unused-vars
import React, { useContext } from 'react'
import Home from './pages/Home'
import Doctors from './pages/Doctors'
import Login from './pages/Login'
import About from './pages/About'
import Contact from './pages/Contact'
import MyProfile from './pages/MyProfile'
import MyAppointments from './pages/MyAppointments'
import Appointment from './pages/Appointment'
import { ToastContainer } from 'react-toastify';
import { Route, Routes, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ForgotPassword from './pages/ForgetPassword';  // Adjust path as needed
import ResetPassword from './pages/ResetPassword'
import DocMate from './pages/DocMate'
import VerifyCodePage from './pages/VerifyCode'

const App = () => {
  const location = useLocation(); // Hook to get current location
  // const { token } = useContext(AppContext)
  // Corrected condition to check if we're on the login, forgot-password, or reset-password pages
  const isLoginPage = location.pathname === '/login' || location.pathname === '/forgot-password' || location.pathname === '/reset-password' || location.pathname === '/verify-code';

  return (
    <div className='mx-4 sm:mx-[10%]'>
      {/* Only render Navbar and Footer if we're not on the login, forgot-password, or reset-password pages */}
      {!isLoginPage && <Navbar />}

      <ToastContainer />

      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/doctors' element={<Doctors />} />
        <Route path='/doctors/:speciality' element={<Doctors />} />
        <Route path='/login' element={<Login />} />
        <Route path='/about' element={<About />} />
        <Route path='/contact' element={<Contact />} />
        <Route path='/my-profile' element={<MyProfile />} />
        <Route path='/my-appointments' element={<MyAppointments />} />
        <Route path='/appointment/:docId' element={<Appointment />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/doc-mate" element={<DocMate />} />
        <Route path="/verify-code" element={<VerifyCodePage />} />

      </Routes>
      {/* {token && <FixedButton />} */}
      {/* Only render Footer if we're not on the login, forgot-password, or reset-password pages */}
      {!isLoginPage && <Footer />}
    </div>
  );
}

export default App;
