// eslint-disable-next-line no-unused-vars
import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const MyAppointments = () => {
    const { backendUrl, token, getDoctorsData } = useContext(AppContext)

    const [appointments, setAppointments] = useState([])

    const months = [
        '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const slotDateFormat = (slotDate) => {
        const dateArray = slotDate.split('-')
        return dateArray[0] + " " + months[Number(dateArray[1])] + " " + dateArray[2]
    }

    const getUserAppointments = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/user/appointments', { headers: { token } })

            if (data.success) {
                setAppointments(data.appointments.reverse())
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error);
            toast.error(error.message)
        }
    }

    const cancelAppointment = async (appointmentId) => {
        try {

            const { data } = await axios.post(backendUrl + '/api/user/cancel-appointment', { appointmentId }, { headers: { token } })

            if (data.success) {
                toast.success(data.message)
                getUserAppointments()
                getDoctorsData()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message)
        }
    }

    // 

    const handlePay = async (appointmentId) => {
        try {
            const response = await axios.post(backendUrl + '/api/user/payment-stripepay', { appointmentId }, { headers: { token } }); // Simplified

            const { sessionId } = response.data;

            const stripe = Stripe('pk_test_51Qt6gBCtvmmvtm4maV8vYhgHS5I0AxTn4KX5iFLG1BaPysuTU1545tnlCuxmSduX1yGnN3ASCQzk5jgLTiZVGjI3001tGyTNRg'); // Use the global Stripe object
            const { error } = await stripe.redirectToCheckout({ sessionId });

            if (error) {
                console.error('Stripe error:', error);
                toast.error(error.message)
            }
        } catch (error) {
            console.error('Payment request error:', error);
        }
    };

    // 

    useEffect(() => {
        if (token) {
            getUserAppointments()
        }
    }, [token])

    return (
        <div>
            <p className='pb-3 mt-12 font-medium text-zinc-700 border-b'>My Appointments</p>
            <div>
                {appointments.map((item, index) => (
                    <div className='grid grid-cols-[1fr_2fr] gap-4 sm:flex sm:gap-6 py-2 border-b' key={index}>
                        <div>
                            <img className='w-32 bg-indigo-50' src={item.doctorData.image} alt="" />
                        </div>
                        <div className='flex-1 text-sm text-zinc-600'>
                            <p className='text-neutral-800 font-semibold'>{item.doctorData.name}</p>
                            <p>{item.doctorData.speciality}</p>
                            <p className='text-zinc-700 font-medium mt-1'>Address:</p>
                            <p className='text-xs'>{item.doctorData.address.line1}</p>
                            <p className='text-xs'>{item.doctorData.address.line2}</p>
                            <p className='text-sm mt-1'><span className='text-sm text-neutral-700 font-medium'>Date & Time:</span> {slotDateFormat(item.slotDate)} | {item.slotTime}</p>
                        </div>
                        <div></div>
                        <div className='flex flex-col gap-2 justify-end'>
                            {!item.cancelled && item.payment && !item.isCompleted && <button className='sm:min-w-48 py-2 border border-indigo-50 rounded text-stone-500'>Paid</button>}
                            {!item.cancelled && !item.payment && !item.isCompleted && <button onClick={() => handlePay(item._id)} className='cursor-pointer text-sm text-center text-stone-500 sm:min-w-48 py-2 border rounded hover:bg-[#5f6FFF] hover:text-white transition-all duration-300'>Pay Online</button>}
                            {!item.cancelled && !item.isCompleted && <button onClick={() => cancelAppointment(item._id)} className='text-sm text-center text-stone-500 sm:min-w-48 py-2 border rounded hover:bg-red-600 hover:text-white transition-all duration-300 cursor-pointer'>Cancel Appointment</button>}
                            {item.cancelled && !item.isCompleted && <button className='sm:min-w-48 py-2 border border-red-500 rounded text-red-500'>Appointment cancelled</button>}
                            {item.isCompleted && <button className='sm:min-w-48 py-2 border border-green-500 rounded text-green-500'>Completed</button>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default MyAppointments
