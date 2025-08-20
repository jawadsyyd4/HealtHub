import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom"; // <- import useNavigate

const VerifyCodePage = () => {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate(); // <- initialize navigate

    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const email = localStorage.getItem("pendingEmail");
            if (!email) throw new Error("No email found. Please register first.");

            const { data } = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/user/verify-email`,
                { email, code }
            );

            if (data.success) {
                localStorage.setItem("token", data.token); // save JWT
                localStorage.removeItem("pendingEmail");
                toast.success(data.message);
                navigate("/"); // <- use navigate instead of window.location.href
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            toast.error(err.message || "Verification failed. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
                <h1 className="text-2xl font-bold text-center mb-4 text-[#C0EB6A]">
                    Verify Your Email
                </h1>
                <p className="text-center text-gray-600 mb-6">
                    Please enter the 6-digit code we sent to your email.
                </p>

                <form onSubmit={handleVerify} className="space-y-4">
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        maxLength={6}
                        placeholder="Enter verification code"
                        className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C0EB6A] text-center text-lg tracking-widest"
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#C0EB6A] text-black py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
                    >
                        {loading ? "Verifying..." : "Verify Code"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default VerifyCodePage;
