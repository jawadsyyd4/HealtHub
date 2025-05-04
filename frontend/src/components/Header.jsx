// eslint-disable-next-line no-unused-vars
import React from 'react';
import { assets } from '../assets/assets';

const Header = () => {
    return (
        <div className='flex flex-col md:flex-row flex-wrap bg-[#C0EB6A] rounded-lg px-4 md:px-6 lg:px-8'>
            {/* LEFT */}
            <div className="md:w-1/2 flex flex-col items-start justify-center gap-4 py-6 m-auto md:py-[5vw] md:mb-[-30px]">
                {/* Decrease padding on the <p> element */}
                <p className='text-3xl md:text-4xl lg:text-5xl text-white font-semibold leading-tight md:leading-tight lg:leading-tight p-0'>
                    Book Appointment <br />
                    With Trusted Doctors
                </p>
                <div className="flex flex-col md:flex-row items-center gap-3 text-white text-sm font-light">
                    <img className='w-28' src={assets.group_profiles} alt="" />
                    <p>Simply browse through our extensive list of trusted doctors,<br className='hidden sm:block' />schedule your appointment hassle-free.</p>
                </div>
                <button
                    onClick={() => document.getElementById("speciality").scrollIntoView({ behavior: "smooth" })}
                    className="cursor-pointer flex items-center gap-2 bg-white px-8 py-3 rounded-full text-gray-600 text-sm m-auto md:m-0 hover:scale-105 transition-all duration-300"
                >
                    Book Appointment <img className="w-3" src={assets.arrow_icon} alt="Arrow icon" />
                </button>

                {/* Button to scroll to Doctor Calendar */}
                <button
                    onClick={() => document.getElementById("DoctorCalendar").scrollIntoView({ behavior: "smooth" })}
                    className="cursor-pointer flex items-center gap-2 bg-white px-8 py-3 rounded-full text-gray-600 text-sm m-auto md:m-0 mt-5 hover:scale-105 transition-all duration-300"
                >
                    View Available Doctors <img className="w-3" src={assets.arrow_icon} alt="Arrow icon" />
                </button>
            </div>

            {/* RIGHT */}
            <div className="md:w-1/2 relative">
                <img className='w-full md:absolute bottom-0 h-auto rounded-lg' src={assets.doctorEquipment} alt="Doctor's equipment" loading='eager' />
            </div>
        </div>
    );
};

export default Header;
