/* eslint-disable react/prop-types */
import { createContext, useState } from "react";
import axios from "axios"
import { toast } from 'react-toastify';

export const AdminContext = createContext()

const AdminContextProvider = (props) => {

    const [aToken, setAToken] = useState(localStorage.getItem('aToken') ? localStorage.getItem('aToken') : '')

    const [doctors, setDoctors] = useState([])

    const [appointments, setAppointments] = useState([])

    const [specialities, setSpecialities] = useState([])

    const [dashData, setDashData] = useState(false)

    const backendUrl = import.meta.env.VITE_BACKEND_URL


    const getAllDoctors = async () => {
        try {
            const { data } = await axios.post(backendUrl + '/api/admin/all-doctor', {}, { headers: { aToken } })
            if (data.success) {
                setDoctors(data.doctors)

            } else { toast.error(data.message) }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const changeAvailability = async (docId) => {
        try {

            const { data } = await axios.post(backendUrl + '/api/admin/change-availability', { docId }, { headers: { aToken } })
            if (data.success) {
                toast.success(data.message)
                getAllDoctors()
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
        }
    }

    const getAllAppointments = async () => {
        try {
            const { data } = await axios.get(backendUrl + "/api/admin/appointments", { headers: { aToken } })

            if (data.success) {
                setAppointments(data.appointments)
                console.table(data.appointments);
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const cancelAppointment = async (appointmentId) => {
        try {
            const { data } = await axios.post(backendUrl + "/api/admin/cancel-appointment", { appointmentId }, { headers: { aToken } })
            if (data.success) {
                toast.success(data.message)
                getAllAppointments()
                getDashData()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const getDashData = async () => {
        try {
            const { data } = await axios.get(backendUrl + "/api/admin/dashboard", { headers: { aToken } })
            if (data.success) {
                setDashData(data.dashData)
                console.log(data.dashData);
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const getAllSpecialities = async () => {
        try {
            const { data } = await axios.get(backendUrl + "/api/speciality/specialities", { headers: { aToken } })

            if (data.success) {
                setSpecialities(data.specialities)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const deleteHandler = async (specialityId) => {
        try {
            const { data } = await axios.post(backendUrl + "/api/speciality/delete-speciality", { specialityId }, { headers: { aToken } })
            if (data.success) {
                toast.success(data.message)
                getAllSpecialities()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
            console.log(error);
        }
    }


    const value = {
        aToken, setAToken,
        backendUrl, getAllDoctors, doctors, changeAvailability, getAllAppointments,
        appointments, setAppointments, cancelAppointment, getDashData, dashData,
        specialities, setSpecialities, getAllSpecialities, deleteHandler,
    }

    return <AdminContext.Provider value={value}>
        {props.children}
    </AdminContext.Provider>
}

export default AdminContextProvider