/* eslint-disable react/prop-types */
// eslint-disable-next-line no-unused-vars
import React, { useContext, useEffect } from 'react';
import { AdminContext } from '../../context/AdminContext';
import { AppContext } from '../../context/AppContext';
import { assets } from '../../assets/assets';

const Dashboard = () => {
    const { aToken, getDashData, dashData, cancelAppointment, setDocInfo } = useContext(AdminContext);
    const { slotDateFormat } = useContext(AppContext);

    useEffect(() => {
        if (aToken) getDashData();
        setDocInfo(false);
    }, [aToken]);

    if (!dashData) return null;

    const StatCard = ({ icon, label, count }) => (
        <div className="flex items-center gap-2 bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow cursor-pointer transition-transform transform hover:scale-[1.03] min-w-[140px]">
            <img className="w-12" src={icon} alt={`${label} icon`} loading="lazy" />
            <div>
                <p className="text-xl font-semibold text-gray-700">{count}</p>
                <p className="text-gray-500 text-sm">{label}</p>
            </div>
        </div>
    );

    const DoctorCard = ({ doctor, label, value }) => (
        <div key={doctor._id} className="border p-3 rounded hover:shadow transition-shadow flex gap-3 items-center">
            <img className="w-10 h-10 rounded-full object-cover" src={doctor.image} loading="lazy" alt={doctor.name} />
            <div>
                <p className="font-semibold text-sm text-gray-700">{doctor.name}</p>
                <p className="text-xs text-gray-500">
                    {label}: <span className="font-medium">{value}</span>
                </p>
            </div>
        </div>
    );

    return (
        <div className="m-2 space-y-4 w-screen">
            {/* Stats */}
            <div className="flex flex-wrap gap-3 justify-center">
                <StatCard label="Doctors" count={dashData.doctors} icon={assets.doctor_icon} />
                <StatCard label="Appointments" count={dashData.appointments} icon={assets.appointments_icon} />
                <StatCard label="Patients" count={dashData.patients} icon={assets.patients_icon} />
            </div>

            {/* Latest Bookings */}
            <section className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center gap-2 border-b pb-2 mb-3">
                    <img loading="lazy" src={assets.list_icon} alt="List icon" className="w-5" />
                    <h2 className="text-lg font-semibold text-[#C0EB6A]">Latest Bookings</h2>
                </div>
                <div className="space-y-2">
                    {dashData.latestAppointments.map((item) => (
                        <div key={item._id} className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 transition-colors">
                            <img loading="lazy" className="w-10 h-10 rounded-full object-cover" src={item.doctorData.image} alt={item.doctorData.name} />
                            <div className="flex-1 text-xs sm:text-sm">
                                <p className="font-semibold text-gray-800">{item.doctorData.name}</p>
                                <p className="text-gray-600">{slotDateFormat(item.slotDate)}</p>
                            </div>
                            <div>
                                {item.cancelled ? (
                                    <p className="text-red-500 text-xs font-semibold">Cancelled</p>
                                ) : item.isCompleted ? (
                                    <p className="text-green-600 text-xs font-semibold">Completed</p>
                                ) : (
                                    <img
                                        onClick={() => cancelAppointment(item._id)}
                                        className="w-10 cursor-pointer"
                                        src={assets.cancel_icon}
                                        alt="Cancel appointment"
                                        loading="lazy"
                                    />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Doctors with Most Cancelled Appointments */}
            {dashData.mostCancelledDoctors?.length > 0 && (
                <section className="bg-white rounded-lg shadow p-4">
                    <h2 className="text-lg font-semibold mb-3 text-[#C0EB6A]">
                        Doctors with Most Cancelled Appointments
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {dashData.mostCancelledDoctors.map(({ doctor, cancelledCount }) => (
                            <DoctorCard
                                key={doctor._id}
                                doctor={doctor}
                                label="Cancelled Appointments"
                                value={cancelledCount}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* No Appointments This Week & Max Patients (Side-by-Side) */}
            {(dashData.doctorsNoAppointmentsThisWeek?.length > 0 || dashData.maxPatientsDoctors?.length > 0) && (
                <section className="bg-white rounded-lg shadow p-4">
                    <div className="flex flex-col md:flex-row">

                        {/* Doctors with No Appointments This Week */}
                        {dashData.doctorsNoAppointmentsThisWeek?.length > 0 && (
                            <div className="flex-1 md:pr-6 md:border-r md:border-gray-300 mb-6 md:mb-0">
                                <h2 className="text-lg font-semibold mb-3 text-[#C0EB6A]">
                                    Doctors with No Appointments This Week
                                </h2>
                                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                    <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                                        {dashData.doctorsNoAppointmentsThisWeek.map((doctor) => (
                                            <li key={doctor._id} className="pl-1">{doctor.name}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* Doctors with Maximum Number of Patients */}
                        {dashData.maxPatientsDoctors?.length > 0 && (
                            <div className="flex-1 md:pl-6">
                                <h2 className="text-lg font-semibold mb-3 text-[#C0EB6A]">Doctors with Maximum Number of Patients</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {dashData.maxPatientsDoctors.map(({ doctor, patientCount }) => (
                                        <DoctorCard
                                            key={doctor._id}
                                            doctor={doctor}
                                            label="Patient Count"
                                            value={patientCount}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Temporarily Unavailable & Min Rated (Side-by-Side) */}
            <section className="bg-white rounded-lg shadow p-4">
                <div className="flex flex-col md:flex-row">

                    {/* Doctors Temporarily Unavailable */}
                    <div className="flex-1 md:pr-6 md:border-r md:border-gray-300 mb-6 md:mb-0">
                        <h2 className="text-lg font-semibold mb-3 text-[#C0EB6A]">Doctors Temporarily Unavailable</h2>
                        {dashData.doctorsTemporarilyUnavailable?.length > 0 ? (
                            <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                                {dashData.doctorsTemporarilyUnavailable.map(({ doctor, unavailableTo }) => (
                                    <li key={doctor._id}>
                                        {doctor.name} – until {new Date(unavailableTo).toLocaleString()}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500">No unavailable doctors at the moment.</p>
                        )}
                    </div>

                    {/* Doctors with Minimum Average Rating */}
                    <div className="flex-1 md:pl-6">
                        <h2 className="text-lg font-semibold mb-3 text-[#C0EB6A]">
                            Doctors with Minimum Average Rating
                        </h2>
                        {dashData.minRatedDoctors?.length > 0 &&
                            dashData.minRatedDoctors[0].averageRating > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {dashData.minRatedDoctors.map(({ doctor, averageRating }) => (
                                    <DoctorCard
                                        key={doctor._id}
                                        doctor={doctor}
                                        label="Avg. Rating"
                                        value={averageRating.toFixed(2)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">No doctors with ratings available.</p>
                        )}
                    </div>
                </div>
            </section>


        </div>
    );
};

export default Dashboard;
