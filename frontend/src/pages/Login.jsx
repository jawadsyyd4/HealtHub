// eslint-disable-next-line no-unused-vars
import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { FaUserPlus, FaSignInAlt } from 'react-icons/fa';

const Login = () => {
    const { backendUrl, setToken } = useContext(AppContext);
    const navigate = useNavigate();

    const [state, setState] = useState('Log in');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    // After successful login, check if there's a pending appointment to restore
    const handlePostLoginRedirect = () => {
        const pending = localStorage.getItem('pendingAppointment');
        if (pending) {
            const { docId } = JSON.parse(pending);

            // Redirect to appointment page for the specific doctor
            navigate(`/appointment/${docId}`);
        } else {
            // No pending appointment, just go to homepage or dashboard
            navigate('/');
        }
    };

    const onSubmitHandler = async (event) => {
        event.preventDefault();
        setLoading(true); // Start loading

        try {
            if (state === 'Sign Up') {
                const { data } = await axios.post(`${backendUrl}/api/user/register`, {
                    name,
                    password,
                    email,
                });

                if (data.success) {
                    toast.success(data.message);

                    // Save the email to localStorage for verification page
                    localStorage.setItem("pendingEmail", email);

                    window.location.href = "/";
                } else {
                    toast.error(data.message);
                }
            } else {
                const { data } = await axios.post(`${backendUrl}/api/user/login`, {
                    password,
                    email,
                });
                if (data.success) {
                    localStorage.setItem('token', data.token);
                    setToken(data.token);

                    // Redirect user based on saved pending appointment or homepage
                    handlePostLoginRedirect();
                } else {
                    toast.error(data.message);
                }
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false); // Stop loading
        }
    };

    // Navigate to the forgot password page
    const handleForgotPassword = () => {
        navigate('/forgot-password'); // Adjust path as needed
    };

    return (
        <form onSubmit={onSubmitHandler} className="min-h-[80vh] flex items-center">
            <div className="flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border-0 rounded-xl text-zinc-600 text-sm shadow-lg">
                <p className="text-2xl font-semibold">
                    {state === 'Sign Up' ? 'Create Account' : 'Login'}
                </p>
                <p>Please {state === 'Sign Up' ? 'Signup' : 'Login'} to book appointment</p>
                {state === 'Sign Up' && (
                    <div className="w-full">
                        <p>Full Name</p>
                        <input
                            className="border border-zinc-300 rounded w-full p-2 mt-1"
                            type="text"
                            onChange={(e) => setName(e.target.value)}
                            value={name}
                            required
                        />
                    </div>
                )}
                <div className="w-full">
                    <p>Email</p>
                    <input
                        className="border border-zinc-300 rounded w-full p-2 mt-1"
                        type="email"
                        onChange={(e) => setEmail(e.target.value)}
                        value={email}
                        required
                    />
                </div>
                <div className="w-full">
                    <p>Password</p>
                    <input
                        className="border border-zinc-300 rounded w-full p-2 mt-1"
                        type="password"
                        onChange={(e) => setPassword(e.target.value)}
                        value={password}
                        required
                    />
                    {/* Forgot Password Link */}
                    {state === 'Log in' && (
                        <p>
                            <span
                                className="text-[#C0EB6A] underline cursor-pointer float-end"
                                onClick={handleForgotPassword}
                            >
                                Forgot Password?
                            </span>
                        </p>
                    )}
                </div>

                <button
                    type="submit"
                    className="cursor-pointer bg-[#C0EB6A] text-white w-full py-2 rounded-md text-base flex items-center justify-center gap-2"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            {state === 'Sign Up' ? (
                                <FaUserPlus className="animate-bounce" />
                            ) : (
                                <FaSignInAlt className="animate-bounce" />
                            )}
                            {state === 'Sign Up' ? 'Creating Account...' : 'Logging in...'}
                        </>
                    ) : state === 'Sign Up' ? (
                        'Create Account'
                    ) : (
                        'Login'
                    )}
                </button>
                {state === 'Sign Up' ? (
                    <p>
                        Already have an account?{' '}
                        <span
                            className="text-[#C0EB6A] underline cursor-pointer"
                            onClick={() => setState('Log in')}
                        >
                            Login here
                        </span>
                    </p>
                ) : (
                    <p>
                        Create a new account?{' '}
                        <span
                            className="text-[#C0EB6A] underline cursor-pointer"
                            onClick={() => setState('Sign Up')}
                        >
                            click here
                        </span>
                    </p>
                )}
            </div>
        </form>
    );
};

export default Login;
