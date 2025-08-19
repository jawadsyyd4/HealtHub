// eslint-disable-next-line no-unused-vars
import React, { useContext, useState } from 'react'
import { assets } from "../../assets/assets"
import { AdminContext } from "../../context/AdminContext"
import { toast } from 'react-toastify';
import axios from "axios"
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom'
import LoadingComponent from '../../components/LoadingComponent';
import { FaUserEdit } from 'react-icons/fa';
const AddDoctor = () => {

    const { backendUrl, aToken, specialities, getAllSpecialities, docInfo, setDocInfo } = useContext(AdminContext)

    const [docImg, setDocImg] = useState(false)
    const [name, setName] = useState(docInfo ? docInfo.name : '')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [experience, setExperience] = useState(docInfo ? docInfo.experience : '1 Year')
    const [speciality, setSpeciality] = useState(docInfo ? docInfo.speciality.name : 'General physician')
    const [fees, setFees] = useState(docInfo ? docInfo.fees : '')
    const [about, setAbout] = useState(docInfo ? docInfo.about : '')
    const [address1, setAddress1] = useState(docInfo ? docInfo.address.line1 : '')
    const [address2, setAddress2] = useState(docInfo ? docInfo.address.line2 : '')
    const [degree, setDegree] = useState(docInfo ? docInfo.degree : '')

    const [loading, setLoading] = useState(false);

    const navigate = useNavigate('')

    const onSubmitHandler = async (event) => {
        event.preventDefault()
        setLoading(true); // Start loading

        try {

            if (!docImg) {
                return toast.error("Image Not Selected")
            }

            const formData = new FormData()

            formData.append('image', docImg)
            formData.append('name', name)
            formData.append('email', email)
            formData.append('password', password)
            formData.append('experience', experience)
            formData.append('fees', Number(fees))
            formData.append('about', about)
            formData.append('speciality', speciality)
            formData.append('degree', degree)
            formData.append('address', JSON.stringify({
                line1: address1, line2: address2
            }))

            const { data } = await axios.post(`${backendUrl}/api/admin/add-doctor`, formData, { headers: { aToken } })

            if (data.success) {
                toast.success(data.message)
                setDocImg(false)
                setName('')
                setEmail('')
                setPassword('')
                setAbout('')
                setAddress1('')
                setAddress2('')
                setFees('')
                setExperience('1 Year')
                setSpeciality('General physician')
                setDegree('')
            } else { toast.error(data.message) }

        } catch (error) {
            toast.error(error.message)
            console.log(error);
        } finally {
            setLoading(false); // Stop loading
        }
    }

    const updateDocInfo = async (name, degree, speciality, about, fees, address1, address2, experience) => {
        setLoading(true); // Start loading

        try {

            const formData = new FormData()

            formData.append('image', docImg)
            formData.append('name', name)
            formData.append('experience', experience)
            formData.append('fees', Number(fees))
            formData.append('about', about)
            formData.append('speciality', speciality)
            formData.append('degree', degree)
            formData.append('address', JSON.stringify({
                line1: address1, line2: address2
            }))

            const { data } = await axios.post(`${backendUrl}/api/admin/update-doctor/${docInfo._id}`, formData, { headers: { aToken } })

            if (data.success) {
                toast.success(data.message)
                setDocInfo(false)
                setDocImg(false)
                setName('')
                setEmail('')
                setPassword('')
                setAbout('')
                setAddress1('')
                setAddress2('')
                setFees('')
                setExperience('1 Year')
                setSpeciality('General physician')
                setDegree('')
            } else { toast.error(data.message) }

        } catch (error) {
            toast.error(error.message)
            console.log(error);
        } finally {
            setLoading(false); // Stop loading
        }
    }

    useEffect(() => {
        if (aToken) {
            getAllSpecialities()
        }
    }, [aToken])


    return (
        <form onSubmit={onSubmitHandler} className='m-5 w-full'>
            <p className='mb-3 text-lg font-medium'>
                {docInfo ? 'Update doctor information' : 'Add Doctor'}
            </p>
            <div className="bg-white px-8 py-8 border rounded  w-full max-w-4xl max-h-[80vh] overflow-y-scroll ">
                <div className="flex items-center gap-4 mb-8 text-gray-500">
                    <label htmlFor="doc-img">
                        {
                            docInfo ?
                                <img className='w-16 bg-gray-100 rounded-full cursor-pointer' src={docImg ? URL.createObjectURL(docImg) : docInfo.image} loading='lazy' alt="" />
                                :
                                <img className='w-16 bg-gray-100 rounded-full cursor-pointer' src={docImg ? URL.createObjectURL(docImg) : assets.upload_area} loading='lazy' alt="" />
                        }
                    </label>
                    <input onChange={(e) => setDocImg(e.target.files[0])} type="file" id='doc-img' hidden />
                    <p>Upload doctor <br /> picture</p>
                </div>
                <div className="flex flex-col lg:flex-row items-start gap-10 text-gray-600">
                    <div className="w-full lg:flex-1 flex flex-col gap-4">
                        <div className="flex-1 flex flex-col gap-1">
                            <p>Doctor Name</p>
                            {
                                docInfo ?
                                    <input onChange={(e) => { setDocInfo({ ...docInfo, name: e.target.value }); setName(docInfo.name) }} value={docInfo.name || ''} className='border rounded px-3 py-2' type="text" placeholder='Name' required />
                                    :
                                    <input onChange={(e) => setName(e.target.value)} value={name} className='border rounded px-3 py-2' type="text" placeholder='Name' required />
                            }
                        </div>
                        {
                            !docInfo && <>
                                <div className="flex-1 flex flex-col gap-1">
                                    <p>Doctor Email</p>
                                    <input onChange={(e) => setEmail(e.target.value)} value={email} className='border rounded px-3 py-2' type="email" placeholder='Email' required />
                                </div>
                                <div className="flex-1 flex flex-col gap-1">
                                    <p>Doctor Password</p>
                                    <input onChange={(e) => setPassword(e.target.value)} value={password} className='border rounded px-3 py-2' type="password" placeholder='Password' required />
                                </div></>
                        }
                        <div className="flex-1 flex flex-col gap-1">
                            <p>Experience</p>
                            {
                                docInfo
                                    ?
                                    <select onChange={(e) => { setDocInfo({ ...docInfo, experience: e.target.value }); setExperience(docInfo.experience) }} value={docInfo.experience} className='border rounded px-3 py-2'>
                                        <option value="1 Year">1 Year</option>
                                        <option value="2 Year">2 Year</option>
                                        <option value="3 Year">3 Year</option>
                                        <option value="4 Year">4 Year</option>
                                        <option value="5 Year">5 Year</option>
                                        <option value="6 Year">6 Year</option>
                                        <option value="7 Year">7 Year</option>
                                        <option value="8 Year">8 Year</option>
                                        <option value="9 Year">9 Year</option>
                                        <option value="10 Year">10 Year</option>
                                    </select>
                                    :
                                    <select onChange={(e) => setExperience(e.target.value)} value={experience} className='border rounded px-3 py-2'>
                                        <option value="1 Year">1 Year</option>
                                        <option value="2 Year">2 Year</option>
                                        <option value="3 Year">3 Year</option>
                                        <option value="4 Year">4 Year</option>
                                        <option value="5 Year">5 Year</option>
                                        <option value="6 Year">6 Year</option>
                                        <option value="7 Year">7 Year</option>
                                        <option value="8 Year">8 Year</option>
                                        <option value="9 Year">9 Year</option>
                                        <option value="10 Year">10 Year</option>
                                    </select>
                            }
                        </div>

                        <div className="flex-1 flex flex-col gap-1">
                            <p>Fees</p>
                            {
                                docInfo ?
                                    <input onChange={(e) => { setDocInfo({ ...docInfo, fees: e.target.value }); setFees(docInfo.fees) }} value={docInfo.fees} className='border rounded px-3 py-2' type="number" placeholder='Fees' required />
                                    :
                                    <input onChange={(e) => setFees(e.target.value)} value={fees} className='border rounded px-3 py-2' type="number" placeholder='Fees' required />
                            }
                        </div>
                    </div>
                    <div className="w-full lg:flex-1 flex flex-col gap-4 ">
                        <div className="flex-1 flex flex-col gap-1 relative">
                            <p>Speciality</p>
                            {
                                docInfo ?
                                    <select onChange={(e) => setSpeciality(e.target.value)} value={speciality} className='border rounded px-3 py-2'>
                                        {
                                            specialities.map((item, index) => (
                                                <option key={index} value={item.name} selected={docInfo.speciality === item.name ? true : undefined}>{item.name}</option>
                                            ))
                                        }
                                    </select>
                                    :
                                    <select onChange={(e) => setSpeciality(e.target.value)} value={speciality} className='border rounded px-3 py-2'>
                                        {
                                            specialities.map((item, index) => (
                                                <option key={index} value={item.name}>{item.name}</option>
                                            ))
                                        }
                                    </select>
                            }
                            <span onClick={() => navigate('/add-speciality')} className='absolute end-0 text-[#C0EB6A] cursor-pointer underline' value="addNewSpeciality">Add new speciality</span>
                        </div>
                        <div className="flex-1 flex flex-col gap-1">
                            <p>Education</p>
                            {
                                docInfo ?
                                    <input onChange={(e) => { setDocInfo({ ...docInfo, degree: e.target.value }); setDegree(docInfo.degree) }} value={docInfo.degree} className='border rounded px-3 py-2' type="text" placeholder='Education' required />
                                    :
                                    <input onChange={(e) => setDegree(e.target.value)} value={degree} className='border rounded px-3 py-2' type="text" placeholder='Education' required />
                            }
                        </div>
                        <div className="flex-1 flex flex-col gap-1">
                            <p>Address</p>
                            {
                                docInfo ? (
                                    <>
                                        {/* Update address1 in docInfo.address */}
                                        <input
                                            onChange={(e) => {
                                                setDocInfo((prev) => ({
                                                    ...prev,
                                                    address: {
                                                        ...prev.address,
                                                        line1: e.target.value, // Update address.line1
                                                    },
                                                })); setAddress1(docInfo.address.line1)
                                            }
                                            }
                                            value={docInfo.address.line1}
                                            className="border rounded px-3 py-2"
                                            type="text"
                                            placeholder="Address 1"
                                            required
                                        />

                                        {/* Update address2 in docInfo.address */}
                                        <input
                                            onChange={(e) => {
                                                setDocInfo((prev) => ({
                                                    ...prev,
                                                    address: {
                                                        ...prev.address,
                                                        line2: e.target.value, // Update address.line2
                                                    },
                                                })); setAddress2(docInfo.address.line2)
                                            }
                                            }
                                            value={docInfo.address.line2}
                                            className="border rounded px-3 py-2"
                                            type="text"
                                            placeholder="Address 2"
                                            required
                                        />
                                    </>
                                ) : (
                                    <>
                                        {/* Use local state when docInfo is not available */}
                                        <input
                                            onChange={(e) => setAddress1(e.target.value)}
                                            value={address1}
                                            className="border rounded px-3 py-2"
                                            type="text"
                                            placeholder="Address 1"
                                            required
                                        />

                                        <input
                                            onChange={(e) => setAddress2(e.target.value)}
                                            value={address2}
                                            className="border rounded px-3 py-2"
                                            type="text"
                                            placeholder="Address 2"
                                            required
                                        />
                                    </>
                                )
                            }

                        </div>
                    </div>

                </div>
                <div className="">
                    <p className='mt-4 mb-2'>About Doctor</p>
                    {
                        docInfo ?
                            <textarea onChange={(e) => { setDocInfo({ ...docInfo, about: e.target.value }); setAbout(docInfo.about) }} value={docInfo.about} className='w-full px-4 pt-2 border rounded' placeholder='Write about doctor' rows={5} required />
                            : <textarea onChange={(e) => setAbout(e.target.value)} value={about} className='w-full px-4 pt-2 border rounded' placeholder='Write about doctor' rows={5} required />
                    }
                </div>
                {loading && (
                    <LoadingComponent
                        icon={<FaUserEdit className="text-[#C0EB6A] text-4xl mb-4 animate-bounce" />}
                        message={docInfo ? "Updating doctor info..." : "Adding new doctor..."}
                    />
                )}

                {docInfo ? (
                    <div className="flex gap-3">
                        <button
                            onClick={() => { updateDocInfo(docInfo.name, docInfo.degree, speciality, docInfo.about, docInfo.fees, address1, address2, docInfo.experience) }}
                            type="button"
                            className="bg-[#C0EB6A] px-10 py-3 mt-4 text-white rounded-full cursor-pointer"
                            disabled={loading}
                        >
                            Update doctor information
                        </button>
                        <button
                            onClick={() => { setDocInfo(false); setName(''); setEmail(''); setPassword(''); setAddress1(''); setAddress2(''); setDegree(''); setExperience(false); setFees(''); setAbout('') }}
                            type="button"
                            className="bg-red-500 px-10 py-3 mt-4 text-white rounded-full cursor-pointer hover:scale-105"
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <button
                        type="submit"
                        className="bg-[#C0EB6A] px-10 py-3 mt-4 text-white rounded-full cursor-pointer"
                        disabled={loading}
                    >
                        Add doctor
                    </button>
                )}

            </div>
        </form>
    )
}

export default AddDoctor
