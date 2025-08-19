import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AdminContext } from "../../context/AdminContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export default function AppointmentForm() {
    const { patientId } = useParams();
    const { specialities, getAllSpecialities, aToken, backendUrl } = useContext(AdminContext);
    const [availableDays, setAvailableDays] = useState([]);
    const [timeRange, setTimeRange] = useState({ from: "", to: "" });
    const [doctorFees, setDoctorFees] = useState(0); // To store the selected doctor's fee

    const [formData, setFormData] = useState({
        doctorId: "",
        slotDate: "",
        slotTime: "",
        amount: "",
        availableDay: "",
    });

    const [speciality, setSpeciality] = useState("");
    const [doctors, setDoctors] = useState([]);
    const [loadingDoctors, setLoadingDoctors] = useState(false);
    const [unavailableTo, setUnavailableTo] = useState(false)
    const navigate = useNavigate();
    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const appointment = {
            ...formData,
            guestPatientId: patientId,
            doctorData: {},
            date: Date.now(),
            payment: false,
            isCompleted: false,
            cancelled: false,
            confirmed: false,
        };

        try {
            const response = await fetch("/api/appointments", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${aToken}`,
                },
                body: JSON.stringify(appointment),
            });

            if (response.ok) {
                alert("Appointment booked!");
            } else {
                alert("Failed to book appointment.");
            }
        } catch (error) {
            console.error("Error:", error);
        }
    };

    useEffect(() => {
        getAllSpecialities();
    }, [aToken]);

    useEffect(() => {
        const fetchDoctors = async () => {
            if (!speciality) return;

            try {
                setLoadingDoctors(true);
                const response = await axios.post(
                    `${backendUrl}/api/admin/doctors-by-specialty`,
                    { specialtyName: speciality },
                    { headers: { aToken } }
                );
                setDoctors(response.data.doctors || []);
            } catch (error) {
                console.error("Failed to fetch doctors:", error);
            } finally {
                setLoadingDoctors(false);
            }
        };

        fetchDoctors();
    }, [speciality, aToken]);

    useEffect(() => {
        const fetchAvailableDays = async () => {
            if (!formData.doctorId) return;

            try {
                const response = await axios.post(
                    `${backendUrl}/api/admin/doctor-availability`,
                    { doctorId: formData.doctorId },
                    { headers: { aToken } }
                );
                setAvailableDays(response.data.availableDays || []);
                setUnavailableTo(response.data.unavailableTo)
            } catch (error) {
                console.error("Error fetching available days:", error);
            }
        };

        fetchAvailableDays();
    }, [formData.doctorId, aToken]);

    useEffect(() => {
        const fetchTimeRange = async () => {
            if (!formData.doctorId || !formData.availableDay) return;

            try {
                const response = await axios.post(
                    `${backendUrl}/api/admin/doctor-day-time`,
                    { doctorId: formData.doctorId, day: formData.availableDay },
                    { headers: { aToken } }
                );

                if (response.data && response.data.start && response.data.end) {
                    setTimeRange({ from: response.data.start, to: response.data.end });
                }
            } catch (error) {
                console.error("Error fetching time range:", error);
                setTimeRange({ from: "", to: "" });
            }
        };

        fetchTimeRange();
    }, [formData.availableDay, formData.doctorId, aToken]);

    useEffect(() => {
        const selectedDoctor = doctors.find((doc) => doc._id === formData.doctorId);
        if (selectedDoctor) {
            setDoctorFees(selectedDoctor.fees || 0);
            setFormData((prev) => ({
                ...prev,
                amount: selectedDoctor.fees || 0,
            }));
        }
    }, [formData.doctorId, doctors]);

    function getNextAvailableDates(availableDayNames, count) {
        const daysMap = {
            Sunday: 0,
            Monday: 1,
            Tuesday: 2,
            Wednesday: 3,
            Thursday: 4,
            Friday: 5,
            Saturday: 6,
        };

        const availableIndexes = availableDayNames.map((day) => daysMap[day]);

        const results = [];
        let date = new Date();
        let tries = 0;

        while (results.length < count && tries < 30) {
            if (availableIndexes.includes(date.getDay())) {
                results.push(date.toISOString().split("T")[0]);
            }
            date.setDate(date.getDate() + 1);
            tries++;
        }

        return results;
    }

    function formatTimeTo12Hour(time) {
        let [hours, minutes] = time.split(":");

        // Convert to number to handle the 0-padding logic for hours and minutes
        hours = parseInt(hours, 10);
        minutes = parseInt(minutes, 10);

        // Determine AM or PM
        const period = hours >= 12 ? "PM" : "AM";

        // Convert to 12-hour format
        const formattedHours = hours % 12 || 12; // 12-hour format (e.g., 13 becomes 1)
        const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes; // Add 0 padding to minutes if less than 10

        // Ensure that the hours also have a leading zero if it's less than 10
        const formattedHoursWithZero = formattedHours < 10 ? `0${formattedHours}` : formattedHours;

        return `${formattedHoursWithZero}:${formattedMinutes} ${period}`;
    }

    const createAppointment = async (e) => {
        e.preventDefault();

        const selectedDoctor = doctors.find((doc) => doc._id === formData.doctorId);
        if (!selectedDoctor) {
            alert("Please select a valid doctor.");
            return;
        }

        const appointment = {
            day: formData.availableDay,
            doctorId: selectedDoctor._id,
            slotDate: formData.slotDate,
            slotTime: formatTimeTo12Hour(formData.slotTime),
            doctorData: {
                _id: selectedDoctor._id,
                name: selectedDoctor.name,
                email: selectedDoctor.email,
                image: selectedDoctor.image,
                degree: selectedDoctor.degree,
                experience: selectedDoctor.experience,
                about: selectedDoctor.about,
                fees: selectedDoctor.fees,
                address: selectedDoctor.address,
                guestPatientId: patientId,
            },
            amount: selectedDoctor.fees,
        };
        try {
            const response = await axios.post(
                `${backendUrl}/api/admin/create-appointment`,
                appointment,
                { headers: { aToken } }
            );

            if (response.data.success) {
                navigate('/all-appointments');
                toast.success(response.data.message);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error("Error while creating appointment:", error);
            toast.error("An error occurred while creating the appointment.");
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-lg shadow-md max-w-7xl mx-auto mt-10 space-y-4"
        >
            <h2 className="text-xl font-semibold">Book Appointment</h2>

            <select
                onChange={(e) => {
                    setSpeciality(e.target.value);
                    setFormData((prev) => ({ ...prev, doctorId: "" }));
                }}
                value={speciality}
                className="w-full cursor-pointer rounded-md outline-lime-300 bg-lime-100 p-1.5"
                required
            >
                <option value="" disabled>
                    Select a speciality
                </option>
                {specialities.map((item, index) => (
                    <option key={index} value={item.name} title={item.description}>
                        {item.name}
                    </option>
                ))}
            </select>

            {loadingDoctors ? (
                <p>Loading doctors...</p>
            ) : (
                <select
                    name="doctorId"
                    onChange={handleChange}
                    value={formData.doctorId}
                    className="w-full cursor-pointer rounded-md outline-lime-300 bg-lime-100 p-1.5"
                    required
                >
                    <option value="" disabled>
                        Select a doctor
                    </option>
                    {doctors.map((doc) => (
                        <option key={doc._id} value={doc._id}>
                            Dr. {doc.name}
                        </option>
                    ))}
                </select>
            )}

            {availableDays.length > 0 && (
                <select
                    className="w-full cursor-pointer rounded-md outline-lime-300 bg-lime-100 p-1.5"
                    name="availableDay"
                    value={formData.availableDay}
                    onChange={handleChange}
                    required
                >
                    <option value="" disabled>Select a day</option>
                    {availableDays.map((day, index) => (
                        <option key={index} value={day}>
                            {day}
                        </option>
                    ))}
                </select>
            )}
            {/* Show unavailableTo note after doctor selection but before date */}
            {unavailableTo && (
                <p className="text-sm text-red-600 mt-2">
                    Note: Unavailable until{" "}
                    {new Date(unavailableTo).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    })}
                </p>
            )}
            {formData.availableDay && (
                <select
                    name="slotDate"
                    value={formData.slotDate}
                    onChange={handleChange}
                    className="w-full cursor-pointer rounded-md outline-lime-300 bg-lime-100 p-1.5"
                    required
                >
                    <option value="" disabled>Select a date</option>
                    {getNextAvailableDates([formData.availableDay], 14).map((date) => (
                        <option key={date} value={date}>
                            {new Date(date).toDateString()}
                        </option>
                    ))}
                </select>
            )}

            {timeRange.from && timeRange.to && (
                <span className="block mb-1 text-sm text-gray-700">
                    Available time: {timeRange.from} to {timeRange.to}
                </span>
            )}

            <input
                type="time"
                name="slotTime"
                value={formData.slotTime}
                onChange={handleChange}
                className="w-full p-2 rounded border"
                required
                min={timeRange.from}
                max={timeRange.to}
                step="1800" // optional: allows selection in 1-minute steps
            />

            <input
                type="text"
                name="amount"
                value={doctorFees + "$"}
                onChange={handleChange}
                className="w-full p-2 rounded border"
                readOnly
            />

            <button
                onClick={createAppointment}
                type="submit"
                className="bg-[#C0EB6A] hover:scale-105 cursor-pointer text-white py-2 px-4 rounded transition flex items-center justify-center"
            >
                Confirm Booking
            </button>
        </form>
    );
}
