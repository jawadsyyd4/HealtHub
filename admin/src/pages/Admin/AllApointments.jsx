// eslint-disable-next-line no-unused-vars
import React, { useContext, useEffect } from 'react';
import { AdminContext } from '../../context/AdminContext';
import { AppContext } from '../../context/AppContext';
import { assets } from '../../assets/assets';

const AllApointments = () => {
    const { aToken, appointments, getAllAppointments, cancelAppointment, setDocInfo } = useContext(AdminContext);
    const { calculateAge, slotDateFormat, currency } = useContext(AppContext);

    useEffect(() => {
        if (aToken) {
            getAllAppointments();
        }
        setDocInfo(false);
    }, [aToken]);

    return (
        <div className='w-full max-w-6xl m-5'>
            <p className='mb-3 text-lg font-medium'>All Appointments</p>
            <div className="bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll min-h-[60vh]">
                <div className="hidden sm:grid grid-cols-[0.5fr_3fr_1fr_3fr_3fr_1fr_1fr] grid-flow-col py-3 px-6 border-b">
                    <p className='m-auto'>#</p>
                    <p className='m-auto'>Patient</p>
                    <p className='m-auto'>Age</p>
                    <p className='m-auto'>Date & Time</p>
                    <p className='m-auto'>Doctor</p>
                    <p className='m-auto'>Fees</p>
                    <p className='m-auto'>Actions</p>
                </div>
                {appointments.reverse().map((item, index) => {

                    return (
                        <div key={index} className="flex flex-wrap justify-between max-sm:gap-2 sm:grid sm:grid-cols-[0.5fr_3fr_1fr_3fr_3fr_1fr_1fr] items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50">
                            <p className='max-sm:hidden m-auto'>{index + 1}</p>
                            <div className="flex items-center gap-2 m-auto">
                                <img className='w-8 rounded-full' src={item.userData ? item.userData.image : assets.upload_area} alt="" />
                                <p>{item.userData ? item.userData.name : item.guestPatientId.name}</p> {/* Display guest name if available */}
                            </div>
                            <p className='max-sm:hidden m-auto'>
                                {
                                    item.userData
                                        ? calculateAge(item.userData.dob)
                                        : calculateAge(item.guestPatientId.dateOfBirth)
                                }
                            </p>
                            <p className='m-auto'>{slotDateFormat(item.slotDate)}, {item.slotTime}</p>
                            <div className="flex items-center gap-2 m-auto">
                                <img className='w-8 rounded-full bg-gray-200' src={item.doctorData.image} alt="" />
                                <p>{item.doctorData.name}</p>
                            </div>
                            <p className='max-sm:hidden m-auto'>{currency}{item.amount}</p>
                            {
                                item.cancelled
                                    ? <p className='text-red-400 text-xs font-medium m-auto'>Cancelled</p>
                                    : item.isCompleted
                                        ? <p className='text-green-500 text-xs font-medium m-auto'>Completed</p>
                                        : <img onClick={() => cancelAppointment(item._id)} className='w-10 cursor-pointer m-auto' src={assets.cancel_icon} alt="" />
                            }
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AllApointments;
