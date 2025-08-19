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

    const [bookingDate, setBookingDate] = useState(false)
    const [bookingTime, setBookingTime] = useState(false)

    const [docInfo, setDocInfo] = useState(null)

    const [avgRating, setavgRating] = useState(0)

    const [loading, setLoading] = useState(false);

    const [unavailableTo, setUnavailableTo] = useState(null)
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

    const fetchDocInfo = async () => {
        const docInfo = await doctors.find(doc => doc._id === docId)
        setDocInfo(docInfo)
    }

    const getDocSlots = async () => {
        try {
            const { data } = await axios.get(`${backendUrl}/api/user/availble-day/${docId}`);
            if (!data.success) return toast.error(data.message);

            const startDate = data.unavailableTo ? new Date(data.unavailableTo) : new Date();
            const calculatedSlots = getAvailableTimes(data.availableTimes, startDate);
            setDocSlots(calculatedSlots);
            setUnavailableTo(data.unavailableTo);
        } catch (error) {
            console.error(error);
            toast.error(error.message);
        }
    };

    const getAvailableTimes = (availableTimes, startDate) => {
        const dayMap = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const result = {};
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 21);

        for (
            let current = new Date(startDate.getTime() + 86400000); // start from next day
            current < endDate;
            current.setDate(current.getDate() + 1)
        ) {
            const dayName = dayMap[current.getDay()];
            const availableDay = availableTimes[dayName];
            if (!availableDay) continue;

            const start = parseTime(availableDay.start);
            const end = parseTime(availableDay.end);

            const intervals = [];
            let slot = new Date(current.setHours(start.hours, start.minutes, 0, 0));
            const slotEnd = new Date(current.setHours(end.hours, end.minutes, 0, 0));

            while (slot < slotEnd) {
                const next = new Date(slot.getTime() + 1800000); // 30 min
                if (next <= slotEnd) {
                    intervals.push({
                        start: formatTime(slot),
                        end: formatTime(next),
                    });
                }
                slot = next;
            }

            result[current.toISOString().split("T")[0]] = intervals;
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
    }, [docSlots, docId, doctors, docInfo]);

    useEffect(() => {
        if (docId) {
            fetchDocInfo();
            getDocSlots();
            getDoctorAVGRating(docId)
        }
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
                    <img loading="lazy" className='bg-[#C0EB6A] w-full sm:max-w-72 rounded-lg' src={docInfo.image} alt="" />
                </div>
                {/* Section rate */}
                <div className="flex-1 border border-gray-400 rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px] sm:mt-0">
                    {/* DOC INFO name degree experience */}
                    <p className="flex items-center gap-2 text-2xl font-medium text-gray-900">
                        Dr. {docInfo.name} <img loading="lazy" className="w-5" src={assets.verified_icon} alt="" />
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
                            About <img loading="lazy" src={assets.info_icon} alt="" />
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
            {
                docSlots &&
                <div className="sm:ml-72 sm:pl-4 mt-4 font-medium text-gray-700">
                    {!docSlots ? (
                        <p className="text-red-500 font-semibold">Doctor doesn’t have a schedule right now.</p>

                    ) : (
                        <p>Booking slots</p>
                    )}
                    {unavailableTo && (
                        <p className="text-xs text-red-500 mb-1">
                            Doctor unavailable until{" "}
                            {new Date(unavailableTo).toLocaleDateString("en-US", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </p>
                    )}
                    {docSlots ? (

                        <div className="mt-8 space-y-8">
                            {/* Date Selector */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-3">Select a Date</h3>
                                <div className="overflow-x-auto">
                                    <div className="flex sm:grid sm:grid-cols-4 md:grid-cols-6 gap-4 w-max sm:w-full">
                                        {Object.entries(docSlots).map(([date], index) => {
                                            const day = new Date(date).getDay();
                                            const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
                                            return (
                                                <button
                                                    key={index}
                                                    onClick={() => {
                                                        setSlotIndex(index);
                                                        setBookingDate(date);
                                                    }}
                                                    className={`min-w-[80px] cursor-pointer border rounded-xl py-4 text-center transition-all ${slotIndex === index
                                                        ? 'bg-[#C0EB6A] text-white border-[#C0EB6A] shadow-md'
                                                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <p className="text-sm font-medium">{daysOfWeek[day]}</p>
                                                    <p className="text-xl font-semibold">{date.split('-')[2]}</p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Time Slot Selector */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-3">Select a Time</h3>
                                <div className="overflow-x-auto">
                                    <div className="flex gap-3 w-max sm:w-full">
                                        {docSlots &&
                                            Object.entries(docSlots)[slotIndex] &&
                                            Object.entries(docSlots)[slotIndex][1].map((time, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => {
                                                        setSlotIndex2(index);
                                                        setBookingTime(time.start);
                                                    }}
                                                    className={`px-5 py-2 cursor-pointer rounded-lg border transition-all text-sm font-medium ${slotIndex2 === index
                                                        ? 'bg-[#C0EB6A] text-white border-[#C0EB6A] shadow'
                                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    {time.start} - {time.end}
                                                </button>
                                            ))}
                                    </div>
                                </div>
                            </div>


                            {/* Booking Button */}
                            <div className="text-center">
                                {loading ? (
                                    <LoadingComponent
                                        icon={<FaRegCalendarCheck className="text-[#C0EB6A] text-4xl mb-4 animate-bounce" />}
                                        message="Scheduling your appointment..."
                                    />
                                ) : (
                                    <button
                                        onClick={() => bookAppointment(bookingDate, bookingTime, docId, slotIndex, slotIndex2)}
                                        className="bg-[#C0EB6A] cursor-pointer text-white font-medium text-sm px-12 py-3 rounded-full shadow hover:shadow-lg hover:scale-[1.02] transition-transform"
                                    >
                                        Book Appointment
                                    </button>
                                )}
                            </div>
                        </div>


                    ) : (
                        <p className="text-red-500 font-semibold">Doctor doesn’t have a schedule right now.</p>
                    )}
                </div>
            }
            {!docSlots && (
                <div className="flex flex-col items-center justify-center text-center mt-10">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">No Schedule Available</h2>
                    <p className="text-red-500 font-medium">Doctor doesn’t have a schedule right now.</p>
                </div>
            )}
            {/* LISTING DOCTORS */}
            <RelatedDoctors docId={docId} speciality={docInfo.speciality.name} />
        </div>
    )
}

export default Appoitment
