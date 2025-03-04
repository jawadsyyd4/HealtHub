import jwt from "jsonwebtoken";

// Doctor auth middleware
const authDoctor = async (req, res, next) => {
  try {
    const { dtoken } = req.headers;

    if (!dtoken) {
      return res.json({
        success: false,
        message: "Not authorized Login again",
      });
    }

    const token_decode = await jwt.verify(dtoken, process.env.JWT_SECRET);

    req.body.doctorId = token_decode.id;

    next();
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export default authDoctor;
