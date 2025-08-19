// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

const ResetPassword = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { backendUrl } = useContext(AppContext)
    // Get the token from the URL query parameters
    const urlParams = new URLSearchParams(location.search);
    const resetToken = urlParams.get('token');

    useEffect(() => {
        if (!resetToken) {
            navigate('/login');  // If no token is found, redirect to login page
        }
    }, [resetToken, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error("Passwords don't match!");
            return;
        }

        try {
            setIsLoading(true);
            const response = await axios.post(`${backendUrl}/api/user/reset-password`, {
                token: resetToken,
                password: newPassword,
            });

            if (response.data.success) {
                toast.success('Password reset successfully!');
                navigate('/login');  // Redirect to login page after successful reset
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error('Error resetting password', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col items-center min-h-[80vh] justify-center">
            <div className="flex flex-col gap-3 p-8 min-w-[340px] sm:min-w-96 border-0 rounded-xl text-zinc-600 text-sm shadow-lg">
                <p className="text-2xl font-semibold">Reset Your Password</p>
                <p>Please enter your new password below</p>

                <div className="w-full">
                    <p>New Password</p>
                    <input
                        className="border border-zinc-300 rounded w-full p-2 mt-1"
                        type="password"
                        onChange={(e) => setNewPassword(e.target.value)}
                        value={newPassword}
                        required
                    />
                </div>

                <div className="w-full">
                    <p>Confirm Password</p>
                    <input
                        className="border border-zinc-300 rounded w-full p-2 mt-1"
                        type="password"
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        value={confirmPassword}
                        required
                    />
                </div>

                <button
                    type="submit"
                    className={`cursor-pointer bg-[#C0EB6A] text-white w-full py-2 rounded-md text-base ${isLoading ? 'opacity-50' : ''}`}
                    disabled={isLoading}
                >
                    {isLoading ? 'Resetting...' : 'Reset Password'}
                </button>
            </div>
        </form>
    );
};

export default ResetPassword;
