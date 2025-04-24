// eslint-disable-next-line no-unused-vars
import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom"; // ✅ import useNavigate
import { AdminContext } from "../../context/AdminContext";

const GuestPatientForm = () => {
    const { patientId } = useParams(); // Get patientId from URL
    const { backendUrl, aToken } = useContext(AdminContext); // Get backend URL and token from context
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        gender: "",
        dateOfBirth: "",
        notes: "",
    });
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate(); // Initialize useNavigate hook

    useEffect(() => {
        if (patientId) {
            axios.get(backendUrl + `/api/admin/guest-patients/${patientId}`, { headers: { aToken } })
                .then((res) => setFormData(res.data))
                .catch((err) => console.error("Failed to load patient", err));
        }
    }, [patientId, backendUrl, aToken]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (patientId) {
                await axios.post(backendUrl + `/api/admin/update-guest/${patientId}`, formData, { headers: { aToken } });
            } else {
                await axios.post(backendUrl + `/api/admin/add-guest`, formData, { headers: { aToken } });
            }

            // Redirect to /guest-patients after success
            navigate("/guest-patients");
        } catch (error) {
            console.error("Error saving guest patient", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full p-4 bg-gray-100">
            <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-md p-6 w-full">
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                    <h2 className="text-2xl font-bold text-gray-800">{patientId ? "Update" : "Add"} Guest Patient</h2>
                    <button
                        onClick={() => navigate('/guest-patients')}
                        className="cursor-pointer bg-[#C0EB6A] text-white font-medium px-4 py-2 rounded-lg transition duration-200"
                    >
                        Go Back
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <input
                            type="text"
                            name="name"
                            placeholder="Full Name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full border p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        <input
                            type="tel"
                            name="phone"
                            placeholder="Phone"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                            className="w-full border p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full border p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        <select
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            className="w-full border p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>

                        <input
                            type="date"
                            name="dateOfBirth"
                            value={formData.dateOfBirth}
                            onChange={handleChange}
                            className="w-full border p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        <textarea
                            name="notes"
                            placeholder="Notes"
                            value={formData.notes}
                            onChange={handleChange}
                            className="w-full border p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#C0EB6A] text-white py-3 rounded-md cursor-pointer transition duration-200 hover:bg-[#A0D74C]"
                        >
                            {loading ? "Saving..." : patientId ? "Update" : "Create"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GuestPatientForm;
