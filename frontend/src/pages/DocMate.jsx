// eslint-disable-next-line no-unused-vars
import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import LoadingComponent from '../components/LoadingComponent';
import { FaSearch } from 'react-icons/fa';
import { AppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

const DocMate = () => {
    const { backendUrl, token, specialities, loadSpecialities } = useContext(AppContext);
    const [speciality, setSpeciality] = useState('');
    const [day, setDay] = useState('');
    const [time, setTime] = useState('');
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const backgroundColor = '#C0EB6A';
    const navigate = useNavigate();

    const handleSendMessage = async () => {
        setLoading(true);
        setResponse(null);

        const finalMessage = `I am looking for a ${speciality} on ${day} at ${time}`;

        try {
            const res = await axios.post(
                `${backendUrl}/api/user/chat`,
                { message: finalMessage },
                { headers: { token } }
            );
            setResponse(res.data);
        } catch (error) {
            console.error('Error sending message:', error);
            setResponse({ success: false, message: 'Failed to connect to the server.' });
        } finally {
            setLoading(false);
        }
    };

    const normalizeDay = (input) => {
        const map = {
            sunday: 'SUN',
            sun: 'SUN',
            monday: 'MON',
            mon: 'MON',
            tuesday: 'TUE',
            tue: 'TUE',
            tues: 'TUE',
            wednesday: 'WED',
            wed: 'WED',
            weds: 'WED',
            thursday: 'THU',
            thu: 'THU',
            thurs: 'THU',
            friday: 'FRI',
            fri: 'FRI',
            saturday: 'SAT',
            sat: 'SAT',
        };

        if (!input) return null;
        return map[input.toLowerCase().trim()] || null;
    };

    useEffect(() => {
        loadSpecialities();
    }, [token]);

    return token ? (
        <div className="min-h-screen py-6 flex flex-col justify-center sm:py-12" style={{ backgroundColor }}>
            <div className="relative py-3 sm:max-w-xl sm:mx-auto">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-lime-400 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
                <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
                    <div className="max-w-lg mx-auto">
                        <h1 className="text-2xl font-semibold text-gray-700 mb-4">Find Your Doctor</h1>

                        {/* Structured Input Only */}
                        <div className="space-y-4 text-gray-700">
                            <select
                                onChange={(e) => setSpeciality(e.target.value)}
                                value={speciality}
                                className="w-full cursor-pointer rounded-md outline-lime-300 bg-lime-100 p-1.5"
                            >
                                <option value="" disabled>Select a speciality</option>
                                {specialities.map((item, index) => (
                                    <option key={index} value={item.name} title={item.description}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                            <select
                                onChange={(e) => setDay(e.target.value)}
                                value={day}
                                className="w-full cursor-pointer rounded-md outline-lime-300 bg-lime-100 p-1.5"
                            >
                                <option value="" disabled>Select a day</option>
                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((dayOption) => (
                                    <option key={dayOption} value={dayOption}>
                                        {dayOption}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="time"
                                className="w-full rounded-md outline-lime-300 bg-lime-100 p-1.5"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                step="1800"  // 1800 seconds = 30 minutes
                            />


                            <button
                                type="button"
                                className="w-full rounded-md bg-[#C0EB6A] cursor-pointer px-4 py-2 text-white font-semibold hover:bg-[#b3df5f] focus:outline-none focus:ring-2 focus:ring-lime-300 focus:ring-offset-2 flex items-center justify-center"
                                onClick={handleSendMessage}
                                disabled={loading}
                            >
                                {loading ? (
                                    <LoadingComponent message="Searching..." icon={<FaSearch className="animate-spin mr-2" />} />
                                ) : (
                                    <>
                                        <FaSearch className="mr-2" />
                                        Find Doctor
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Response */}
                        {response && (
                            <div className="mt-10 pt-6 border-t border-gray-200">
                                {response.success ? (
                                    <div>
                                        <p className="font-semibold text-green-500">{response.message}</p>
                                        {response.doctors && response.doctors.length > 0 && (
                                            <div className="mt-4 space-y-4">
                                                {response.doctors.map((doctor) => (
                                                    <div
                                                        key={doctor._id}
                                                        className="p-4 border border-lime-200 rounded-md bg-lime-50 shadow-sm"
                                                    >
                                                        <p className="text-lg font-semibold text-gray-800">
                                                            Dr. {doctor.name}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            Average Rating: <span className="font-medium">{doctor.avgRate.toFixed(1)}</span>
                                                        </p>
                                                        <button
                                                            className="mt-3 rounded-md bg-[#C0EB6A] px-4 py-2 text-white font-semibold hover:scale-105 transition-transform cursor-pointer"
                                                            onClick={async () => {
                                                                if (!day || !time) {
                                                                    alert("Please select both day and time.");
                                                                    return;
                                                                }

                                                                // Round time to nearest 30 mins
                                                                const [hoursStr, minutesStr] = time.split(':');
                                                                let hours = parseInt(hoursStr, 10);
                                                                let minutes = parseInt(minutesStr, 10);

                                                                if (minutes < 15) {
                                                                    minutes = 0;
                                                                } else if (minutes < 45) {
                                                                    minutes = 30;
                                                                } else {
                                                                    minutes = 0;
                                                                    hours += 1;
                                                                }

                                                                const roundedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

                                                                const body = {
                                                                    dayOfWeek: normalizeDay(day),
                                                                    time: roundedTime,
                                                                };

                                                                try {
                                                                    await fetch('http://localhost:5173/api/appointments', {
                                                                        method: 'POST',
                                                                        headers: {
                                                                            'Content-Type': 'application/json',
                                                                        },
                                                                        body: JSON.stringify(body),
                                                                    });

                                                                    localStorage.setItem('appointmentData', JSON.stringify(body));
                                                                    window.location.href = `http://localhost:5173/appointment/${doctor._id}`;
                                                                } catch (error) {
                                                                    console.error('Failed to book appointment:', error);
                                                                }
                                                            }}
                                                        >
                                                            Book Appointment
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="font-semibold text-red-500">{response.message}</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    ) : navigate('/');
};

export default DocMate;
