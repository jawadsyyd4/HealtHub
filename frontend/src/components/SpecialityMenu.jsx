// eslint-disable-next-line no-unused-vars
import React, { useContext, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
const SpecialityMenu = () => {
    const { specialities, loadSpecialities } = useContext(AppContext)

    useEffect(() => {
        loadSpecialities()
    }, [])
    return (
        <div className='flex flex-col items-center gap-4 py-8 text-gray-800' id='speciality'>
            <h1 className="text-3xl font-semibold text-center text-gray-800">
                Discover Doctors by Specialty
            </h1>
            <p className="sm:w-1/2 text-center text-sm text-gray-600">
                Explore a wide range of trusted specialists and book your appointment easily, with just a few clicks.
            </p>

            <div className='flex sm:justify-center gap-4 pt-5 w-full overflow-scroll'>
                {
                    specialities.map((item, index) => (
                        <Link title={item.description} onClick={() => scrollTo(0, 0)} key={index} to={`/doctors/${item.name}`} className='flex flex-col items-center text-xs cursor-pointer flex-shrink-0 hover:translate-y-[-10px] transition-all duration-500'>
                            <img loading="lazy" className='w-16 sm:w-24 mb-2' src={item.image} alt="" />
                            <p className=''>{item.name}</p>
                        </Link>
                    ))
                }
            </div>
        </div>
    )
}

export default SpecialityMenu
