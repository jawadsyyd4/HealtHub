// eslint-disable-next-line no-unused-vars
import React from 'react'
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

const App = () => {
  const location = useLocation(); // Hook to get current location

  const isLoginPage = location.pathname === '/login';

  return (
    <div className='mx-4 sm:mx-[10%]'>
      {/* Only render Navbar and Footer if we're not on the /login page */}
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
      </Routes>

      {/* Only render Footer if we're not on the /login page */}
      {!isLoginPage && <Footer />}
    </div>
  );
}

export default App
