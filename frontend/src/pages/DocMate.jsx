// eslint-disable-next-line no-unused-vars
import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import LoadingComponent from '../components/LoadingComponent';
import { FaSearch } from 'react-icons/fa';
import { AppContext } from '../context/AppContext';

const DocMate = () => {
    const { backendUrl, token, specialities, loadSpecialities } = useContext(AppContext);
    const [useStructuredInput, setUseStructuredInput] = useState(false);
    const [speciality, setSpeciality] = useState('');
    const [day, setDay] = useState('');
    const [time, setTime] = useState('');
    const [message, setMessage] = useState('');
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const backgroundColor = '#C0EB6A';

    const handleSendMessage = async () => {
        setLoading(true);
        setResponse(null);

        // If structured input is used, compose the message
        const finalMessage = useStructuredInput
            ? `I am looking for a ${speciality} on ${day} at ${time}`
            : message;

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

    useEffect(() => { loadSpecialities() }, [token])

    return token && (
        <div
            className="min-h-screen py-6 flex flex-col justify-center sm:py-12"
            style={{ backgroundColor }}
        >
            <div className="relative py-3 sm:max-w-xl sm:mx-auto">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-lime-400 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
                <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
                    <div className="max-w-lg mx-auto">
                        <h1 className="text-2xl font-semibold text-gray-700 mb-4">Find Your Doctor</h1>

                        {/* Toggle between modes */}
                        <div className="flex justify-center gap-4 mb-6">
                            <button
                                className={`px-4 py-2 rounded-md font-medium ${!useStructuredInput ? 'bg-lime-400 text-white' : 'bg-gray-200'}`}
                                onClick={() => setUseStructuredInput(false)}
                            >
                                Text Query
                            </button>
                            <button
                                className={`px-4 py-2 rounded-md font-medium ${useStructuredInput ? 'bg-lime-400 text-white' : 'bg-gray-200'}`}
                                onClick={() => setUseStructuredInput(true)}
                            >
                                Structured Input
                            </button>
                        </div>

                        {/* Inputs */}
                        <div className="space-y-4 text-gray-700">
                            {!useStructuredInput ? (
                                <input
                                    type="text"
                                    className="w-full rounded-md outline-lime-300 bg-lime-100 focus:ring-lime-300 focus:border-lime-300 p-1.5 placeholder:text-sm"
                                    placeholder="e.g., Gynecologist on Monday at 09:00"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                />
                            ) : (
                                <>
                                    <select
                                        onChange={(e) => setSpeciality(e.target.value)}
                                        value={speciality}
                                        className="w-full rounded-md outline-lime-300 bg-lime-100 p-1.5"
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
                                        className="w-full rounded-md outline-lime-300 bg-lime-100 p-1.5"
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
                                    />
                                </>
                            )}

                            {/* Button */}
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
                                                            onClick={() => {
                                                                window.location.href = `http://localhost:5173/appointment/${doctor._id}`;
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
    );
};

export default DocMate;
