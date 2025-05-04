import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const DoctorCalendar = () => {
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const { backendUrl } = useContext(AppContext);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSchedules = async () => {
            try {
                const response = await axios.get(`${backendUrl}/api/doctor/doctorSchedules`);
                setSchedules(response.data);
            } catch (error) {
                console.error("Error fetching schedules:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSchedules();
    }, [backendUrl]);

    const generateTimeSlots = () => {
        const times = [];
        let minTime = 24;
        let maxTime = 0;

        schedules.forEach(schedule => {
            schedule.availableDays.forEach(day => {
                const timeRange = schedule.availableTimes[day];
                if (timeRange) {
                    const startHour = parseInt(timeRange.start.split(":")[0]);
                    const endHour = parseInt(timeRange.end.split(":")[0]);
                    minTime = Math.min(minTime, startHour);
                    maxTime = Math.max(maxTime, endHour);
                }
            });
        });

        minTime = minTime === 24 ? 8 : minTime;
        maxTime = maxTime === 0 ? 18 : maxTime;

        for (let hour = minTime; hour < maxTime; hour++) {
            times.push(`${hour.toString().padStart(2, "0")}:00`);
            times.push(`${hour.toString().padStart(2, "0")}:30`);
        }

        return times;
    };


    const getDoctorsAtTime = (day, time) => {
        const doctors = [];
        const [hourStr, minuteStr] = time.split(":");
        const currentHour = parseInt(hourStr);
        const currentMinute = parseInt(minuteStr);
        const currentTotalMinutes = currentHour * 60 + currentMinute;

        for (let schedule of schedules) {
            if (schedule.availableDays.includes(day)) {
                const timeRange = schedule.availableTimes[day];
                if (timeRange) {
                    const [startHour, startMinute] = timeRange.start.split(":").map(Number);
                    const [endHour, endMinute] = timeRange.end.split(":").map(Number);
                    const startTotal = startHour * 60 + startMinute;
                    const endTotal = endHour * 60 + endMinute;

                    if (currentTotalMinutes >= startTotal && currentTotalMinutes < endTotal) {
                        doctors.push(schedule.doctor);
                    }
                }
            }
        }

        return doctors.reverse();
    };


    const normalizeDay = (day) => {
        const map = {
            Sunday: "SUN", Monday: "MON", Tuesday: "TUE",
            Wednesday: "WED", Thursday: "THU",
            Friday: "FRI", Saturday: "SAT"
        };
        return map[day] || "";
    };

    const handleSelect = (doctorId, day, time) => {
        const body = {
            dayOfWeek: normalizeDay(day),
            time: time
        };
        localStorage.setItem("appointmentData", JSON.stringify(body));
        navigate(`/appointment/${doctorId}`);
    };

    const availableDays = daysOfWeek.filter(day =>
        schedules.some(schedule => schedule.availableDays.includes(day))
    );

    if (loading) {
        return <div className="text-center p-5">Loading...</div>;
    }

    // Check if no doctor schedules are available
    if (schedules.length === 0 || availableDays.length === 0) {
        return (
            <div className="text-center p-5">
                <h2 className="text-xl text-red-600">No doctor schedules are available at the moment.</h2>
                <p>Please check back later or contact support for assistance.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto py-8" id="DoctorCalendar">
            <div className="text-center mb-6 text-gray-900">
                <h1 className="text-3xl font-medium text-center">Available Doctors & Scheduling</h1>
                <p className="sm:w-1/3 mx-auto text-sm text-center">
                    Easily view available doctors and book your appointment at a time that works best for you.
                </p>

            </div>

            <div className="max-h-[500px] overflow-y-auto rounded-xl">
                <table className="table-auto w-full min-w-[800px] border-collapse border border-gray-300 text-sm md:text-base">
                    <thead className="sticky top-0 bg-[#C0EB6A] text-white z-10">
                        <tr>
                            <th className="border border-gray-300 p-2">Time</th>
                            {availableDays.map(day => (
                                <th key={day} className="border border-gray-300 p-2">{day}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {generateTimeSlots().map(time => (
                            <tr key={time}>
                                <td className="border border-gray-300 p-2 font-semibold">{time}</td>
                                {availableDays.map(day => {
                                    const doctors = getDoctorsAtTime(day, time);
                                    return (
                                        <td
                                            key={day + time}
                                            className={`border border-gray-300 p-2 align-items-center justify-items-center ${doctors.length > 0 ? "bg-green-50" : "bg-red-50"}`}
                                        >
                                            <div className="flex flex-wrap justify-center items-start gap-1">
                                                {doctors.map((doctor, index) => (
                                                    <button
                                                        key={index}
                                                        onClick={() => handleSelect(doctor._id, day, time)}
                                                        className={`inline-block ${doctor.available ? "bg-green-300 text-green-900" : "bg-red-300 text-red-900"} text-xs md:text-sm font-medium px-2 py-1 rounded-lg text-center`}
                                                    >
                                                        <div className="cursor-pointer">
                                                            <span>{doctor.name}</span> <br />
                                                            <span className="text-xs text-gray-500">
                                                                {doctor.speciality ? doctor.speciality.name : "No specialty"}
                                                            </span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </div>
    );
};

export default DoctorCalendar;
