// eslint-disable-next-line no-unused-vars
import React from 'react'
import { useContext } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { useEffect } from 'react'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'

const DoctorAppointments = () => {

    const { dToken, getAppointments, appointments, cancelAppointment, completeAppointment } = useContext(DoctorContext)
    const { calculateAge, slotDateFormat, currency } = useContext(AppContext)

    useEffect(() => {
        if (dToken) {
            getAppointments()
        }
    }, [dToken])
    return (
        <div className='w-full max-w-6xl m-5'>
            <p className='mb-3 text-lg font-medium'>All Appointments</p>
            <div className="bg-white border rounded text-sm  max-h-[80vh] min-h-[50vh] overflow-y-scroll">
                <div className="max-sm:hidden grid grid-cols-[0.5fr_2fr_1fr_0.8fr_2fr_1fr_1fr_1.2fr] gap-1 py-3 px-6 border-b">
                    <p className='m-auto'>#</p>
                    <p className='m-auto'>Patient</p>
                    <p className='m-auto'>Payment</p>
                    <p className='m-auto'>Age</p>
                    <p className='m-auto'>Date & Time</p>
                    <p className='m-auto'>Confirmed</p>
                    <p className='m-auto'>Fees</p>
                    <p className='m-auto'>Action</p>
                </div>
                {
                    appointments.reverse().map((item, index) => (
                        <div className="flex flex-wrap justify-between max-sm:gap-5 max-sm:text-base sm:grid grid-cols-[0.5fr_2fr_1fr_0.8fr_2fr_1fr_1fr_1.2fr] gap-1 items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50" key={index}>
                            <p className='max-sm:hidden m-auto'>{index + 1}</p>
                            <div className="flex items-center gap-2 m-auto">
                                <img className='w-8 rounded-full' src={item.userData ? item.userData.image : assets.upload_area} alt="" />
                                <p>{item.userData ? item.userData.name : item.guestPatientId.name}</p>
                            </div>
                            <div className="m-auto">
                                <p className='text-xs inline border border-[#C0EB6A] px-2 rounded-full'>{item.payment ? 'ONLINE' : 'CASH'}</p>
                            </div>
                            <p className='max-sm:hidden m-auto'>{item.userData ? calculateAge(item.userData.dob) : calculateAge(item.guestPatientId.dateOfBirth)}</p>
                            <p className='m-auto'>{slotDateFormat(item.slotDate)}, {item.slotTime}</p>
                            <div className=''><p className={`w-2 h-2 m-auto ${item.confirmed ? 'bg-green-500' : 'bg-red-400'} rounded-full`}></p></div>
                            <p className='max-sm:hidden m-auto'>{currency}{item.amount}</p>
                            {
                                item.cancelled
                                    ? <p className='text-red-400 text-sm font-medium m-auto'>Cancelled</p>
                                    : item.isCompleted
                                        ? <p className='text-green-500 text-sm font-medium m-auto'>Completed</p>
                                        :
                                        <div className="flex m-auto">
                                            <img onClick={() => { cancelAppointment(item._id) }} className='w-10 cursor-pointer' src={assets.cancel_icon} alt="" />
                                            <img onClick={() => { completeAppointment(item._id) }} className='w-10 cursor-pointer' src={assets.tick_icon} alt="" />
                                        </div>
                            }
                        </div>
                    ))
                }
            </div>
        </div>
    )
}

export default DoctorAppointments
