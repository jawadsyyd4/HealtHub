// eslint-disable-next-line no-unused-vars
import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import LoadingComponent from '../components/LoadingComponent';
import { AppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

const DocMate = () => {
    const { backendUrl, token, specialities, loadSpecialities } = useContext(AppContext);
    const [speciality, setSpeciality] = useState([]);
    const [day, setDay] = useState([]);
    const [time, setTime] = useState([]);
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [showSpecialties, setShowSpecialties] = useState(true);
    const [showDays, setShowDays] = useState(false);

    useEffect(() => {
        loadSpecialities();
    }, [token]);

    const toggleCheckbox = (value, state, setState) => {
        if (state.includes(value)) {
            setState(state.filter((v) => v !== value));
        } else {
            setState([...state, value]);
        }
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
            } catch (error) {
                console.error('Error fetching doctors:', error);
                setResponse({ success: false, message: 'Something went wrong. Please try again.' });
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(fetchDoctors, 500);
        return () => clearTimeout(debounce);
    }, [speciality, day, time, backendUrl, token]);

    return token ? (
        <div className="min-h-screen bg-[#C0EB6A] py-10 px-4">
            <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
                {/* Filters Sidebar */}
                <aside className="bg-white rounded-3xl p-6 shadow-md md:sticky md:top-10 h-fit">
                    <h2 className="text-xl font-bold mb-4 text-gray-700">Filters</h2>

                    {/* Specialties */}
                    <div className="mb-6">
                        <button onClick={() => setShowSpecialties(!showSpecialties)} className="w-full flex justify-between font-semibold text-gray-700">
                            <span>Specialties</span>
                            <span>{showSpecialties ? '▾' : '▸'}</span>
                        </button>
                        {showSpecialties && (
                            <div className="mt-3 grid grid-cols-1 gap-2">
                                {specialities.map((s) => (
                                    <label key={s.name} className="flex items-start gap-2 bg-lime-50 p-2 rounded-md border border-lime-200">
                                        <input
                                            type="checkbox"
                                            checked={speciality.includes(s.name)}
                                            onChange={() => toggleCheckbox(s.name, speciality, setSpeciality)}
                                            className="mt-1"
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

                    {/* Days */}
                    <div className="mb-6">
                        <button onClick={() => setShowDays(!showDays)} className="w-full flex justify-between font-semibold text-gray-700">
                            <span>Days</span>
                            <span>{showDays ? '▾' : '▸'}</span>
                        </button>
                        {showDays && (
                            <div className="mt-3 grid grid-cols-2 gap-2">
                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d) => (
                                    <label key={d} className="flex items-center gap-2">
                                        <input type="checkbox" checked={day.includes(d)} onChange={() => toggleCheckbox(d, day, setDay)} />
                                        {d}
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Time */}
                    <div>
                        <label className="font-semibold text-gray-700 block mb-2">Available Times</label>
                        <input
                            type="time"
                            className="w-full p-2 rounded-md bg-lime-100 outline-lime-300"
                            step="1800"
                            onChange={(e) => {
                                const formatted = formatTime12Hour(e.target.value);
                                setTime((prev) => (prev.includes(formatted) ? prev : [...prev, formatted]));
                            }}
                        />
                        <div className="flex flex-wrap gap-2 mt-2">
                            {time.map((t) => (
                                <span key={t} className="bg-lime-200 text-sm px-2 py-1 rounded-md cursor-pointer" onClick={() => setTime((prev) => prev.filter((x) => x !== t))}>
                                    {t} ✕
                                </span>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Results Section */}
                <main className="md:col-span-2">
                    <h1 className="text-2xl font-bold mb-6 text-gray-800">Results</h1>

                    {loading && <LoadingComponent message="Searching doctors..." />}
                    {!loading && response?.success && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
                            {response.doctors.map((doctor) => (
                                <div key={doctor._id} className="aspect-square p-4 bg-white border border-lime-200 rounded-2xl shadow hover:shadow-lg transition-all flex flex-col items-center justify-between text-center">
                                    <img src={doctor.iamge} alt={doctor.name} className="w-24 h-24 rounded-full object-cover border border-gray-300 mb-3" />
                                    <div>
                                        <p className="text-lg font-bold text-gray-800 mb-1">Dr. {doctor.name}</p>
                                        <p className="text-sm text-gray-600 mb-1">Specialty: {doctor.speciality}</p>
                                        <p className="text-sm text-gray-600">Rating: {doctor.avgRate.toFixed(1)}</p>
                                    </div>
                                    <button
                                        className="mt-3 px-4 py-2 bg-[#C0EB6A] text-white font-semibold rounded-md"
                                        onClick={() => window.location.href = `http://localhost:5173/appointment/${doctor._id}`}
                                    >
                                        View Schedule
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {!loading && response && !response.success && (
                        <p className="text-red-500 mt-4 font-semibold">{response.message}</p>
                    )}
                </main>
            </div>
        </div>

    ) : (
        navigate('/')
    );
};

export default DocMate;
