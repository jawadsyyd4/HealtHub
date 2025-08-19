/* eslint-disable react/prop-types */
// eslint-disable-next-line no-unused-vars
import React from 'react'
import { useContext } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { useEffect } from 'react'
import { assets } from '../../assets/assets'
import { AppContext } from '../../context/AppContext'

const DoctorDashboard = () => {

    const { dashData, getDashData, dToken, cancelAppointment, completeAppointment } = useContext(DoctorContext)

    const { currency, slotDateFormat } = useContext(AppContext)

    const StatCard = ({ label, count, icon, countClass = "text-gray-700" }) => (
        <div className="flex items-center gap-4 bg-white p-5 min-w-[180px] rounded-lg border-2 border-gray-200 shadow hover:shadow-lg cursor-pointer transition-transform hover:scale-105">
            <img loading="lazy" className="w-14" src={icon} alt={label} />
            <div>
                <p className={`text-2xl font-semibold ${countClass}`}>{count}</p>
                <p className="text-gray-500">{label}</p>
            </div>
        </div>
    );


    useEffect(() => {
        if (dToken) {
            getDashData()
        }
    }, [dToken])

    return dashData && (
        <div className="m-5 w-screen">
            {/* Stats */}
            <div className="flex flex-wrap gap-3 justify-center">
                <StatCard
                    label="Earnings"
                    count={`${currency} ${dashData.earnings}`}
                    icon={assets.earning_icon}
                />
                <StatCard
                    label="Appointments"
                    count={dashData.appointments}
                    icon={assets.appointments_icon}
                />
                <StatCard
                    label="Patients"
                    count={dashData.patients}
                    icon={assets.patients_icon}
                />
                <StatCard
                    label="Cancelled"
                    count={dashData.cancelledAppointments}
                    icon={assets.cancel_icon}
                    countClass="text-red-600"
                />
                <StatCard
                    label="Completed"
                    count={dashData.completedAppointments}
                    icon={assets.tick_icon}
                    countClass="text-green-600"
                />
            </div>

            {/* Latest Bookings */}
            <section className="bg-white mt-12 rounded-lg shadow-md border border-gray-200 max-w-full">
                <header className="flex items-center gap-3 px-6 py-4 rounded-t-lg border-b border-gray-300 bg-gray-50">
                    <img loading="lazy" src={assets.list_icon} alt="List Icon" className="w-6 h-6" />
                    <h2 className="font-semibold text-gray-800 text-xl">Latest Bookings</h2>
                </header>

                <div className="pt-4 max-h-[420px] overflow-y-auto">
                    {dashData.latestAppointments.map((item, index) => (
                        <article
                            key={index}
                            className="flex items-center px-6 py-3 gap-5 hover:bg-gray-50 border-b last:border-b-0 transition-colors duration-200"
                        >
                            <img
                                className="rounded-full w-12 h-12 object-cover border border-gray-200"
                                src={item.userData ? item.userData.image : assets.upload_area}
                                alt={item.userData ? item.userData.name : item.guestPatientId.name}
                                loading="lazy"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-gray-900 font-semibold truncate">
                                    {item.userData ? item.userData.name : item.guestPatientId.name}
                                </p>
                                <p className="text-gray-500 text-sm whitespace-nowrap">
                                    {slotDateFormat(item.slotDate)}
                                </p>
                            </div>

                            {item.cancelled ? (
                                <span className="text-red-600 text-sm font-semibold">Cancelled</span>
                            ) : item.isCompleted ? (
                                <span className="text-green-600 text-sm font-semibold">Completed</span>
                            ) : (
                                <div className="flex gap-4 justify-center items-center">
                                    <button
                                        onClick={() => cancelAppointment(item._id)}
                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-red-100 hover:bg-red-200 cursor-pointer transition"
                                        aria-label="Cancel appointment"
                                        title="Cancel Appointment"
                                    >
                                        <img loading="lazy" src={assets.cancel_icon} alt="Cancel" className="w-4 h-4" />
                                    </button>

                                    <button
                                        onClick={() => completeAppointment(item._id)}
                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-green-100 hover:bg-green-200 cursor-pointer transition"
                                        aria-label="Complete appointment"
                                        title="Complete Appointment"
                                    >
                                        <img loading="lazy" src={assets.tick_icon} alt="Complete" className="w-4 h-4" />
                                    </button>
                                </div>

                            )}
                        </article>
                    ))}
                </div>
            </section>
        </div>
    );


}

export default DoctorDashboard
