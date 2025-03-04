// eslint-disable-next-line no-unused-vars
import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { assets } from '../assets/assets';
import RelatedDoctors from '../components/RelatedDoctors';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Rating } from 'primereact/rating';

const Appoitment = () => {

    const navigate = useNavigate('');

    const { docId } = useParams();
    const { doctors, currencySymbol, backendUrl, token, getDoctorsData } = useContext(AppContext);
    const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

    const [docInfo, setDocInfo] = useState(null)
    const [docSlots, setDocSlots] = useState([])
    const [slotIndex, setSlotIndex] = useState(0)
    const [slotTime, setSlotTime] = useState('')

    const [value, setValue] = useState(null);

    const [isEdit, setIsEdit] = useState(false)

    const fetchDocInfo = async () => {
        const docInfo = await doctors.find(doc => doc._id === docId)
        setDocInfo(docInfo)
    }

    const getAvailablesSlots = async () => {

        setDocSlots([])

        // Getting current date
        let today = new Date()
        for (let i = 1; i < 8; i++) {

            // getting date with index
            let currentDate = new Date(today)
            currentDate.setDate(today.getDate() + i)

            // setting end date with index
            let endTime = new Date()
            endTime.setDate(today.getDate() + i)
            endTime.setHours(17, 0, 0, 0)

            // setting hours
            if (today.getDate() === currentDate.getDate()) {
                currentDate.setHours(currentDate.getHours() > 10 ? currentDate.getHours() + 1 : 10)
                currentDate.setMinutes(currentDate.getMinutes() > 30 ? 30 : 0)
            } else {
                currentDate.setHours(10)
                currentDate.setMinutes(0)
            }

            let timeSlots = []

            while (currentDate < endTime) {

                let formatedTime = currentDate.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,  // This ensures the format is in 12-hour (AM/PM)
                });

                let day = currentDate.getDate()
                let month = currentDate.getMonth() + 1
                let year = currentDate.getFullYear()

                const slotDate = day + "_" + month + "_" + year

                const slotTime = formatedTime

                const isSlotAvailable = !(docInfo.slots_booked[slotDate] && docInfo.slots_booked[slotDate].includes(slotTime));

                if (isSlotAvailable) {
                    // add slot to array
                    timeSlots.push({
                        datetime: new Date(currentDate),
                        time: formatedTime
                    })
                }

                // Increment currentTime by 30 min
                currentDate.setMinutes(currentDate.getMinutes() + 30)

            }
            setDocSlots(prev => ([...prev, timeSlots]))
        }
    }

    const bookAppointment = async () => {
        if (!token) {
            toast.warn('Login to book appointment')
            return navigate('/login')
        }
        try {
            const date = docSlots[slotIndex][0].datetime

            let day = date.getDate()
            let month = date.getMonth() + 1
            let year = date.getFullYear()

            const slotDate = day + '_' + month + '_' + year

            const { data } = await axios.post(backendUrl + '/api/user/book-appointment', { docId, slotDate, slotTime }, { headers: { token } })

            if (data.success) {
                toast.success(data.message)
                getDoctorsData()
                navigate('/my-appointments')
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error);
            toast.error(error.message)
        }
    }

    const checkUserRate = async () => {
        try {
            const { data } = await axios.get(backendUrl + `/api/user/user-rate/${docId}`, { headers: { token } });
            if (data.success) {
                setValue(data.existingRating.rating); // Set the existing rating value
            } else {
                setValue(null)
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message);
        }
    };

    const handleRatingSubmit = async () => {
        try {
            setIsEdit(false)
            // Make sure value is the most recent
            const { data } = await axios.post(
                backendUrl + '/api/user/rate-doctor', // Adjust API endpoint
                {
                    doctorId: docId,
                    rating: value, // Use the updated state value here
                },
                { headers: { token } }
            );

            if (data.success) {
                toast.success(data.message);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message);
        }
    };


    useEffect(() => {
        fetchDocInfo()
        checkUserRate()
    }, [doctors, docId])

    useEffect(() => {
        getAvailablesSlots()
    }, [docInfo])

    useEffect(() => {
        fetchDocInfo()
    }, [docSlots])

    return docInfo && (
        <div>
            {/* DOCTOR DETAILS */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="">
                    <img className='bg-[#5f6FFF] w-full sm:max-w-72 rounded-lg' src={docInfo.image} alt="" />
                </div>
                {/* Section rate */}
                <div className="flex-1 border border-gray-400 rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px] sm:mt-0">
                    {/* DOC INFO name degree experience */}
                    <p className="flex items-center gap-2 text-2xl font-medium text-gray-900">
                        {docInfo.name} <img className="w-5" src={assets.verified_icon} alt="" />
                    </p>
                    <div className="flex items-center gap-2 text-sm mt-1 text-gray-600">
                        <p>
                            {docInfo.degree} - {docInfo.speciality}
                        </p>
                        <button className="py-0.5 px-2 border text-xs rounded-full">
                            {docInfo.experience}
                        </button>
                    </div>
                    {/* DOCTOR ABOUT */}
                    <div className="">
                        <p className="flex items-center gap-1 text-sm font-medium text-gray-900 mt-3">
                            About <img src={assets.info_icon} alt="" />
                        </p>
                        <p className="text-sm text-gray-500 max-w-[700px] mt-1">{docInfo.about}</p>
                    </div>
                    <p className="text-gray-500 font-medium mt-4">
                        Appointment fee: <span className="text-gray-600">
                            {currencySymbol}{docInfo.fees}
                        </span>
                    </p>

                    {
                        token &&
                        <div className="mt-4 font-medium text-center">
                            <p className="text-sm mb-1 text-gray-500">Rate Doctors to help us improve the website</p>

                            {/* Rating Section */}
                            <div className="w-full flex flex-col items-center">
                                {/* Increase the size of stars */}
                                <Rating
                                    value={value}
                                    onChange={(e) => { setValue(e.value); setIsEdit(true); }} // This updates the state value with the selected rating
                                    cancel={false}
                                    className="text-amber-400"
                                    stars={5}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                        fontSize: '2rem', // Increase the size of stars
                                    }}
                                />

                                {/* Conditionally render the buttons */}
                                {isEdit && (
                                    <div className="w-full flex items-center justify-center gap-2 mt-2">
                                        {/* Submit Button */}
                                        <button
                                            onClick={async () => {
                                                await handleRatingSubmit(value); // Pass the current value directly to handleRatingSubmit
                                            }}
                                            className="bg-[#5f6FFF] text-white text-sm font-light px-7 py-1.5 rounded-full cursor-pointer hover:scale-105 transition-all duration-300 ease-in-out"
                                        >
                                            Submit Rating
                                        </button>

                                        {/* Cancel Button */}
                                        <button
                                            onClick={() => { setIsEdit(false); checkUserRate(); }}
                                            className="bg-yellow-500 text-white text-sm font-light px-7 py-1.5 rounded-full cursor-pointer hover:scale-105 transition-all duration-300 ease-in-out"
                                        >
                                            Cancel Rating
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    }

                </div>

                {/*  */}
            </div>
            {/* BOOKING SLOTS */}
            <div className="sm:ml-72 sm:pl-4 mt-4 font-medium text-gray-700">
                <p>Booking slots</p>
                <div className="flex gap-3 items-center w-full overflow-x-scroll mt-4">
                    {
                        docSlots.length > 0 && docSlots.map((item, index) => {
                            return (
                                <div onClick={() => setSlotIndex(index)} className={`text-center py-6 min-w-16 rounded-full cursor-pointer ${slotIndex === index ? "bg-[#5f6FFF] text-white" : "border-gray-200 "}`} key={index}>
                                    <p>{item[0] && daysOfWeek[item[0].datetime.getDay()]}</p>
                                    <p>{item[0] && item[0].datetime.getDate()}</p>
                                </div>
                            )
                        })
                    }
                </div>
                <div className="flex items-center gap-3 w-full overflow-x-scroll mt-4">
                    {docSlots.length && docSlots[slotIndex].map((item, index) => (
                        <p onClick={() => setSlotTime(item.time)}
                            className={`text-sm font-light flex-shrink-0 px-5 py-2 rounded-full cursor-pointer ${item.time === slotTime ? 'bg-[#5f6FFF] text-white' : 'text-gray-400 border border-gray-300'}`}
                            key={index}
                        >
                            {/* Format time in 12-hour format with AM/PM */}
                            {item.datetime.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </p>
                    ))}
                </div>
                <button onClick={bookAppointment} className='bg-[#5f6FFF] text-white text-sm font-light px-14 py-3 rounded-full my-6 cursor-pointer hover:scale-105'>Book an appointment</button>
            </div>
            {/* LISTING DOCTORS */}
            <RelatedDoctors docId={docId} speciality={docInfo.speciality} />
        </div>
    )
}

export default Appoitment
