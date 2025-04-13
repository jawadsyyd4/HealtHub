// eslint-disable-next-line no-unused-vars
import React, { useContext, useEffect, useState } from 'react'
import { assets } from "../../assets/assets"
import { AdminContext } from "../../context/AdminContext"
import { toast } from 'react-toastify';
import axios from "axios"
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { FaStethoscope } from 'react-icons/fa';
import LoadingComponent from '../../components/LoadingComponent';

const AddSpeciality = () => {
    const { backendUrl, aToken, specialities, getAllSpecialities, deleteHandler } = useContext(AdminContext)
    const [specialityImg, setSpecialityImg] = useState(false)
    const [name, setName] = useState('')
    const [open, setOpen] = useState(false)
    const [image, setImage] = useState(false)
    const [isEdit, setIsEdit] = useState(false)
    const [currentEditId, setCurrentEditId] = useState(false)

    const [loading, setLoading] = useState(false);


    const onSubmitHandler = async () => {
        setLoading(true); // Start loading

        try {

            if (!specialityImg) {
                return toast.error("Image Not Selected")
            }

            const formData = new FormData()

            formData.append('image', specialityImg)
            formData.append('name', name)

            const { data } = await axios.post(backendUrl + "/api/speciality/add-speciality", formData, { headers: { aToken } })

            if (data.success) {
                toast.success(data.message)
                setSpecialityImg(false)
                setName('')
                setOpen(false)
                getAllSpecialities()
            } else { toast.error(data.message) }

        } catch (error) {
            toast.error(error.message)
            console.log(error);
        } finally {
            setLoading(false); // Stop loading
        }

    }

    const editHandler = async (specialityId, specialityName) => {
        setLoading(true); // Start loading

        try {
            const formData = new FormData();

            // Append name to formData
            formData.append('name', specialityName);

            // Append image if it's selected
            if (image) {
                formData.append('image', image);
            }

            const { data } = await axios.post(
                backendUrl + '/api/speciality/update-speciality', // The URL endpoint
                formData, // The actual data (payload)
                {
                    headers: { aToken }, // Optional headers (e.g., for authentication)
                    params: { specialityId }, // Query parameters (e.g., ID for the speciality)
                }
            );

            // Handle the response
            if (data.success) {
                toast.success(data.message);
                getAllSpecialities();
                setIsEdit(false);
                setImage(false);
                setName('')
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
            console.log(error);
        } finally {
            setLoading(false); // Stop loading
        }
    };


    const [specialityData, setSpecialityData] = useState(false)


    const getSpecialityData = async (id) => {
        try {
            const { data } = await axios.get(backendUrl + "/api/speciality/get-speciality", {
                params: { id }  // Pass ID as query parameter
            });

            if (data.success) {
                toast.success(data.message)
                setSpecialityData(data.specialityData);
                console.log(data.specialityData)
                setImage(false)
                setCurrentEditId(id)
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
            console.log(error);
        }
    };

    useEffect(() => {
        if (aToken) {
            getAllSpecialities()
        }
    }, [aToken])
    return (
        <div className='m-5'>
            <div className="absolute end-0 m-6">
                {/* Button to open the dialog outside the form */}
                <button
                    type="button"
                    onClick={() => setOpen(true)} // Open dialog on click
                    className="border-[#C0EB6A] border-2 text-[#C0EB6A] px-8 py-3  rounded-lg text-lg font-semibold hover:bg-[#C0EB6A] hover:text-white transition-all cursor-pointer shadow-md">
                    Add Speciality
                </button>

                {/* Dialog component */}
                <Dialog open={open} onClose={() => setOpen(false)} className="relative z-10">
                    <DialogBackdrop
                        transition
                        className="fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
                    />
                    <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                            <DialogPanel
                                transition
                                className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:w-full sm:max-w-3xl sm:my-8 data-closed:sm:translate-y-0 data-closed:sm:scale-95"
                            >
                                <div className="bg-white px-6 pt-5 pb-6 sm:p-6 sm:pb-6">
                                    <div className="sm:items-start">
                                        <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:size-10">
                                            <ExclamationTriangleIcon aria-hidden="true" className="size-6 text-blue-600" />
                                        </div>
                                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                            <DialogTitle as="h3" className="text-2xl font-semibold text-gray-900">
                                                Add New Speciality
                                            </DialogTitle>
                                            <div className="mt-2">
                                                <form onSubmit={onSubmitHandler} className="mt-4">
                                                    <div className="bg-white px-8 py-8 border rounded w-full max-w-4xl max-h-[80vh] overflow-y-scroll">
                                                        <div className="flex items-center gap-4 mb-8 text-gray-500">
                                                            <label htmlFor="doc-img">
                                                                <img
                                                                    className="w-16 h-16 bg-gray-100 rounded-full cursor-pointer shadow-md"
                                                                    src={specialityImg ? URL.createObjectURL(specialityImg) : assets.upload_area}
                                                                    alt="Upload"
                                                                />
                                                            </label>
                                                            <input
                                                                onChange={(e) => setSpecialityImg(e.target.files[0])}
                                                                type="file"
                                                                id="doc-img"
                                                                hidden
                                                            />
                                                            <p>Upload speciality <br /> picture</p>
                                                        </div>
                                                        <div className="flex flex-col lg:flex-row items-start gap-10 text-gray-600">
                                                            <div className="w-full lg:flex-1 flex flex-col gap-4">
                                                                <div className="flex-1 flex flex-col gap-1">
                                                                    <p className="font-medium">Speciality Name</p>
                                                                    <input
                                                                        onChange={(e) => setName(e.target.value)}
                                                                        value={name}
                                                                        className="border rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-blue-400 transition-all"
                                                                        type="text"
                                                                        placeholder="Enter speciality name"
                                                                        required
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                                    {/* Cancel Button */}
                                    <button
                                        type="button"
                                        onClick={() => { setOpen(false); isEdit(false) }} // Close the dialog
                                        className="cursor-pointer inline-flex w-full justify-center items-center rounded-md bg-[#e5e7eb] px-4 py-2 text-lg font-semibold text-gray-900 shadow-sm hover:bg-gray-200 sm:ml-3 sm:w-auto transition-all">
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        onClick={() => { onSubmitHandler() }}
                                        className="cursor-pointer inline-flex w-full justify-center rounded-md bg-[#C0EB6A] px-6 py-2 text-white font-semibold text-lg shadow-md hover:bg-[#4e5bdb] sm:ml-3 sm:w-auto transition-all"
                                        disabled={loading}
                                    >
                                        Add Speciality
                                    </button>
                                </div>
                            </DialogPanel>
                        </div>
                    </div>
                </Dialog>
            </div>

            {/* Specialities List */}
            <div className="w-full max-w-7xl mx-auto my-10">
                <p className="mb-6 text-3xl font-semibold text-gray-800">All Specialties</p>
                <div className="max-w-screen bg-white border rounded-lg shadow-lg text-sm max-h-[80vh] overflow-y-scroll min-h-[60vh]">
                    <div className="hidden sm:grid grid-cols-[2fr_5fr_5fr_2fr] grid-flow-col py-4 px-6 border-b bg-gray-100 text-gray-700 font-semibold">
                        <p>#</p>
                        <p>Name</p>
                        <p>Image</p>
                        <p>Actions</p>
                    </div>
                    {specialities.map((item, index) => (
                        <div key={index} className="flex flex-wrap sm:grid sm:grid-cols-[2fr_5fr_5fr_2fr] justify-between items-center py-4 px-6 border-b hover:bg-gray-50 transition-colors duration-300 ease-in-out">
                            <p className="hidden sm:block text-gray-600">{index + 1}</p>

                            <div className="flex items-center gap-3">
                                {
                                    isEdit && currentEditId === item._id
                                        ? <input
                                            type="text"
                                            value={specialityData.name || ''}
                                            onChange={(e) => { setSpecialityData({ ...specialityData, name: e.target.value }); setName(specialityData.name) }}
                                            className="text-gray-800 font-medium bg-gray-200 p-1"
                                        />
                                        : <p className="text-gray-800 font-medium">{item.name}</p>
                                }
                            </div>

                            <div className="flex items-center gap-3">
                                {
                                    isEdit && currentEditId === item._id
                                        ? <label htmlFor="image">
                                            <div className="inline-block relative cursor-pointer">
                                                {/* Displaying the image or placeholder for file upload */}
                                                <img
                                                    className='w-36 h-36 rounded-full object-cover opacity-75 shadow-md'
                                                    src={image ? URL.createObjectURL(image) : specialityData.image}
                                                    alt=""
                                                />
                                                {/* Upload Icon inside the image container */}
                                                <img
                                                    className='w-10 h-10 absolute bottom-12 right-12 bg-gray-500 rounded-full text-white flex items-center justify-center'
                                                    src={image ? '' : assets.upload_icon}
                                                    alt=""
                                                />
                                            </div>
                                            {/* Hidden file input */}
                                            <input
                                                onChange={(e) => setImage(e.target.files[0])}
                                                type="file"
                                                id="image"
                                                hidden
                                                className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                        </label>
                                        : <img
                                            className="w-12 h-12 rounded-full bg-gray-200 shadow-md"
                                            src={item.image}
                                            alt={item.name}
                                        />
                                }

                            </div>

                            <div className="flex items-center justify-end gap-4">
                                {loading && (
                                    <LoadingComponent
                                        icon={<FaStethoscope className="text-[#C0EB6A] text-4xl mb-4 animate-bounce" />
                                        }
                                        message={isEdit ? "Update speciality..." : "Adding new speciality..."}
                                    />
                                )}
                                {
                                    isEdit && currentEditId === item._id
                                        ?
                                        <img onClick={() => editHandler(item._id, specialityData.name)} className="w-8 cursor-pointer" src={assets.save_icon} alt="" />
                                        : <>
                                            <img className='w-8 cursor-pointer' onClick={() => { setIsEdit(true); getSpecialityData(item._id) }} src={assets.edit_icon} alt="edit" />
                                            <img className='w-8 cursor-pointer' onClick={() => deleteHandler(item._id)} src={assets.delete_icon} alt="delete" />
                                        </>
                                }
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );

}

export default AddSpeciality
