// eslint-disable-next-line no-unused-vars
import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import Rating from 'react-rating'; // Import this at the top of your file
import { FaStar, FaRegStar, FaStarHalfAlt } from 'react-icons/fa'; // For icons
const TopDoctors = () => {
    const navigate = useNavigate()
    const { doctors, backendUrl } = useContext(AppContext)
    const [topDoctors, setTopDoctors] = useState([])

    useEffect(() => {
        const fetchDoctorRatings = async () => {
            try {
                const ratingsPromises = doctors.map(async (doctor) => {
                    // Fetch average rating for the doctor from the backend
                    const response = await axios.get(`${backendUrl}/api/doctor/rating/${doctor._id}`)
                    const { averageRating } = response.data
                    return { ...doctor, averageRating }
                })

                // Wait for all ratings to be fetched
                const doctorsWithRatings = await Promise.all(ratingsPromises)

                // Sort doctors based on the average rating in descending order
                const sortedDoctors = doctorsWithRatings.sort((a, b) => b.averageRating - a.averageRating)

                // If no ratings, fallback to random doctors
                if (sortedDoctors.every((doctor) => doctor.averageRating === 0)) {
                    setTopDoctors(doctors.slice(0, 5))  // Fallback to random doctors if no ratings
                } else {
                    setTopDoctors(sortedDoctors.slice(0, 5)) // Top 5 rated doctors
                }
            } catch (error) {
                console.log('Error fetching ratings:', error)
                // Fallback to random doctors in case of an error
                setTopDoctors(doctors.slice(0, 5))
            }
        }

        fetchDoctorRatings()
    }, [doctors, backendUrl])

    return (
        <div className='flex flex-col items-center gap-4 text-gray-900 md:mx-10'>
            <h1 className="text-3xl font-semibold text-center text-gray-800">
                Top-Rated Doctors for Your Appointment
            </h1>
            <p className="sm:w-1/2 text-center text-sm text-gray-600">
                Browse through our carefully selected list of trusted, top-rated doctors to find the perfect fit for your needs.
            </p>
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pt-5 gap-y-6 px-3 sm:px-0">
                {
                    topDoctors.map((item, index) => (
                        <div
                            onClick={() => {
                                navigate(`/appointment/${item._id}`);
                                scrollTo(0, 0);
                            }}
                            key={index}
                            className="relative rounded-2xl overflow-hidden cursor-pointer bg-white shadow-md hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 border border-[#C0EB6A]"
                        >
                            <div className="relative">
                                <img
                                    className="w-full h-48 object-cover bg-[#F0FDF4]"
                                    src={item.image}
                                    alt=""
                                    loading="lazy"
                                />
                                {/* Average rating badge */}
                                {item.averageRating > 0 && (
                                    <span className="absolute top-2 right-2 bg-yellow-400 text-white text-xs font-semibold px-2 py-1 rounded-full shadow">
                                        {item.averageRating.toFixed(1)} ★
                                    </span>
                                )}
                            </div>

                            <div className="p-4 space-y-2 pb-10 relative">
                                <p className="text-lg font-semibold text-gray-800">Dr. {item.name}</p>
                                <p className="text-sm text-gray-500">{item.speciality.name}</p>
                            </div>

                            {/* Rating stars positioned at the bottom */}
                            {item.averageRating > 0 && (
                                <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 text-yellow-400">
                                    <Rating
                                        readonly
                                        initialRating={item.averageRating}
                                        emptySymbol={<FaRegStar />}
                                        fullSymbol={<FaStar />}
                                        placeholderSymbol={<FaStarHalfAlt />}
                                        fractions={2}
                                    />
                                </div>
                            )}
                        </div>

                    ))
                }
            </div>
            <button
                onClick={() => {
                    navigate("/doctors");
                    scrollTo(0, 0);
                }}
                className="bg-[#F7FDF0] border border-[#C0EB6A] text-[#C0EB6A] px-12 py-3 rounded-full mt-4 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:bg-[#C0EB6A] hover:text-white"
            >
                More
            </button>

        </div>
    )
}

export default TopDoctors
