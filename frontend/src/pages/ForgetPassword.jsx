// eslint-disable-next-line no-unused-vars
import React, { useContext, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AppContext } from '../context/AppContext';
import LoadingComponent from '../components/LoadingComponent'; // import it

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false); // track loading state

    const { backendUrl } = useContext(AppContext)

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); // start loading
        try {
            const { data } = await axios.post(`${backendUrl}/api/user/forget-password`, { email });
            if (data.success) {
                toast.success(data.message);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Error requesting password reset', error);
        } finally {
            setLoading(false); // stop loading
        }
    };

    return (
        <>
            {loading && (
                <LoadingComponent
                    message="Sending reset link..."
                    icon={<span className="text-3xl">⏳</span>}
                />
            )}

            <form onSubmit={handleSubmit} className="flex flex-col items-center min-h-[80vh] justify-center">
                <div className="flex flex-col gap-3 p-8 min-w-[340px] sm:min-w-96 border-0 rounded-xl text-zinc-600 text-sm shadow-lg">
                    <p className="text-2xl font-semibold">Forgot Password</p>
                    <p>Please enter your email to receive a password reset link</p>
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
                    <button
                        type="submit"
                        className="cursor-pointer bg-[#C0EB6A] text-white w-full py-2 rounded-md text-base"
                        disabled={loading} // disable while loading
                    >
                        {loading ? 'Processing...' : 'Send Reset Link'}
                    </button>
                </div>
            </form>
        </>
    );
};

export default ForgotPassword;
