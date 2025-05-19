// eslint-disable-next-line no-unused-vars
import React, { useContext, useEffect, useState } from 'react';
import { AdminContext } from '../../context/AdminContext';
import { AppContext } from '../../context/AppContext';
import { assets } from '../../assets/assets';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const AllAppointments = () => {
    const { aToken, appointments, getAllAppointments, cancelAppointment, setDocInfo } = useContext(AdminContext);
    const { calculateAge, slotDateFormat, currency } = useContext(AppContext);

    const [currentPage, setCurrentPage] = useState(1);
    const appointmentsPerPage = 6;

    useEffect(() => {
        if (aToken) {
            getAllAppointments();
        }
        setDocInfo(false);
    }, [aToken]);

    const reversedAppointments = [...appointments].reverse();
    const indexOfLastAppointment = currentPage * appointmentsPerPage;
    const indexOfFirstAppointment = indexOfLastAppointment - appointmentsPerPage;
    const currentAppointments = reversedAppointments.slice(indexOfFirstAppointment, indexOfLastAppointment);

    const totalPages = Math.ceil(reversedAppointments.length / appointmentsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);
    const handlePrevious = () => {
        if (currentPage > 1) setCurrentPage(prev => prev - 1);
    };
    const handleNext = () => {
        if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
    };

    // Function to generate page numbers with dots (...)
    const renderPageNumbers = () => {
        const pageNumbers = [];

        if (totalPages <= 3) {
            // If 3 or fewer pages, show all
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i);
            }
        } else {
            pageNumbers.push(1);

            if (currentPage > 2) {
                pageNumbers.push('...');
            }

            const startPage = Math.max(2, currentPage - 1);
            const endPage = Math.min(totalPages - 1, currentPage + 1);

            for (let i = startPage; i <= endPage; i++) {
                pageNumbers.push(i);
            }

            if (currentPage < totalPages - 1) {
                pageNumbers.push('...');
            }

            pageNumbers.push(totalPages);
        }

        return pageNumbers;
    };


    return (
        <div className='w-full max-w-6xl m-5'>
            <p className='mb-3 text-lg font-medium'>All Appointments</p>
            <div className="bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll min-h-[60vh]">
                <div className="hidden sm:grid grid-cols-[0.5fr_3fr_1fr_3fr_3fr_1fr_1fr] grid-flow-col py-3 px-6 border-b">
                    <p className='m-auto'>#</p>
                    <p className='m-auto'>Patient</p>
                    <p className='m-auto'>Age</p>
                    <p className='m-auto'>Date & Time</p>
                    <p className='m-auto'>Doctor</p>
                    <p className='m-auto'>Fees</p>
                    <p className='m-auto'>Attended</p>
                </div>

                {currentAppointments.map((item, index) => (
                    <div key={index} className="flex flex-wrap justify-between max-sm:gap-2 sm:grid sm:grid-cols-[0.5fr_3fr_1fr_3fr_3fr_1fr_1fr] items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50">
                        <p className='max-sm:hidden m-auto'>{indexOfFirstAppointment + index + 1}</p>
                        <div className="flex items-center gap-2 m-auto">
                            <img className='w-8 rounded-full' src={item.userData ? item.userData.image : assets.upload_area} alt="" />
                            <p>{item.userData ? item.userData.name : item.guestPatientId.name}</p>
                        </div>
                        <p className="max-sm:hidden m-auto">
                            {(() => {
                                const dob = item.userData?.dob || item.guestPatientId?.dateOfBirth;
                                const age = dob ? calculateAge(dob) : null;
                                return age && !isNaN(age) ? age : 'N/A';
                            })()}
                        </p>
                        <p className='m-auto'>{slotDateFormat(item.slotDate)}, {item.slotTime}</p>
                        <div className="flex items-center gap-2 m-auto">
                            <img className='w-8 rounded-full bg-gray-200' src={item.doctorData.image} alt="" />
                            <p>{item.doctorData.name}</p>
                        </div>
                        <p className='max-sm:hidden m-auto'>{currency}{item.amount}</p>
                        {
                            item.cancelled
                                ? <p className='text-red-400 text-xs font-medium m-auto'>Cancelled</p>
                                : item.isCompleted
                                    ? <p className='text-green-500 text-xs font-medium m-auto'>Completed</p>
                                    : <img onClick={() => cancelAppointment(item._id)} className='w-10 cursor-pointer m-auto' src={assets.cancel_icon} alt="" />
                        }
                    </div>
                ))}
            </div>

            {/* Pagination */}
            <div className='flex justify-center items-center gap-2 mt-6 flex-wrap'>
                {/* Previous button */}
                <button
                    onClick={handlePrevious}
                    disabled={currentPage === 1}
                    className={`rounded-lg px-3 py-2 border border-[#C0EB6A] text-[#C0EB6A] font-medium ${currentPage === 1 ? 'text-[#C0EB6A] cursor-not-allowed' : 'hover:bg-[#C0EB6A] hover:text-white transition-all duration-300'}`}
                >
                    <FaChevronLeft />
                </button>

                {/* Dynamic Page Numbers */}
                {renderPageNumbers().map((page, index) => (
                    <button
                        key={index}
                        onClick={() => typeof page === 'number' && paginate(page)}
                        disabled={page === '...'}
                        className={`px-4 py-2 rounded-xl font-medium cursor-pointer border-[#C0EB6A] text-[#C0EB6A]
            ${currentPage === page ? 'bg-[#C0EB6A] text-white' : ''}
            ${page === '...' ? 'cursor-default' : 'hover:bg-[#C0EB6A] hover:text-white transition-all duration-300'}
        `}
                    >
                        {page}
                    </button>
                ))}

                {/* Next button */}
                <button
                    onClick={handleNext}
                    disabled={currentPage === totalPages}
                    className={`rounded-lg px-3 py-2 border border-[#C0EB6A] text-[#C0EB6A] font-medium ${currentPage === totalPages ? 'text-[#C0EB6A] cursor-not-allowed' : 'hover:bg-[#C0EB6A] hover:text-white transition-all duration-300'}`}
                >
                    <FaChevronRight />
                </button>
            </div>
        </div>
    );
};

export default AllAppointments;

