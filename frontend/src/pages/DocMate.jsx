// eslint-disable-next-line no-unused-vars
import React, { useContext, useState } from 'react';
import axios from 'axios';
import LoadingComponent from '../components/LoadingComponent'; // Adjust the path as needed
import { FaSearch } from 'react-icons/fa'; // Example icon
import { AppContext } from '../context/AppContext';

const DocMate = () => {
    const { backendUrl, token } = useContext(AppContext)
    const [message, setMessage] = useState('');
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const backgroundColor = '#C0EB6A';

    const handleSendMessage = async () => {
        setLoading(true);
        setResponse(null);

        try {
            const res = await axios.post(backendUrl + '/api/user/chat', { message }, { headers: { token } });
            setResponse(res.data);
        } catch (error) {
            console.error('Error sending message:', error);
            setResponse({ success: false, message: 'Failed to connect to the server.' });
        } finally {
            setLoading(false);
        }
    };

    return token && (
        <div
            className="min-h-screen py-6 flex flex-col justify-center sm:py-12"
            style={{ backgroundColor }}
        >
            <div className="relative py-3 sm:max-w-xl sm:mx-auto">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-lime-400 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
                <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
                    <div className="max-w-lg mx-auto"> {/* Increased max-w-md to max-w-lg */}
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-700">Find Your Doctor</h1>
                        </div>
                        <div className="divide-y divide-gray-200">
                            <div className="py-10 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7"> {/* Increased py-8 to py-10 */}
                                <div className="relative">
                                    <input
                                        type="text"
                                        className="peer w-full rounded-md outline-lime-300 bg-lime-100 focus:ring-lime-300 focus:border-lime-300 p-1.5 placeholder:text-xs"
                                        placeholder="e.g., Gynecologist on monday at 09:00"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                    />
                                </div>
                                <div className="relative">
                                    <button
                                        type="button"
                                        className="w-full rounded-md bg-[#C0EB6A] cursor-pointer px-4 py-2 text-white font-semibold hover:bg-[#C0EB6A] focus:outline-none focus:ring-2 focus:ring-lime-300 focus:ring-offset-2 flex items-center justify-center"
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

                                {response && (
                                    <div className="mt-8 pt-8 border-t border-gray-200"> {/* Increased mt-6 to mt-8 and pt-6 to pt-8 */}
                                        {response.success ? (
                                            <div>
                                                <p className="font-semibold text-green-500">{response.message}</p>
                                                {response.doctor && (
                                                    <div className="mt-2">
                                                        <p>Doctor Name: <span className="font-semibold">{response.doctor.name}</span></p>
                                                        <button
                                                            className="mt-4 rounded-md bg-[#C0EB6A] cursor-pointer px-4 py-2 text-white font-semibold hover:scale-105"
                                                            onClick={() => {
                                                                window.location.href = `http://localhost:5173/appointment/${response.doctor._id}`;
                                                            }}
                                                        >
                                                            Book Appointment
                                                        </button>
                                                        {/* You can display more doctor details here if needed */}
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
            </div>
        </div>
    );
};

export default DocMate;