import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res
        .status(401)
        .json({ message: 'No token provided or invalid format' });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // console.log("Decoded Token:", decoded);

    req.user = decoded; // { id, facultyId, role }

    next();
  } catch (error) {
    console.error('❌ Token validation error:', error.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
