import multer from "multer";
import fs from "fs";

const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Common storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

// ✅ 1️⃣ For Excel files only (used in bulk upload)
const excelFileFilter = (req, file, cb) => {
  if (
    file.mimetype === "application/vnd.ms-excel" ||
    file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only Excel files allowed!"), false);
  }
};

export const uploadExcel = multer({
  storage,
  fileFilter: excelFileFilter,
});

// ✅ 2️⃣ For faculty documents (PDF, images, etc.)
const documentFileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/jpg",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF or image files allowed!"), false);
  }
};

export const uploadDocuments = multer({
  storage,
  fileFilter: documentFileFilter,
});
