// eslint-disable-next-line no-unused-vars
import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { AdminContext } from "../../context/AdminContext";

const GuestPatientTable = () => {
    const [patients, setPatients] = useState([]);
    const [filteredPatients, setFilteredPatients] = useState([]); // State for filtered patients
    const [searchQuery, setSearchQuery] = useState(""); // State for search query
    const navigate = useNavigate();
    const { backendUrl, aToken } = useContext(AdminContext);

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const res = await axios.get(`${backendUrl}/api/admin/guest-patients`, {
                    headers: { aToken },
                });
                setPatients(res.data); // Store all patients
                setFilteredPatients(res.data); // Initially show all patients
            } catch (error) {
                console.error("Error loading guest patients", error);
            }
        };

        fetchPatients();
    }, [backendUrl, aToken]); // Run once when component mounts

    // Function to handle search query changes and filter patients by name or phone
    const handleSearchChange = (e) => {
        const query = e.target.value.toLowerCase(); // Convert to lowercase for case-insensitive search
        setSearchQuery(query);

        // Filter patients based on the search query, checking both name and phone
        const filtered = patients.filter((patient) =>
            patient.name.toLowerCase().includes(query) || patient.phone.includes(query)
        );
        setFilteredPatients(filtered);
    };

    return (
        <div className="w-full p-4 bg-gray-100">
            <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-md p-6 w-full">
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                    <h2 className="text-2xl font-bold text-gray-800">Guest Patients</h2>

                    {/* Search input */}
                    <input
                        type="text"
                        placeholder="Search by name or phone"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="border-0 p-2 rounded-md w-64 transition duration-200 bg-lime-100 focus:outline-none focus:ring-2 focus:ring-[#C0EB6A] shadow-sm"
                    />

                    <button
                        onClick={() => navigate('/add-patient')}
                        className="cursor-pointer bg-[#C0EB6A] text-white font-medium px-4 py-2 rounded-lg transition duration-200"
                    >
                        Add Patient
                    </button>
                </div>

                {/* Table Section */}
                <div className="overflow-x-auto">
                    <table className="w-full min-w-max border-collapse">
                        <thead>
                            <tr className="bg-gray-100 text-center text-sm font-semibold text-gray-700">
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Phone</th>
                                <th className="px-4 py-3 hidden sm:table-cell">Email</th>
                                <th className="px-4 py-3 hidden sm:table-cell">Gender</th>
                                <th className="px-4 py-3 hidden sm:table-cell">DOB</th>
                                <th className="px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-gray-800 text-center">
                            {filteredPatients.length > 0 ? (
                                filteredPatients.map((patient) => (
                                    <tr
                                        key={patient._id}
                                        className="border-t hover:bg-gray-50 transition duration-150"
                                    >
                                        <td className="px-4 py-3">{patient.name}</td>
                                        <td className="px-4 py-3">{patient.phone}</td>
                                        <td className="px-4 py-3 hidden sm:table-cell">{patient.email || "-"}</td>
                                        <td className="px-4 py-3 hidden sm:table-cell capitalize">{patient.gender || "-"}</td>
                                        <td className="px-4 py-3 hidden sm:table-cell">{patient.dateOfBirth || "-"}</td>
                                        <td className="px-4 py-3 space-x-2">
                                            <Link
                                                to={`/add-patient/${patient._id}`}
                                                className="inline-block bg-[#C0EB6A] hover:bg-[#A7D76A] text-white px-3 py-1 rounded transition duration-200"
                                            >
                                                Edit
                                            </Link>
                                            <Link to={`/patients/${patient._id}/book-appointment`}>
                                                <button className="bg-white hover:bg-[#C0EB6A] text-[#C0EB6A] px-3 py-1 rounded transition duration-200 hover:text-white cursor-pointer">
                                                    Book Appointment
                                                </button>
                                            </Link>

                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center py-6 text-gray-500">
                                        No guest patients found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default GuestPatientTable;
