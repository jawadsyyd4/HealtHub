// eslint-disable-next-line no-unused-vars
import React, { useContext, useEffect } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { assets } from '../../assets/assets'
import { Link } from 'react-router-dom' // <-- Import Link

const DoctorsList = () => {

    const { doctors, aToken, getAllDoctors, changeAvailability, getDoctorData, deleteDoctor, setDocInfo } = useContext(AdminContext)

    useEffect(() => {
        if (aToken) {
            getAllDoctors()
        }
        setDocInfo(false)
    }, [aToken])

    return (
        <div className='m-5 max-h-[90vh] overflow-y-scroll'>
            <div className='flex justify-between items-center'>
                <h1 className='text-lg font-medium'>All Doctors</h1>
                <Link
                    to="http://localhost:5174/add-doctor"
                    className='bg-[#C0EB6A] text-white font-medium px-4 py-2 rounded-md hover:bg-[#b3df5f] transition'
                >
                    Add Doctor
                </Link>
            </div>

            <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 pt-5 gap-y-6">
                {
                    doctors.map((item, index) => (
                        <div key={index} className="border border-indigo-200 rounded-xl max-w-56 overflow-hidden group relative">
                            <div className="hidden flex-col group-hover:block">
                                <button onClick={() => { getDoctorData(item._id) }} className='absolute end-0 top-0 me-1 mt-1 rounded-xl bg-[#C0EB6A] text-white p-0.5 group-hover:bg-white group-hover:text-[#C0EB6A] cursor-pointer'>
                                    <img className='w-7' src={assets.edit_icon} alt="" />
                                </button>
                                <button onClick={() => { deleteDoctor(item._id) }} className='absolute end-0 top-10 me-1 mt-1 rounded-xl bg-[#C0EB6A] text-white p-0.5 group-hover:bg-white group-hover:text-[#C0EB6A] cursor-pointer'>
                                    <img className='w-7' src={assets.delete_icon} alt="" />
                                </button>
                            </div>
                            <img className='bg-indigo-50 group-hover:bg-[#C0EB6A] transition-all duration-500' src={item.image} alt="" />
                            <div className="p-4">
                                <p className='text-neutral-800 text-lg font-medium'>{item.name}</p>
                                <p className='text-zinc-600 text-sm'>{item.speciality.name}</p>
                                <div className="mt-2 flex items-center gap-1 text-sm">
                                    <input onChange={() => changeAvailability(item._id)} type="checkbox" checked={item.available} />
                                    <p>available</p>
                                </div>
                            </div>
                        </div>
                    ))
                }
            </div>
        </div>
    )
}

export default DoctorsList
