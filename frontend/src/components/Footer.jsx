// eslint-disable-next-line no-unused-vars
import React from 'react'
import { assets } from '../assets/assets'

const Footer = () => {
    return (
        <div className='md:mx-10'>
            <div className='flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm'>
                {/* LEFT */}
                <div>
                    <img className='mb-5 w-40' src={assets.logo} alt="" />
                    <p className='w-full md:w-2/3 text-gray-600 leading-6'>Lorem ipsum dolor sit amet consectetur adipisicing elit. Iste, nemo minima, molestias numquam repellendus ex incidunt blanditiis cumque voluptas fugit sint eligendi! Tenetur sapiente cumque quaerat nesciunt accusantium quibusdam quod?</p>
                </div>
                {/* CENTER */}
                <div>
                    <p className='text-xl font-medium mb-5'>COMPANY</p>
                    <ul className='flex flex-col gap-2 text-gray-600'>
                        <li>Home</li>
                        <li>About us</li>
                        <li>Contact us</li>
                        <li>Privacy Policy</li>
                    </ul>
                </div>
                {/* RIGHT */}
                <div>
                    <p className='text-xl font-medium mb-5'>GET IN TOUCH</p>
                    <ul className='flex flex-col gap-2 text-gray-600'>
                        <li>+961-81-036-923</li>
                        <li>jawadsyyd@gmail.com</li>
                    </ul>
                </div>
            </div>
            <div className="">
                <hr className='text-gray-200' />
                <p className='py-5 text-sm text-center'>Copyright 2024@ HealthHub - All Right Reserved.</p>
            </div>
        </div>
    )
}

export default Footer
