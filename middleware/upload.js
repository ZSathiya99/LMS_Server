import multer from "multer";
import fs from "fs";
import path from "path";

// 🗂 Create upload folders if not exist
const baseUploadDir = "uploads";
const subjectUploadDir = path.join(baseUploadDir, "subjects");

if (!fs.existsSync(baseUploadDir)) fs.mkdirSync(baseUploadDir);
if (!fs.existsSync(subjectUploadDir)) fs.mkdirSync(subjectUploadDir);

// 🧱 Common storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // If Excel upload, save in uploads/subjects
    if (
      file.mimetype === "application/vnd.ms-excel" ||
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      cb(null, subjectUploadDir);
    } else {
      cb(null, baseUploadDir); // PDFs, images, etc.
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

// ✅ 1️⃣ Excel upload (for subjects)
const excelFileFilter = (req, file, cb) => {
  if (
    file.mimetype === "application/vnd.ms-excel" ||
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only Excel files are allowed!"), false);
  }
};

export const uploadExcel = multer({
  storage,
  fileFilter: excelFileFilter,
});

// ✅ 2️⃣ Document upload (for faculty PDFs, images)
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
