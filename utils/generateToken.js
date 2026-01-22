import jwt from "jsonwebtoken";

const generateToken = (id, role, name, email,facultyId, department,) => {
  return jwt.sign(
    { id, role, name, email,facultyId, department },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};

export default generateToken;
