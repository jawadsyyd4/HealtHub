// eslint-disable-next-line no-unused-vars
import React, { useContext, useEffect, useState } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa' // Import icons

const DoctorAppointments = () => {
    const { dToken, getAppointments, appointments, cancelAppointment, completeAppointment } = useContext(DoctorContext)
    const { calculateAge, slotDateFormat, currency } = useContext(AppContext)

    const [currentPage, setCurrentPage] = useState(1);
    const [appointmentsPerPage] = useState(6); // Number of appointments per page

    useEffect(() => {
        if (dToken) {
            getAppointments();
        }
    }, [dToken]);

    // Pagination Logic
    const indexOfLastItem = currentPage * appointmentsPerPage;
    const indexOfFirstItem = indexOfLastItem - appointmentsPerPage;
    const currentAppointments = appointments.reverse().slice(indexOfFirstItem, indexOfLastItem);

    const totalPages = Math.ceil(appointments.length / appointmentsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Function to generate page numbers with ellipsis
    const generatePageNumbers = () => {
        const pageNumbers = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i);
            }
        } else {
            if (currentPage <= 3) {
                pageNumbers.push(1, 2, 3, '...', totalPages);
            } else if (currentPage >= totalPages - 2) {
                pageNumbers.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
            } else {
                pageNumbers.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
            }
        }
        return pageNumbers;
    }

    return (
        <div className='w-full max-w-6xl m-5'>
            <p className='mb-3 text-lg font-medium'>All Appointments</p>
            <div className="bg-white border rounded text-sm  max-h-[80vh] min-h-[50vh] overflow-y-scroll">
                <div className="max-sm:hidden grid grid-cols-[0.5fr_2fr_1fr_0.8fr_2fr_1fr_1fr_1.2fr] gap-1 py-3 px-6 border-b">
                    <p className='m-auto'>#</p>
                    <p className='m-auto'>Patient</p>
                    <p className='m-auto'>Payment</p>
                    <p className='m-auto'>Age</p>
                    <p className='m-auto'>Date & Time</p>
                    <p className='m-auto'>Confirmed</p>
                    <p className='m-auto'>Fees</p>
                    <p className='m-auto'>Attended</p>
                </div>
                {
                    currentAppointments.map((item, index) => (
                        <div className="flex flex-wrap justify-between max-sm:gap-5 max-sm:text-base sm:grid grid-cols-[0.5fr_2fr_1fr_0.8fr_2fr_1fr_1fr_1.2fr] gap-1 items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50" key={index}>
                            <p className='max-sm:hidden m-auto'>{index + 1}</p>
                            <div className="flex items-center gap-2 m-auto">
                                <img loading="lazy" className='w-8 rounded-full' src={item.userData ? item.userData.image : assets.upload_area} alt="" />
                                <p>{item.userData ? item.userData.name : item.guestPatientId.name}</p>
                            </div>
                            <div className="m-auto">
                                <p className='text-xs inline border border-[#C0EB6A] px-2 rounded-full'>{item.payment ? 'ONLINE' : 'CASH'}</p>
                            </div>
                            <p className="max-sm:hidden m-auto">
                                {(() => {
                                    const dob = item.userData?.dob || item.guestPatientId?.dateOfBirth;
                                    const age = dob ? calculateAge(dob) : null;
                                    return age && !isNaN(age) ? age : 'N/A';
                                })()}
                            </p>
                            <p className='m-auto'>{slotDateFormat(item.slotDate)}, {item.slotTime}</p>
                            <div className=''><p className={`w-2 h-2 m-auto ${item.confirmed ? 'bg-green-500' : 'bg-red-400'} rounded-full`}></p></div>
                            <p className='max-sm:hidden m-auto'>{currency}{item.amount}</p>
                            {
                                item.cancelled
                                    ? <p className='text-red-400 text-sm font-medium m-auto'>Cancelled</p>
                                    : item.isCompleted
                                        ? <p className='text-green-500 text-sm font-medium m-auto'>Completed</p>
                                        :
                                        <div className="flex m-auto">
                                            <img loading="lazy" onClick={() => { cancelAppointment(item._id) }} className='w-10 cursor-pointer' src={assets.cancel_icon} alt="" />
                                            <img loading="lazy" onClick={() => { completeAppointment(item._id) }} className='w-10 cursor-pointer' src={assets.tick_icon} alt="" />
                                        </div>
                            }
                        </div>
                    ))
                }
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-center py-4 items-center">
                <button
                    onClick={() => paginate(currentPage - 1)}
                    className={`px-4 py-2 text-sm font-medium text-white bg-[#C0EB6A] rounded-l ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={currentPage === 1}
                >
                    <FaChevronLeft />
                </button>

                {/* Page Numbers */}
                {generatePageNumbers().map((pageNumber, index) => (
                    <button
                        key={index}
                        onClick={() => pageNumber !== '...' && paginate(pageNumber)}
                        className={`px-4 py-2 mx-1 text-sm font-medium ${pageNumber === currentPage ? 'bg-[#C0EB6A] text-white' : 'bg-gray-200'} rounded-full`}
                    >
                        {pageNumber}
                    </button>
                ))}

                <button
                    onClick={() => paginate(currentPage + 1)}
                    className={`px-4 py-2 text-sm font-medium text-white bg-[#C0EB6A] rounded-r ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={currentPage === totalPages}
                >
                    <FaChevronRight />
                </button>
            </div>
        </div>
    );
};

export default DoctorAppointments;
