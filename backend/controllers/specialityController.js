import doctorModel from "../models/doctorModel.js";
import specialityModel from "../models/specialityModel.js";
import { v2 as cloudinary } from "cloudinary";

const addSpeciality = async (req, res) => {
  try {
    const { name, description } = req.body; // Destructure description from the body
    const imageFile = req.file;

    // Check if name and description are provided
    if (!name || !description) {
      return res.json({ success: false, message: "Missing details" });
    }

    // Upload image to cloudinary
    const imageUpload = cloudinary.uploader.upload(imageFile.path, {
      resource_type: "image",
    });

    const imageUrl = (await imageUpload).secure_url;

    // Create a new speciality object with name, image, and description
    const specialityData = {
      name,
      image: imageUrl,
      description, // Include description
    };

    const newSpeciality = new specialityModel(specialityData);
    await newSpeciality.save();

    res.json({ success: true, message: "Specialty Added." });
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

    // Check if the speciality exists
    const specialityToDelete = await specialityModel.findById(specialityId);

    if (!specialityToDelete) {
      return res.json({ success: false, message: "Speciality not found" });
    }

    // Delete all doctors associated with this speciality
    const { deletedCount } = await doctorModel.deleteMany({
      speciality: specialityId,
    });

    // Delete the speciality itself
    await specialityModel.findByIdAndDelete(specialityId);

    res.json({
      success: true,
      message: `Speciality "${specialityToDelete.name}" and ${deletedCount} associated doctor(s) deleted successfully.`,
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

const updateSpeciality = async (req, res) => {
  try {
    const { specialityId } = req.query;
    const { name, description } = req.body; // Get the updated name and description from the request body
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
    speciality.description = description || speciality.description; // Update description if provided, else keep the existing description
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
