// eslint-disable-next-line no-unused-vars
import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { assets } from '../assets/assets';
import RelatedDoctors from '../components/RelatedDoctors';
import { toast } from 'react-toastify';
import axios from 'axios';
import AvgRating from '../components/AvgRating';
import LoadingComponent from '../components/LoadingComponent';
import { FaRegCalendarCheck } from 'react-icons/fa';

const Appoitment = () => {
    // Default values
    const defaultSlotIndex = -1;
    const defaultSlotIndex2 = -1;
    const { docId } = useParams();
    const { doctors, currencySymbol, backendUrl, token, getDoctorsData } = useContext(AppContext);
    const navigate = useNavigate()
    const [docSlots, setDocSlots] = useState(null);
    // Load pendingAppointment from localStorage once on component mount
    const [slotIndex, setSlotIndex] = useState(() => {
        try {
            const pending = JSON.parse(localStorage.getItem('pendingAppointment'));
            return pending && typeof pending.slotIndex === 'number' ? pending.slotIndex : defaultSlotIndex;
        } catch {
            return defaultSlotIndex;
        }
    });

    const [slotIndex2, setSlotIndex2] = useState(() => {
        try {
            const pending = JSON.parse(localStorage.getItem('pendingAppointment'));
            return pending && typeof pending.slotIndex2 === 'number' ? pending.slotIndex2 : defaultSlotIndex2;
        } catch {
            return defaultSlotIndex2;
        }
    });

    const [bookingDate, setBookingDate] = useState(false)
    const [bookingTime, setBookingTime] = useState(false)

    const [docInfo, setDocInfo] = useState(null)

    const [avgRating, setavgRating] = useState(0)

    const [loading, setLoading] = useState(false);


    const fetchDocInfo = async () => {
        const docInfo = await doctors.find(doc => doc._id === docId)
        setDocInfo(docInfo)
    }

    const getDocSlots = async () => {
        try {
            const { data } = await axios.get(backendUrl + `/api/user/availble-day/${docId}`)
            if (data.success) {
                setDocSlots(data.availableTimes)
                const startDate = new Date();
                const calculatedSlots = getAvailableTimes(data.availableTimes, startDate);

                setDocSlots(calculatedSlots);
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error);
            toast.error(error.message)
        }
    }

    const getAvailableTimes = (availableTimes, startDate) => {
        const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const thirtyMinutes = 30 * 60 * 1000;
        const result = {};

        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);

        let currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + 1);

        while (currentDate < endDate) {
            const dayOfWeek = daysOfWeek[currentDate.getDay()];
            const availableDay = availableTimes[dayOfWeek];

            if (availableDay) {
                const startTime = parseTime(availableDay.start);
                const endTime = parseTime(availableDay.end);

                const intervals = [];
                let currentIntervalTime = new Date(currentDate);
                currentIntervalTime.setHours(startTime.hours, startTime.minutes, 0, 0);

                const endIntervalTime = new Date(currentDate);
                endIntervalTime.setHours(endTime.hours, endTime.minutes, 0, 0);

                while (currentIntervalTime < endIntervalTime) {
                    const nextIntervalTime = new Date(currentIntervalTime.getTime() + thirtyMinutes);
                    if (nextIntervalTime <= endIntervalTime) {
                        intervals.push({
                            start: formatTime(currentIntervalTime),
                            end: formatTime(nextIntervalTime),
                        });
                    }
                    currentIntervalTime = nextIntervalTime;
                }

                const formattedDate = currentDate.toISOString().split("T")[0];
                result[formattedDate] = intervals;
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return result;
    };

    const parseTime = (timeString) => {
        const [hours, minutes] = timeString.split(":").map(Number);
        return { hours, minutes };
    };

    const formatTime = (date) => {
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${hours}:${minutes}`;
    };

    const bookAppointment = async (slotDate, slotTime, docId, slotIndex, slotIndex2) => {
        const token = localStorage.getItem("token");

        if (!token) {
            // Save all needed info in localStorage for post-login restore
            const appointmentData = {
                slotDate,
                slotTime,
                docId,
                slotIndex,
                slotIndex2,
            };
            console.log(appointmentData)
            localStorage.setItem("pendingAppointment", JSON.stringify(appointmentData));

            toast.warn("Login to book appointment");
            return navigate("/login");
        }

        setLoading(true); // Start loading
        try {
            function convert24To12Hour(time24) {
                let [hours, minutes] = time24.split(":").map(Number);
                const period = hours >= 12 ? "PM" : "AM";
                hours = hours % 12 || 12;
                return `${hours.toString().padStart(2, "0")}:${minutes
                    .toString()
                    .padStart(2, "0")} ${period}`;
            }

            const formattedTime = convert24To12Hour(slotTime);

            const { data } = await axios.post(
                backendUrl + "/api/user/book-appointment",
                {
                    docId,
                    slotDate,
                    slotTime: formattedTime,
                },
                {
                    headers: { token },
                }
            );

            if (data.success) {
                toast.success(data.message);
                getDoctorsData();
                navigate("/my-appointments");
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message);
        } finally {
            setLoading(false); // Stop loading
        }
    };


    const getDoctorAVGRating = async (docId) => {
        try {
            const { data } = await axios.get(backendUrl + `/api/doctor/rating/${docId}`)
            if (data.success) {
                setavgRating(data.averageRating)
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message)
        }
    }

    useEffect(() => {
        const storedData = localStorage.getItem('appointmentData');
        if (storedData && docSlots) {
            const { time, dayOfWeek } = JSON.parse(storedData);

            const entries = Object.entries(docSlots);
            let matchedDateIndex = -1;
            let matchedTimeIndex = -1;

            for (let i = 0; i < entries.length; i++) {
                const [date, slots] = entries[i];
                const jsDay = new Date(date).getDay(); // 0 = Sunday, 1 = Monday, etc.
                const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

                if (weekDays[jsDay] === dayOfWeek) {
                    matchedDateIndex = i;
                    matchedTimeIndex = slots.findIndex(slot => slot.start === time);

                    if (matchedTimeIndex !== -1) {
                        break;
                    }
                }
            }

            if (matchedDateIndex !== -1 && matchedTimeIndex !== -1) {
                const [matchedDate] = entries[matchedDateIndex];

                setSlotIndex(matchedDateIndex);
                setBookingDate(matchedDate);
                setSlotIndex2(matchedTimeIndex);
                setBookingTime(time);
            }

            localStorage.removeItem('appointmentData');
        }
    }, [docSlots]);

    useEffect(() => {
        fetchDocInfo();
        getDocSlots();
        getDoctorAVGRating(docId)
    }, [doctors, docId]);

    useEffect(() => {
        if (localStorage.getItem('pendingAppointment')) {
            localStorage.removeItem('pendingAppointment');
        }
        if (localStorage.getItem('restoredAppointment')) {
            localStorage.removeItem('restoredAppointment');
        }
    }, []);
    return docInfo && (
        <div>
            {/* DOCTOR DETAILS */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="">
                    <img className='bg-[#C0EB6A] w-full sm:max-w-72 rounded-lg' src={docInfo.image} alt="" />
                </div>
                {/* Section rate */}
                <div className="flex-1 border border-gray-400 rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px] sm:mt-0">
                    {/* DOC INFO name degree experience */}
                    <p className="flex items-center gap-2 text-2xl font-medium text-gray-900">
                        Dr. {docInfo.name} <img className="w-5" src={assets.verified_icon} alt="" />
                    </p>
                    <div className="flex items-center gap-2 text-sm mt-1 text-gray-600">
                        <p>
                            {docInfo.degree} - {docInfo.speciality.name}
                        </p>
                        <button className="py-0.5 px-2 border text-xs rounded-full">
                            {docInfo.experience}
                        </button>
                    </div>
                    <div className="">
                        {token && <AvgRating rating={avgRating} />}
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

                </div>

                {/*  */}
            </div>
            {/* BOOKING SLOTS */}
            <div>
                {/* ... (rest of your component code) */}
                {/* BOOKING SLOTS */}
                {
                    docSlots &&
                    <div className="sm:ml-72 sm:pl-4 mt-4 font-medium text-gray-700">
                        <p>Booking slots</p>
                        {docSlots ? (
                            <div>
                                <div className="flex gap-3 items-center w-full overflow-x-scroll mt-4">
                                    {Object.entries(docSlots).map(([date], index) => {
                                        const day = new Date(date).getDay();
                                        const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
                                        return (
                                            <div onClick={() => { setSlotIndex(index); setBookingDate(date) }} className={`border text-center py-6 min-w-16 rounded-full cursor-pointer ${slotIndex === index ? "bg-[#C0EB6A] text-white" : "border-gray-200 "}`} key={index}>
                                                <h3>{daysOfWeek[day]}</h3>
                                                <p>{date.split('-')[2]}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex items-center gap-3 w-full overflow-x-scroll mt-4">
                                    {docSlots && Object.entries(docSlots)[slotIndex] && Object.entries(docSlots)[slotIndex][1].map((time, index) => (
                                        <div key={index} onClick={() => { setSlotIndex2(index); setBookingTime(time.start) }} className={`text-sm font-light flex-shrink-0 px-5 py-2 rounded-full cursor-pointer ${slotIndex2 === index ? 'bg-[#C0EB6A] text-white' : 'text-gray-400 border border-gray-300'}`}>
                                            <ul>
                                                <li>
                                                    {time.start} - {time.end}
                                                </li>
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                                {/* <button onClick={() => bookAppointment(bookingDate, bookingTime)} disabled={loading} className='bg-[#C0EB6A] text-white text-sm font-light px-14 py-3 rounded-full my-6 cursor-pointer hover:scale-105'>{loading ? 'Booking...' : 'Book Appointment'}</button> */}
                                {loading && <LoadingComponent icon={<FaRegCalendarCheck className="text-[#C0EB6A] text-4xl mb-4 animate-bounce" />} message="Scheduling your appointment..." />}
                                <button
                                    onClick={() => bookAppointment(bookingDate, bookingTime, docId, slotIndex, slotIndex2)}
                                    className='bg-[#C0EB6A] text-white text-sm font-light px-14 py-3 rounded-full my-6 cursor-pointer hover:scale-105'
                                    disabled={loading}
                                >
                                    {loading ? 'Booking...' : 'Book Appointment'}
                                </button>
                            </div>
                        ) : (
                            <p>Loading available times...</p>
                        )}
                    </div>
                }
                {/* ... (rest of your component code) */}
            </div>
            {/* LISTING DOCTORS */}
            <RelatedDoctors docId={docId} speciality={docInfo.speciality.name} />
        </div>
    )
}

export default Appoitment
