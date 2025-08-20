import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from 'react-toastify';

const ConfirmAppointment = () => {
    const { appointmentId } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState("loading");

    useEffect(() => {
        const confirmAppointment = async () => {
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/api/user/confirm-appointment/${appointmentId}`
                );

                if (res.data.success) {
                    setStatus("success");
                    setTimeout(() => navigate("/my-appointments"), 2000); // frontend handles redirect
                } else {
                    setStatus("failed");
                    toast.error(res.data.message)
                }
            } catch (error) {
                console.error(error);
                toast.error(error.response?.data?.message || "Something went wrong");
                setStatus("error");
            }
        };

        confirmAppointment();
    }, [appointmentId, navigate]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
            <div className="bg-white shadow-lg rounded-2xl p-8 max-w-md w-full text-center">
                {status === "loading" && (
                    <div>
                        <div className="w-10 h-10 border-4 border-[#C0EB6A] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <h2 className="text-lg font-semibold">Confirming your appointment...</h2>
                    </div>
                )}

                {status === "success" && (
                    <div>
                        <h2 className="text-2xl font-bold text-[#C0EB6A] mb-2">Confirmed 🎉</h2>
                        <p className="text-gray-700">Your appointment has been confirmed.</p>
                        <p className="text-sm text-gray-500 mt-2">Redirecting you to My Appointments...</p>
                    </div>
                )}

                {status === "failed" && (
                    <div>
                        <h2 className="text-2xl font-bold text-red-500 mb-2">Failed ❌</h2>
                        <p className="text-gray-700">Appointment confirmation failed. Please try again.</p>
                    </div>
                )}

                {status === "error" && (
                    <div>
                        <h2 className="text-2xl font-bold text-red-500 mb-2">Error ⚠️</h2>
                        <p className="text-gray-700">Something went wrong. Please contact support.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConfirmAppointment;
