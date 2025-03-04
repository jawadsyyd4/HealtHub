import specialityModel from "../models/specialityModel.js";
import { v2 as cloudinary } from "cloudinary";

const addSpeciality = async (req, res) => {
  try {
    const { name } = req.body;
    const imageFile = req.file;

    if (!name) {
      return res.json({ success: false, message: "Missing details" });
    }

    // upload image to cloudinary
    const imageUpload = cloudinary.uploader.upload(imageFile.path, {
      resource_type: "image",
    });

    const imageUrl = (await imageUpload).secure_url;

    const specialityData = {
      name,
      image: imageUrl,
    };

    const newSpeciality = new specialityModel(specialityData);
    await newSpeciality.save();

    res.json({ success: true, message: "Speciaity Added." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getSpecialities = async (req, res) => {
  try {
    const specialities = await specialityModel.find({});
    res.json({ success: true, specialities });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const deleteSpeciality = async (req, res) => {
  try {
    const { specialityId } = req.body;

    const speciality = await specialityModel.findByIdAndDelete(specialityId);

    if (!speciality) {
      return res.json({ success: false, message: "Speciality not found" });
    }

    res.json({ success: true, message: "Speciality deleted successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const updateSpeciality = async (req, res) => {
  try {
    const { specialityId } = req.query;
    const { name } = req.body; // Get the updated name from the request body
    const imageFile = req.file; // Get the uploaded image file from the request, if present

    // Find the speciality by ID
    const speciality = await specialityModel.findById(specialityId);

    // Check if the speciality exists
    if (!speciality) {
      return res.json({ success: false, message: "Speciality not found" });
    }

    // If a new image is uploaded, upload it to Cloudinary
    let imageUrl = speciality.image; // Use existing image if no new image is uploaded
    if (imageFile) {
      // Upload the new image to Cloudinary
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
        resource_type: "image",
      });
      imageUrl = imageUpload.secure_url; // Get the URL of the uploaded image
    }

    // Update the speciality fields
    speciality.name = name || speciality.name; // Update name if provided, else keep the existing name
    speciality.image = imageUrl; // Update image URL (even if not uploaded, it retains the old image)

    // Save the updated speciality
    await speciality.save();

    // Respond with success message
    res.json({ success: true, message: "Speciality updated successfully" });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

const getSpecialityById = async (req, res) => {
  try {
    const { id } = req.query; // Get ID from query parameters
    const specialityData = await specialityModel.findById(id).select("-_id");

    res.json({
      success: true,
      specialityData,
    });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

export {
  addSpeciality,
  getSpecialities,
  deleteSpeciality,
  updateSpeciality,
  getSpecialityById,
};
