// eslint-disable-next-line no-unused-vars
import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import LoadingComponent from '../components/LoadingComponent';

const DocMate = () => {
    const { backendUrl, token, specialities, loadSpecialities } = useContext(AppContext);
    const [speciality, setSpeciality] = useState([]);
    const [day, setDay] = useState([]);
    const [time, setTime] = useState([]);
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showSpecialties, setShowSpecialties] = useState(true);
    const [showDays, setShowDays] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        loadSpecialities();
    }, [token]);

    const toggleCheckbox = (value, state, setState) => {
        setState(state.includes(value) ? state.filter((v) => v !== value) : [...state, value]);
    };

    const formatTime12Hour = (timeStr) => {
        const [hour, minute] = timeStr.split(':');
        const h = parseInt(hour, 10);
        const suffix = h >= 12 ? 'PM' : 'AM';
        const hr12 = ((h + 11) % 12) + 1;
        return `${String(hr12).padStart(2, '0')}:${minute} ${suffix}`;
    };

    useEffect(() => {
        const fetchDoctors = async () => {
            if (speciality.length === 0 && day.length === 0 && time.length === 0) {
                setResponse(null);
                return;
            }

            setLoading(true);
            setResponse(null);

            try {
                const res = await axios.post(
                    `${backendUrl}/api/user/chat`,
                    { specialties: speciality, days: day, times: time },
                    { headers: { token } }
                );
                setResponse(res.data);
            } catch (err) {
                console.error('Fetch error:', err);
                setResponse({ success: false, message: 'Something went wrong. Please try again.' });
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(fetchDoctors, 500);
        return () => clearTimeout(debounce);
    }, [speciality, day, time, backendUrl, token]);

    if (!token) return navigate('/');

    return (
        <div className="min-h-screen bg-[#F8FDF0] py-10 px-4 rounded-lg">
            <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
                {/* Filters Sidebar */}
                <aside className="bg-white border border-[#C0EB6A] rounded-2xl p-6 shadow-lg">
                    <h2 className="text-2xl font-semibold mb-6 text-[#C0EB6A]">Filter Doctors</h2>

                    {/* Specialties Filter */}
                    <div className="mb-6">
                        <button onClick={() => setShowSpecialties(!showSpecialties)} className="flex justify-between w-full text-lg font-medium text-gray-700">
                            <span>Specialties</span>
                            <span>{showSpecialties ? '▾' : '▸'}</span>
                        </button>
                        {showSpecialties && (
                            <div className="mt-4 space-y-2">
                                {specialities.map((s) => (
                                    <label key={s.name} className="flex items-start gap-2 bg-[#F3FAE1] p-2 rounded-md border border-[#C0EB6A]">
                                        <input
                                            type="checkbox"
                                            checked={speciality.includes(s.name)}
                                            onChange={() => toggleCheckbox(s.name, speciality, setSpeciality)}
                                            className="mt-1 accent-[#C0EB6A]"
                                        />
                                        <div>
                                            <span className="font-medium text-gray-800">{s.name}</span>
                                            {s.description && <p className="text-xs text-gray-500">{s.description}</p>}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Days Filter */}
                    <div className="mb-6">
                        <button onClick={() => setShowDays(!showDays)} className="flex justify-between w-full text-lg font-medium text-gray-700">
                            <span>Days</span>
                            <span>{showDays ? '▾' : '▸'}</span>
                        </button>
                        {showDays && (
                            <div className="mt-4 grid grid-cols-2 gap-2">
                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d) => (
                                    <label key={d} className="flex items-center gap-2 text-gray-700">
                                        <input
                                            type="checkbox"
                                            checked={day.includes(d)}
                                            onChange={() => toggleCheckbox(d, day, setDay)}
                                            className="accent-[#C0EB6A]"
                                        />
                                        {d}
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Time Filter */}
                    <div>
                        <label className="block text-lg font-medium text-gray-700 mb-2">Time</label>
                        <input
                            type="time"
                            className="w-full p-2 border border-[#C0EB6A] bg-[#F3FAE1] rounded-md outline-none focus:ring-2 focus:ring-[#C0EB6A]"
                            step="1800"
                            onChange={(e) => {
                                const formatted = formatTime12Hour(e.target.value);
                                setTime((prev) => (prev.includes(formatted) ? prev : [...prev, formatted]));
                            }}
                        />
                        <div className="flex flex-wrap gap-2 mt-3">
                            {time.map((t) => (
                                <span
                                    key={t}
                                    className="bg-[#C0EB6A] text-sm px-3 py-1 rounded-full text-white cursor-pointer hover:bg-[#add75e]"
                                    onClick={() => setTime((prev) => prev.filter((x) => x !== t))}
                                >
                                    {t} ✕
                                </span>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Results */}
                <main className="md:col-span-2">
                    <h1 className="text-3xl font-bold mb-6 text-[#C0EB6A]">Matching Doctors</h1>

                    {loading && <LoadingComponent message="Searching doctors..." />}

                    {!loading && response?.success && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {response.doctors.map((doctor) => (
                                <div
                                    key={doctor._id}
                                    className="p-6 bg-white border border-[#C0EB6A] rounded-2xl shadow-md hover:shadow-lg transition"
                                >
                                    <img
                                        src={doctor.iamge}
                                        alt={doctor.name}
                                        loading="lazy"
                                        className="w-24 h-24 mx-auto mb-4 rounded-full object-cover border border-gray-300"
                                    />
                                    <div className="text-center">
                                        <p className="text-lg font-semibold text-gray-800">Dr. {doctor.name}</p>
                                        <p className="text-sm text-gray-600">Specialty: {doctor.speciality}</p>
                                        <p className="text-sm text-gray-600">Rating: {doctor.avgRate.toFixed(1)}</p>
                                    </div>
                                    <button
                                        className="cursor-pointer mt-4 w-full py-2 bg-[#C0EB6A] text-white font-semibold rounded-md hover:bg-[#add75e]"
                                        onClick={() => navigate(`/appointment/${doctor._id}`)}
                                    >
                                        View Schedule
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {!loading && response && !response.success && (
                        <p className="text-red-500 font-medium mt-4">{response.message}</p>
                    )}
                </main>
            </div>
        </div>
    );
};

export default DocMate;
