// eslint-disable-next-line no-unused-vars
import React from 'react'
import { assets } from "../assets/assets";
const About = () => {
    return (
        <div>

            <div className="text-center text-2xl pt-10 text-gray-500">
                <p>ABOUT <span className='text-gray-700 font-medium'>US</span></p>
            </div>

            <div className="my-10 flex flex-col md:flex-row gap-12">
                <img loading="lazy" className='w-full md:max-w-[360px]' src={assets.about_image} alt="" />
                <div className="flex flex-col justify-center gap-6 md:w-2/4 text-sm text-gray-600">
                    <p>At HealthHub, we are committed to connecting you with trusted healthcare professionals who prioritize your well-being. Our platform simplifies the process of finding the right doctor, ensuring a seamless experience for booking appointments.</p>
                    <p>We understand the importance of healthcare, and our goal is to make quality medical services accessible to everyone. Whether you need routine check-ups or specialized care, we are here to help you take the next step toward better health.</p>
                    <b className='text-gray-800'>Our Vision</b>
                    <p>Our vision is to create a healthier world by providing individuals with easy access to expert doctors and medical resources. Through our platform, we aim to empower people to make informed health decisions and enhance the quality of care they receive.</p>
                </div>

            </div>

            <div className="text-xl my-4">
                <p>WHY <span className='text-gray-700 font-semibold'>CHOOSE US</span></p>
            </div>

            <div className="flex flex-col md:flex-row mb-20">
                <div className='border px-10 md:px-16 py-8 sm:py-16 flex flex-col gap-5 text-[15px] hover:bg-[#C0EB6A] hover:text-white transition-all duration-300 text-gray-600 cursor-pointer'>
                    <b>Efficiency:</b>
                    <p>We streamline the process of booking appointments, allowing you to quickly find and schedule time with trusted doctors, saving you valuable time and effort.</p>
                </div>
                <div className='border px-10 md:px-16 py-8 sm:py-16 flex flex-col gap-5 text-[15px] hover:bg-[#C0EB6A] hover:text-white transition-all duration-300 text-gray-600 cursor-pointer'>
                    <b>Convenience:</b>
                    <p>Our platform is designed with your convenience in mind, offering easy access to a wide range of healthcare professionals and allowing you to book appointments from the comfort of your home.</p>
                </div>
                <div className='border px-10 md:px-16 py-8 sm:py-16 flex flex-col gap-5 text-[15px] hover:bg-[#C0EB6A] hover:text-white transition-all duration-300 text-gray-600 cursor-pointer'>
                    <b>Personalization:</b>
                    <p>We offer personalized recommendations based on your health needs, helping you find the best doctors who align with your unique preferences and requirements.</p>
                </div>

            </div>
        </div>
    )
}

export default About
