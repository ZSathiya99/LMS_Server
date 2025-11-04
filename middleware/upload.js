import multer from "multer";
import path from "path";

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// File filter (optional)
const fileFilter = (req, file, cb) => {
  const allowed = [".xlsx", ".xls"];
  if (allowed.includes(path.extname(file.originalname))) cb(null, true);
  else cb(new Error("Only Excel files allowed!"));
};

export const upload = multer({ storage, fileFilter });
