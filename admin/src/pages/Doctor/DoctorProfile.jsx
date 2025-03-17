// eslint-disable-next-line no-unused-vars
import React from 'react'
import { useContext } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { useEffect } from 'react'
import { AppContext } from '../../context/AppContext'
import { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'

const DoctorProfile = () => {

    const { setProfileData, profileData, getProfileData, dToken, backendUrl } = useContext(DoctorContext)

    const { currency } = useContext(AppContext)


    const [isEdit, setIsEdit] = useState(false)


    const updateProfile = async () => {
        try {
            const { address, fees, available } = profileData;

            const { data } = await axios.post(
                backendUrl + "/api/doctor/update-profile",
                { doctorId: profileData._id, address, fees, available }, // Pass the data separately
                { headers: { dToken } }
            );

            if (data.success) {
                toast.success(data.message);
                setIsEdit(false);
                getProfileData();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
            console.log(error);
        }
    };


    useEffect(() => {
        if (dToken) {
            getProfileData()
        }
    }, [dToken])

    return profileData && (
        <div>
            <div className="flex flex-col gap-4 m-5">

                <div className="">
                    <img className='bg-[#C0EB6A]/80 w-full sm:max-w-64 rounded-lg' src={profileData.image || 'default-image.jpg'} alt="" />
                </div>

                <div className="flex-1 border border-stone-100 rounded-lg p-8 py-7 bg-white">
                    <p className='flex items-center gap-2 text-3xl font-medium text-gray-700'>{profileData.name}</p>
                    <div className='flex items-center gap-2 mt-1 text-gray-600'>
                        <p>{profileData.degree} - {profileData.speciality}</p>
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
                            onChange={() => isEdit && setProfileData(prev => ({ ...prev, available: !prev.available }))}
                            checked={profileData?.available || false} // Handle possible undefined
                            type="checkbox"
                        />
                        <label htmlFor="">Available</label>
                    </div>
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

export default DoctorProfile
