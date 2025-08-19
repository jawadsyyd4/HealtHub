/* eslint-disable react/prop-types */
import { createContext, useState } from "react";
import axios from "axios"
import { toast } from 'react-toastify';
import { useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';

export const AdminContext = createContext()

const AdminContextProvider = (props) => {

    const [aToken, setAToken] = useState(localStorage.getItem('aToken') ? localStorage.getItem('aToken') : '')

    const navigate = useNavigate('')

    const [doctors, setDoctors] = useState([])

    const [appointments, setAppointments] = useState([])

    const [specialities, setSpecialities] = useState([])

    const [dashData, setDashData] = useState(false)

    const backendUrl = import.meta.env.VITE_BACKEND_URL

    const [docInfo, setDocInfo] = useState(false)

    const getAllDoctors = async () => {
        try {
            const { data } = await axios.post(`${backendUrl}/api/admin/all-doctor`, {}, { headers: { aToken } })
            if (data.success) {
                setDoctors(data.doctors)

            } else { toast.error(data.message) }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const changeAvailability = async (docId) => {
        try {

            const { data } = await axios.post(`${backendUrl}/api/admin/change-availability`, { docId }, { headers: { aToken } })
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
            // Fetch appointments from the backend
            const { data } = await axios.get(`${backendUrl}/api/admin/appointments`, {
                headers: { aToken },
            });

            if (data.success) {
                // No need to fetch guest data separately, since it's populated in the backend
                setAppointments(data.appointments);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const cancelAppointment = async (appointmentId) => {
        try {
            const { data } = await axios.post(`${backendUrl}/api/admin/cancel-appointment`, { appointmentId }, { headers: { aToken } })

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
            const { data } = await axios.get(`${backendUrl}/api/admin/dashboard`, { headers: { aToken } })
            if (data.success) {
                setDashData(data.dashData)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const getAllSpecialities = async () => {
        try {
            const { data } = await axios.get(`${backendUrl}/api/speciality/specialities`, { headers: { aToken } })

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
        const result = await Swal.fire({
            title: 'Confirm Deletion',
            html: `
                <div style="font-size: 16px; color: #333;">
                    <p>Are you sure you want to <strong>permanently delete</strong> this speciality?</p>
                    <p style="margin-top: 10px; color: #d33;"><strong>This action cannot be undone.</strong></p>
                    <p style="margin-top: 10px;">All doctors related to this speciality will also be <strong>permanently removed</strong>.</p>
                </div>
            `,
            icon: 'warning',
            iconColor: '#d33',
            background: '#f9f9f9',
            showCancelButton: true,
            confirmButtonText: '🗑️ Yes, Delete',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6c757d',
            reverseButtons: true,
            focusCancel: true,
            customClass: {
                popup: 'swal2-border-radius',
                confirmButton: 'swal2-confirm-button',
                cancelButton: 'swal2-cancel-button',
            },
            buttonsStyling: false,
        });

        if (!result.isConfirmed) return;

        try {
            const { data } = await axios.post(
                `${backendUrl}/api/speciality/delete-speciality`,
                { specialityId },
                { headers: { aToken } }
            );

            if (data.success) {
                toast.success(data.message);
                getAllSpecialities();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
            console.log(error);
        }
    };


    const getDoctorData = async (docId) => {
        try {
            const { data } = await axios.get(`${backendUrl}/api/admin/doctor-info/${docId}`, { headers: { aToken } })
            if (data.success) {
                setDocInfo(data.doctor)
                navigate('/add-doctor')
            }
        } catch (error) {
            toast.error(error.message)
            console.log(error);
        }
    }

    const deleteDoctor = async (docId) => {
        const result = await Swal.fire({
            title: 'Confirm Deletion',
            html: `
                <div style="font-size: 16px; color: #333;">
                    <p>Are you sure you want to <strong>permanently delete</strong> this doctor?</p>
                    <p style="margin-top: 10px;">This action <span style="color: #d33;"><strong>cannot be undone</strong></span>.</p>
                </div>
            `,
            icon: 'warning',
            iconColor: '#d33',
            background: '#f9f9f9',
            showCancelButton: true,
            confirmButtonText: '🗑️ Yes, Delete',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6c757d',
            reverseButtons: true,
            focusCancel: true,
            customClass: {
                popup: 'swal2-border-radius',
                confirmButton: 'swal2-confirm-button',
                cancelButton: 'swal2-cancel-button',
            },
            buttonsStyling: false,
        });

        if (!result.isConfirmed) return;

        try {
            const { data } = await axios.post(
                `${backendUrl}/api/admin/delete-doctor/${docId}`,
                {},
                { headers: { aToken } }
            );

            if (data.success) {
                toast.success(data.message);
                getAllDoctors();
            }
        } catch (error) {
            toast.error(error.message);
            console.error(error);
        }
    };


    const value = {
        aToken, setAToken,
        backendUrl, getAllDoctors, doctors, changeAvailability, getAllAppointments,
        appointments, setAppointments, cancelAppointment, getDashData, dashData,
        specialities, setSpecialities, getAllSpecialities, deleteHandler, getDoctorData, docInfo, setDocInfo, deleteDoctor
    }

    return <AdminContext.Provider value={value}>
        {props.children}
    </AdminContext.Provider>
}

export default AdminContextProvider