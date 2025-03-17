// eslint-disable-next-line no-unused-vars
import React, { useContext } from 'react'

import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext';

const TopDoctors = () => {
    const navigate = useNavigate();
    const { doctors } = useContext(AppContext)
    return (
        <div className='flex flex-col items-center gap-4 my-16 text-gray-900 md:mx-10'>
            <h1 className='text-3xl font-medium'>Top Doctors to Book</h1>
            <p className='sm:w-1/3 text-center text-sm'>Simply browse through our extensive list of trusted doctors.</p>
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pt-5 gap-y-6 px-3 sm:px-0">
                {
                    doctors.slice(0, 10).map((item, index) => (
                        <div onClick={() => { navigate(`/appointment/${item._id}`); scrollTo(0, 0) }} key={index} className="border border-blue-200 rounded-xl overflow-hidden cursor-pointer hover:translate-y-[-10px] transition-all duration-500">
                            <img className="bg-blue-50 w-full h-48 object-cover" src={item.image} alt="" />
                            <div className="p-4">
                                <div className={`flex items-center gap-2 text-sm text-center ${item.available ? ' text-green-500' : ' text-red-400'} hidden`}>
                                    <p className={`w-2 h-2 ${item.available ? 'bg-green-500' : 'bg-red-400'} rounded-full`}></p>
                                    <p>{item.available ? 'available' : 'disable'}</p>
                                </div>
                                <p className="font-medium text-lg">{item.name}</p>
                                <p className="text-sm text-gray-600">{item.speciality}</p>
                            </div>
                        </div>
                    ))
                }
            </div>
            <button onClick={() => { navigate("/doctors"); scrollTo(0, 0) }} className='bg-blue-50 cursor-pointer text-gray-600 px-12 py-3 rounded-full mt-10'>more</button>
        </div>
    )
}

export default TopDoctors
