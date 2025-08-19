// eslint-disable-next-line no-unused-vars
import React, { useContext, useEffect, useState } from 'react';
import { DoctorContext } from '../../context/DoctorContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const DoctorScheduleForm = () => {
    const { backendUrl, dToken } = useContext(DoctorContext);
    const [doctorAvailability, setDoctorAvailability] = useState(null);
    const [availableDays, setAvailableDays] = useState([]);
    const [availableTimes, setAvailableTimes] = useState({});

    const getDoctorAvailability = async () => {
        try {
            const { data } = await axios.get(`${backendUrl}/api/doctor/schedule`, {
                headers: { dToken },
            });
            if (data.success) {
                setDoctorAvailability(data.schedule);
                setAvailableDays(data.schedule.availableDays);
                setAvailableTimes(data.schedule.availableTimes || {});
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message);
        }
    };

    useEffect(() => {
        if (dToken) {
            getDoctorAvailability();
        }
    }, [dToken]);

    const handleDayChange = (day) => {
        setAvailableDays((prevDays) => {
            const updatedDays = prevDays.includes(day)
                ? prevDays.filter((d) => d !== day)
                : [...prevDays, day];

            setAvailableTimes((prevTimes) => {
                if (updatedDays.includes(day)) {
                    return {
                        ...prevTimes,
                        [day]: { start: '', end: '' },
                    };
                } else {
                    const { [day]: removed, ...rest } = prevTimes;
                    return rest;
                }
            });

            return updatedDays;
        });
    };

    const handleTimeChange = (day, type, value) => {
        setAvailableTimes((prevTimes) => ({
            ...prevTimes,
            [day]: {
                ...prevTimes[day],
                [type]: value,
            },
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const endpoint = doctorAvailability
                ? `/api/doctor/update-schedule`
                : `/api/doctor/schedule`;

            const { data } = await axios.post(
                `${backendUrl}+${endpoint}`,
                { availableDays, availableTimes },
                { headers: { dToken } }
            );

            if (data.success) {
                toast.success(data.message);
                getDoctorAvailability();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error('Error submitting schedule', error);
            toast.error('Failed to save schedule');
        }
    };

    return (
        <div className="w-full p-6 bg-white rounded-xl shadow-md max-h-[90vh] min-h-[50vh] overflow-y-scroll">
            <h2 className="text-2xl font-semibold mb-6 text-gray-700">
                {doctorAvailability ? 'Update Your Schedule' : 'Create Your Schedule'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Days Selection */}
                <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-3">Select Available Days</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                            <label key={day} className="flex items-center gap-2 text-gray-600">
                                <input
                                    type="checkbox"
                                    checked={availableDays.includes(day)}
                                    onChange={() => handleDayChange(day)}
                                    className="accent-[#C0EB6A]"
                                />
                                {day}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Time Slots */}
                <div className="overflow-y-auto max-h-80 border rounded-md p-4 border-gray-200">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">Set Time Slots</h3>
                    {availableDays.length === 0 && (
                        <p className="text-sm text-gray-400 italic">Select a day to configure its time slots</p>
                    )}
                    {availableDays.map((day) => (
                        <div key={day} className="mb-4">
                            <h4 className="font-semibold text-gray-700 mb-2">{day}</h4>
                            <div className="flex flex-wrap gap-4">
                                <input
                                    type="time"
                                    value={availableTimes[day]?.start || ''}
                                    onChange={(e) => handleTimeChange(day, 'start', e.target.value)}
                                    className="border p-2 rounded-md w-[120px]"
                                />
                                <input
                                    type="time"
                                    value={availableTimes[day]?.end || ''}
                                    onChange={(e) => handleTimeChange(day, 'end', e.target.value)}
                                    className="border p-2 rounded-md w-[120px]"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Submit Button */}
                <div>
                    <button
                        type="submit"
                        className="px-6 py-3 bg-[#C0EB6A] text-white font-medium rounded-md hover:bg-[#a9d758] transition duration-300"
                    >
                        {doctorAvailability ? 'Update Schedule' : 'Create Schedule'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default DoctorScheduleForm;
