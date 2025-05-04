// eslint-disable-next-line no-unused-vars
import React from 'react'
import { assets } from '../assets/assets'
import { Link } from 'react-router-dom'

const Footer = () => {
    return (
        <div className='md:mx-10' id='footer'>
            <div className='flex flex-col sm:grid grid-cols-1 sm:grid-cols-[3fr_1fr_1fr] gap-10 sm:gap-14 my-10 mt-40 text-sm sm:text-base'>
                {/* LEFT */}
                <div className="sm:mb-0 mb-10">
                    <img className='mb-5 w-32 -mt-5' src={assets.svgLogo} alt="HealthHub Logo" />
                    <p className='w-full md:w-2/3 text-gray-600 leading-6 text-sm sm:text-base'>
                        At HealthHub, we provide trusted medical professionals, ensuring quality care for all your healthcare needs. Connect with specialists who are always ready to help.
                    </p>
                </div>

                {/* CENTER */}
                <div className="sm:text-left text-center">
                    <p className='text-xl font-medium mb-5 text-gray-700'>COMPANY</p>
                    <ul className='flex flex-col gap-2 text-gray-600'>
                        <li>
                            <Link to={"/"} className="hover:text-gray-800" onClick={scrollTo(0, 0)}>Home</Link>
                        </li>
                        <li>
                            <Link to={"/about"} className="hover:text-gray-800" onClick={scrollTo(0, 0)}>About Us</Link>
                        </li>
                        <li>
                            <Link to={"/contact"} className="hover:text-gray-800" onClick={scrollTo(0, 0)}>Contact Us</Link>
                        </li>
                        <li>
                            <a href="#footer" className="hover:text-gray-800">Privacy Policy</a>
                        </li>
                    </ul>
                </div>

                {/* RIGHT */}
                <div className="sm:text-left text-center">
                    <p className='text-xl font-medium mb-5 text-gray-700'>GET IN TOUCH</p>
                    <ul className='flex flex-col gap-2 text-gray-600'>
                        <li>+961 81-036923</li>
                        <li>jawadsyyd@gmail.com</li>
                    </ul>
                </div>
            </div>

            <div className="">
                <hr className='text-gray-200' />
                <p className='py-5 text-sm text-center text-gray-600'>Copyright 2024@ HealthHub - All Rights Reserved.</p>
            </div>
        </div>
    )
}

export default Footer
