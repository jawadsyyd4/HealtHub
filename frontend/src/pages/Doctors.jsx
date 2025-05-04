// eslint-disable-next-line no-unused-vars
import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from "react-router-dom";
import { AppContext } from "../context/AppContext";
const Doctors = () => {
    const { speciality } = useParams();
    const navigate = useNavigate();
    const [filterDoc, setFilterDoc] = useState([])
    const [showFilter, setShowFilter] = useState(false)
    const { doctors, specialities, loadSpecialities, token } = useContext(AppContext)
    const applyFilter = () => {
        if (speciality) {
            setFilterDoc(doctors.filter(doc => doc.speciality.name === speciality))
        } else {
            setFilterDoc(doctors)
        }
    }
    useEffect(() => {
        if (token) {
            loadSpecialities()
        }
    }, [token])
    useEffect(() => {
        applyFilter()
    }, [doctors, speciality])
    return (
        <div>
            <p className='text-gray-600'>Browse through the doctors specialist.</p>
            <div className="flex flex-col sm:flex-row items-start gap-5 mt-5">
                <button onClick={() => setShowFilter(prev => !prev)} className={`py-1 px-3 border rounded text-sm transition-all sm:hidden ${showFilter ? 'text-white bg-[#C0EB6A]' : ''}`}>Filter</button>
                <div className={`flex-col gap-4 text-sm text-gray-600 ${showFilter ? 'flex' : 'hidden sm:flex'}`}>
                    {
                        specialities.map((item, index) => (
                            <p
                                key={index}
                                onClick={() =>
                                    speciality === item.name
                                        ? navigate('/doctors')
                                        : navigate(`/doctors/${item.name}`)  // Correctly use backticks for dynamic path
                                }
                                className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${speciality === item.name ? "bg-indigo-100 text-black" : ""}`}
                            >
                                {item.name}
                            </p>
                        ))
                    }

                </div>
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pt-5 gap-y-6 px-3 sm:px-0">
                    {
                        !filterDoc.length ? <p>No doctors found.</p>
                            :
                            filterDoc.map((item, index) => (
                                <div onClick={() => navigate(`/appointment/${item._id}`)} key={index} className="border border-blue-200 rounded-xl overflow-hidden cursor-pointer hover:translate-y-[-10px] transition-all duration-500">
                                    <img className="bg-blue-50 w-full h-48 object-cover" src={item.image} alt="" />
                                    <div className="p-4">
                                        <div className={`flex items-center gap-2 text-sm text-center ${item.available ? ' text-green-500' : ' text-red-400'}`}>
                                            <p className={`w-2 h-2 ${item.available ? 'bg-green-500' : 'bg-red-400'} rounded-full`}></p>
                                            <p>{item.available ? 'available' : 'disable'}</p>
                                        </div>
                                        <p className="font-medium text-lg">Dr. {item.name}</p>
                                        <p className="text-sm text-gray-600">{item.speciality.name}</p>
                                    </div>
                                </div>
                            ))
                    }
                </div>
            </div>
        </div>
    )
}

export default Doctors
