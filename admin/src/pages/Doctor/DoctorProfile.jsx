// eslint-disable-next-line no-unused-vars
import React from 'react';
import { useContext, useState, useEffect } from 'react';
import { DoctorContext } from '../../context/DoctorContext';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const DoctorProfile = () => {
    const { setProfileData, profileData, getProfileData, dToken, backendUrl } = useContext(DoctorContext);
    const { currency } = useContext(AppContext);

    const [isEdit, setIsEdit] = useState(false);
    const [showUnavailableTimes, setShowUnavailableTimes] = useState(false);
    const [unavailableTo, setUnavailableTo] = useState('');
    const [unavailableToError, setUnavailableToError] = useState('');

    const updateProfile = async () => {
        setUnavailableToError('');

        if (profileData.available === false) {
            if (!unavailableTo) {
                setUnavailableToError('Unavailable To is required');
                return;
            }
        }

        try {
            const { address, fees, available, unavailableFrom, unavailableTo } = profileData;

            const payload = {
                doctorId: profileData._id,
                address,
                fees,
                available,
            };

            if (!available) {
                payload.unavailableFrom = unavailableFrom;
                payload.unavailableTo = unavailableTo;
            }

            const { data } = await axios.post(
                `${backendUrl}/api/doctor/update-profile`,
                payload,
                { headers: { dToken } }
            );

            if (data.success) {
                toast.success(data.message);
                setIsEdit(false);
                setShowUnavailableTimes(false);
                setUnavailableTo('');
                getProfileData();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
            console.log(error);
        }
    };

    const handleAvailabilityChange = (e) => {
        const isAvailable = e.target.checked;
        setProfileData(prev => ({ ...prev, available: isAvailable }));

        if (isAvailable) {
            setShowUnavailableTimes(false);
            setUnavailableTo('');
            setUnavailableToError('');
            setProfileData(prev => ({
                ...prev,
                unavailableFrom: null,
                unavailableTo: null
            }));
        } else {
            setShowUnavailableTimes(true);
        }

        // Scroll to the availability section
        const el = document.getElementById('available');
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };


    useEffect(() => {
        if (dToken) {
            getProfileData();
        }
    }, [dToken]);

    return profileData && (
        <div>
            <div className="flex flex-col gap-4 m-5">

                <div className="">
                    <img loading="lazy" className='bg-[#C0EB6A]/80 w-full sm:max-w-64 rounded-lg' src={profileData.image || 'default-image.jpg'} alt="" />
                </div>

                <div className="flex-1 border border-stone-100 rounded-lg p-8 py-7 bg-white">
                    <p className='flex items-center gap-2 text-3xl font-medium text-gray-700'>{profileData.name}</p>
                    <div className='flex items-center gap-2 mt-1 text-gray-600'>
                        <p>{profileData.degree} - {profileData.speciality.name}</p>
                        <button className='py-0.5 px-2 border text-xs rounded-full'>{profileData.experience}</button>
                    </div>
                    <div className="">
                        <p className='flex items-center gap-1 text-sm font-medium text-neutral-800 mt-3'>About:</p>
                        <p className='text-sm text-gray-600 max-w-[700px] mt-1'>{profileData.about || 'No information available'}</p>
                    </div>
                    <p className='text-gray-600 font-medium mt-4'>
                        Appointment fee:
                        <span className='text-gray-800'>
                            {currency}
                            {isEdit
                                ? <input type="number"
                                    onChange={(e) => setProfileData(prev => ({ ...prev, fees: parseFloat(e.target.value) || prev.fees }))} // Handle invalid inputs
                                    value={profileData.fees || ''} />
                                : profileData.fees}
                        </span>
                    </p>
                    <div className="flex gap-2 py-2">
                        <p>Address:</p>
                        <p className='text-sm'>
                            {isEdit ? (
                                <input
                                    type="text"
                                    onChange={(e) => setProfileData(prev => ({
                                        ...prev,
                                        address: { ...prev.address, line1: e.target.value }
                                    }))}
                                    value={profileData?.address?.line1 || ''} // Prevent error if address or line1 is undefined
                                />
                            ) : (
                                profileData?.address?.line1 || '' // Handle case if address or line1 is undefined
                            )}
                            <br />
                            {isEdit ? (
                                <input
                                    type="text"
                                    onChange={(e) => setProfileData(prev => ({
                                        ...prev,
                                        address: { ...prev.address, line2: e.target.value }
                                    }))}
                                    value={profileData?.address?.line2 || ''} // Prevent error if address or line2 is undefined
                                />
                            ) : (
                                profileData?.address?.line2 || '' // Handle case if address or line2 is undefined
                            )}
                        </p>
                    </div>
                    <div className="flex gap-1 pt-2">
                        <input
                            id="available"
                            onChange={handleAvailabilityChange}
                            checked={profileData?.available || false} // Handle possible undefined
                            type="checkbox"
                        />
                        <label htmlFor="">Available</label>
                    </div>

                    {isEdit && showUnavailableTimes && (
                        <div className="flex flex-col gap-4 mt-4 p-4 rounded-lg border border-lime-300 bg-lime-50">
                            <div>
                                <label htmlFor="unavailableFrom" className="block text-sm font-medium text-gray-700 mb-1">
                                    Unavailable From:
                                </label>
                                <input
                                    type="datetime-local"
                                    id="unavailableFrom"
                                    className="w-full bg-gray-100 text-gray-700 border border-lime-300 rounded-md p-2 text-sm cursor-not-allowed"
                                    value={new Date().toISOString().slice(0, 16)}
                                    readOnly
                                />
                            </div>

                            <div>
                                <label htmlFor="unavailableTo" className="block text-sm font-medium text-gray-700 mb-1">
                                    Unavailable To:
                                </label>
                                <input
                                    type="datetime-local"
                                    id="unavailableTo"
                                    className={`w-full border rounded-md p-2 text-sm focus:outline-none ${unavailableToError
                                        ? 'border-red-500 bg-red-50'
                                        : 'border-lime-300 focus:ring-2 focus:ring-lime-300'
                                        }`}
                                    value={unavailableTo}
                                    onChange={(e) => {
                                        setUnavailableTo(e.target.value);
                                        setProfileData(prev => ({ ...prev, unavailableTo: e.target.value }));
                                        setUnavailableToError('');
                                    }}
                                    required
                                />
                                {unavailableToError && (
                                    <p className="text-red-500 text-xs mt-1">{unavailableToError}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {
                        isEdit
                            ? <button onClick={updateProfile} className='px-4 py-1 border border-[#C0EB6A] text-sm rounded-full mt-5 cursor-pointer hover:bg-[#C0EB6A] hover:text-white transition-all'>
                                Save
                            </button>
                            : <button onClick={() => setIsEdit(true)} className='px-4 py-1 border border-[#C0EB6A] text-sm rounded-full mt-5 cursor-pointer hover:bg-[#C0EB6A] hover:text-white transition-all'>
                                Edit
                            </button>
                    }
                </div>
            </div>
        </div>
    );
}

export default DoctorProfile;