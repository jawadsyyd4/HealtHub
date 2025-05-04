// eslint-disable-next-line no-unused-vars
import React from 'react'
import Header from '../components/Header'
import SpecialityMenu from '../components/SpecialityMenu'
import TopDoctors from '../components/TopDoctors'
import Banner from '../components/Banner'
import DoctorCalendar from '../components/DoctorCalendar'

const Home = () => {
    return (
        <div>
            <Header />
            <SpecialityMenu />
            <TopDoctors />
            <DoctorCalendar />
            <Banner />
        </div>
    )
}

export default Home
