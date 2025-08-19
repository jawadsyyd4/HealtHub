// eslint-disable-next-line no-unused-vars
import React, { useContext, useState } from 'react'
import { AppContext } from '../context/AppContext';
import { assets } from '../assets/assets';
import axios from 'axios';
import { toast } from 'react-toastify';
import LoadingComponent from '../components/LoadingComponent';
import { FaUserEdit } from 'react-icons/fa';

const MyProfile = () => {

    const { userData, setUserData, token, backendUrl, loadUserProfileData } = useContext(AppContext)


    const [isEdit, setIsEdit] = useState(false)

    const [image, setImage] = useState(false)

    const [loading, setLoading] = useState(false);

    const updateUserProfileData = async () => {
        setLoading(true); // Start loading

        try {

            const formData = new FormData()
            formData.append('name', userData.name)
            formData.append('phone', userData.phone)
            formData.append('address', JSON.stringify(userData.address))
            formData.append('gender', userData.gender)
            formData.append('dob', userData.dob)

            image && formData.append('image', image)

            const { data } = await axios.post(`${backendUrl}/api/user/update-profile`, formData, { headers: { token } })

            if (data.success) {
                toast.success(data.message)
                await loadUserProfileData()
                setIsEdit(false)
                setImage(false)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error);
            toast.error(error.message)
        } finally {
            setLoading(false); // Stop loading
        }
    }

    return userData && (
        <div className='max-w-lg flex flex-col gap-2 text-sm'>

            {
                isEdit
                    ? <label htmlFor="image">
                        <div className="inline-block relative cursor-pointer">
                            <img loading="lazy" className='w-36 rounded opacity-75' src={image ? URL.createObjectURL(image) : userData.image} alt="" />
                            <img loading="lazy" className='w-10 absolute bottom-12 right-12' src={image ? '' : assets.upload_icon} alt="" />
                        </div>
                        <input onChange={(e) => setImage(e.target.files[0])} type="file" id="image" hidden />
                    </label>
                    : <img className='w-36 rounded' src={userData.image} alt="" loading='eager' />

            }

            {
                isEdit ? <input className='bg-gray-50 text-3xl font-medium max-w-60 mt-4' type="text" value={userData.name}
                    onChange={(e) => { setUserData(prev => ({ ...prev, name: e.target.value })) }} />
                    : <p className='font-medium text-3xl text-neutral-800 mt-4'>{userData.name}</p>
            }
            <hr className='bg-zinc-400 h-[1px] border-none' />
            <div className="">
                <p className='text-neutral-500 underline mt-3'>CONTACT INFORMATION</p>
                <div className="grid grid-cols-2 gap-y-2.5 mt-3 text-neutral-700">
                    <p className='font-medium'>Email:</p>
                    <p className='text-blue-500'>{userData.email}</p>
                    <p className='font-medium'>Phone:</p>
                    {
                        isEdit ? (
                            <input
                                className='bg-gray-100 max-w-52'
                                type="tel"
                                inputMode="numeric"
                                value={userData.phone}
                                onChange={(e) => {
                                    const input = e.target.value.replace(/^(\+961(3|70|71|76|78|79|81|82)[0-9]{6})$/, '');
                                    // Allow only 8-digit Lebanese numbers starting with valid prefixes
                                    const validLebanesePrefixes = ['03', '70', '71', '76', '78', '79', '81', '82'];
                                    // eslint-disable-next-line no-unused-vars
                                    const isValid = validLebanesePrefixes.some(prefix =>
                                        input.startsWith(prefix) && input.length === 8
                                    );
                                    if (input.length <= 8) {
                                        setUserData(prev => ({ ...prev, phone: input }));
                                    }
                                }}
                                placeholder="e.g. 70123456"
                            />
                        ) : (
                            <p className='text-blue-400'>{userData.phone}</p>
                        )
                    }
                    <p className='font-medium'>Address:</p>
                    {
                        isEdit ? <p>
                            <input className='bg-gray-50' onChange={(e) => setUserData((prev) => ({ ...prev, address: { ...prev.address, line1: e.target.value } }))}
                                type="text" value={userData.address.line1} />
                            <br />
                            <input className='bg-gray-50' onChange={(e) => setUserData((prev) => ({ ...prev, address: { ...prev.address, line2: e.target.value } }))}
                                type="text" value={userData.address.line2} />
                        </p>
                            : <p className='text-gray-500'>
                                {userData.address.line1}
                                <br />
                                {userData.address.line2}
                            </p>
                    }
                </div>

            </div>
            <div className="">
                <p className='text-neutral-500 underline mt-3'>BASIC INFORMATION</p>
                <div className="grid grid-cols-2 gap-y-2.5 mt-3 text-neutral-700">
                    <p className='font-medium'>Gender:</p>
                    {
                        isEdit ? (
                            <select
                                className='max-w-20 bg-gray-100'
                                onChange={(e) => setUserData(prev => ({ ...prev, gender: e.target.value }))}
                                value={userData.gender}
                                required
                            >
                                <option value="" disabled>Select your gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        ) : (
                            <p className='text-gray-400'>{userData.gender}</p>
                        )
                    }

                    <p className='font-medium'>Birthday:</p>
                    {
                        isEdit ? <input className='max-w-28 bg-gray-100' type="date" onChange={(e) => setUserData((prev) => ({ ...prev, dob: e.target.value }))} value={userData.dob} required />
                            : <p className='text-gray-400'>{userData.dob}</p>
                    }
                </div>
            </div>
            <div className="mt-10">
                {loading && (
                    <LoadingComponent
                        icon={<FaUserEdit className="text-[#C0EB6A] text-4xl mb-4 animate-bounce" />}
                        message="Updating your profile..."
                    />
                )}

                {isEdit ? (
                    <button
                        className="cursor-pointer border border-[#C0EB6A] px-8 py-2 rounded-full hover:text-white hover:bg-[#C0EB6A] transition-all"
                        onClick={updateUserProfileData}
                        disabled={loading}
                    >
                        Save Information
                    </button>
                ) : (
                    <button
                        className="cursor-pointer border border-[#C0EB6A] px-8 py-2 rounded-full hover:text-white hover:bg-[#C0EB6A] transition-all"
                        onClick={() => setIsEdit(true)}
                        disabled={loading}
                    >
                        Edit
                    </button>
                )}

            </div>
        </div>
    )
}

export default MyProfile
