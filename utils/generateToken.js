import jwt from "jsonwebtoken";

const generateToken = (id, role, name, email, department) => {
  return jwt.sign(
    { id, role, name, email, department },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};

export default generateToken;
