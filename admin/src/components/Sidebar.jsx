// eslint-disable-next-line no-unused-vars
import React, { useContext } from 'react'
import { AdminContext } from '../context/AdminContext'
import { NavLink } from 'react-router-dom'
import { assets } from '../assets/assets'
import { DoctorContext } from '../context/DoctorContext'

const Sidebar = () => {

    const { aToken } = useContext(AdminContext)
    const { dToken } = useContext(DoctorContext)

    return (
        <div className='min-h-screen bg-white border-r'>
            {
                aToken
                    ? <ul className='text-[#515151] mt-5'>
                        <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#C0EB6A]' : ''}`} to={'/admin-dashboard'}>
                            <img src={assets.home_icon} />
                            <p className='hidden md:block'>Dashboard</p>
                        </NavLink>
                        <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#C0EB6A]' : ''}`} to={'/all-appointments'}>
                            <img src={assets.appointment_icon} />
                            <p className='hidden md:block'>Appointments</p>
                        </NavLink>
                        <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#C0EB6A]' : ''}`} to={'/add-doctor'}>
                            <img src={assets.add_icon} />
                            <p className='hidden md:block'>Add Doctor</p>
                        </NavLink>
                        <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#C0EB6A]' : ''}`} to={'/doctor-list'}>
                            <img src={assets.people_icon} />
                            <p className='hidden md:block'>Doctors List</p>
                        </NavLink>
                        <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#C0EB6A]' : ''}`} to={'/add-speciality'}>
                            <img className='w-8' src={assets.speciality_icon} />
                            <p className='hidden md:block'>Speciality</p>
                        </NavLink>
                    </ul>
                    : <ul>

                    </ul>
            }

            {
                dToken
                    ? <ul className='text-[#515151] mt-5'>
                        <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#C0EB6A]' : ''}`} to={'/doctor-dashboard'}>
                            <img src={assets.home_icon} />
                            <p className='hidden md:block'>Dashboard</p>
                        </NavLink>
                        <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#C0EB6A]' : ''}`} to={'/doctor-appointments'}>
                            <img src={assets.appointment_icon} />
                            <p className='hidden md:block'>Appointments</p>
                        </NavLink>
                        <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#C0EB6A]' : ''}`} to={'/doctor-profile'}>
                            <img src={assets.people_icon} />
                            <p className='hidden md:block'>Profile</p>
                        </NavLink>
                        <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#C0EB6A]' : ''}`} to={'/doctor-schedule'}>
                            <img className='w-6' src={assets.dailyScheduleIcon} />
                            <p className='hidden md:block'>Schedule</p>
                        </NavLink>
                    </ul>
                    : <ul>

                    </ul>
            }
        </div>
    )
}

export default Sidebar
