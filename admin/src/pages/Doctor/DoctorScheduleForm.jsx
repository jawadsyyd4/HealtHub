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

    // Fetch current doctor schedule
    const getDoctorAvailability = async () => {
        try {
            const { data } = await axios.get(backendUrl + "/api/doctor/schedule", { headers: { dToken } });
            if (data.success) {
                setDoctorAvailability(data.schedule);
                setAvailableDays(data.schedule.availableDays);
                setAvailableTimes(data.schedule.availableTimes || availableTimes);
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
        e.preventDefault()
        try {
            if (!doctorAvailability) {
                const { data } = await axios.post(backendUrl + '/api/doctor/schedule', {
                    availableDays,
                    availableTimes,
                }, { headers: { dToken } });
                if (data.success) {
                    toast.success(data.message);
                    getDoctorAvailability()
                } else {
                    toast.error(data.message)
                }
            } else {
                const { data } = await axios.post(backendUrl + '/api/doctor/update-schedule', {
                    availableDays,
                    availableTimes,
                }, { headers: { dToken } });
                if (data.success) {
                    toast.success(data.message);
                    getDoctorAvailability()
                } else {
                    toast.error(data.message)
                }
            }
        } catch (error) {
            console.error('Error submitting schedule', error);
            toast.error('Failed to save schedule');
        }
    };

    return (
        <div className="w-full p-6 bg-white rounded shadow-md  max-h-[90vh] min-h-[50vh] overflow-y-scroll">
            <h2 className="text-2xl font-semibold mb-4">
                {doctorAvailability ? 'Update Your Schedule' : 'Create Your Schedule'}
            </h2>
            <form onSubmit={handleSubmit}>
                {/* Days Selection */}
                <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">Select Available Days</h3>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                        <div key={day} className="flex items-center mb-2">
                            <input
                                type="checkbox"
                                id={day}
                                checked={availableDays.includes(day)}
                                onChange={() => handleDayChange(day)}
                                className="mr-2"
                            />
                            <label htmlFor={day}>{day}</label>
                        </div>
                    ))}
                </div>

                {/* Time Slot Inputs for Each Day (Make this section scrollable) */}
                <div className="mb-4 overflow-y-auto max-h-80"> {/* Scrollable container with a max height */}
                    <h3 className="text-lg font-medium mb-2">Set Time Slots</h3>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                        <div key={day} className="mb-3">
                            <h4 className="font-semibold">{day}</h4>
                            {availableDays.includes(day) && (
                                <div className="flex space-x-4">
                                    <input
                                        type="time"
                                        value={availableTimes[day].start}
                                        onChange={(e) => handleTimeChange(day, 'start', e.target.value)}
                                        className="border rounded p-2"
                                    />
                                    <input
                                        type="time"
                                        value={availableTimes[day].end}
                                        onChange={(e) => handleTimeChange(day, 'end', e.target.value)}
                                        className="border rounded p-2"
                                    />

                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <button
                    type="submit"
                    className="px-4 py-2 border-[#C0EB6A] border-1 text-[#C0EB6A] rounded hover:bg-[#C0EB6A] hover:text-white transition-all duration-300 cursor-pointer"
                >
                    {doctorAvailability ? 'Update Schedule' : 'Create Schedule'}
                </button>
            </form>
        </div>
    );
};

export default DoctorScheduleForm;
