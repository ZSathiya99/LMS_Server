import Material from "../models/Material.js";
import fs from "fs";
import path from "path";

// ================================
// ✅ POST (form-data)
// ================================
export const createMaterial = async (req, res) => {
  try {
    const staffId = req.user.facultyId;

    const { subjectId, title, instruction, link, youtubeLink } = req.body;

    if (!subjectId || !title) {
      return res.status(400).json({
        message: "subjectId and title are required",
      });
    }

    const attachments = req.files
      ? req.files.map((file) => file.filename)
      : [];

    const material = await Material.create({
      subjectId,
      staffId,
      title,
      instruction,
      link,
      youtubeLink,
      attachments,
    });

    res.status(201).json({
      message: "Material created successfully",
      data: material,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================================
// ✅ GET ALL
// ================================
export const getMaterials = async (req, res) => {
  try {
    const { subjectId } = req.params;

    const materials = await Material.find({ subjectId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      total: materials.length,
      data: materials,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================================
// ✅ GET SINGLE
// ================================
export const getSingleMaterial = async (req, res) => {
  try {
    const { materialId } = req.params;

    const material = await Material.findById(materialId);

    if (!material) {
      return res.status(404).json({ message: "Material not found" });
    }

    res.status(200).json({ data: material });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================================
// ✅ PUT (form-data)
// ================================
export const updateMaterial = async (req, res) => {
  try {
    const { materialId } = req.params;
    const staffId = req.user.facultyId;

    const material = await Material.findById(materialId);

    if (!material) {
      return res.status(404).json({ message: "Material not found" });
    }

    if (material.staffId.toString() !== staffId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const { title, instruction, link, youtubeLink } = req.body;

    if (title) material.title = title;
    if (instruction) material.instruction = instruction;
    if (link !== undefined) material.link = link;
    if (youtubeLink !== undefined) material.youtubeLink = youtubeLink;

    // Replace attachments if new uploaded
    if (req.files && req.files.length > 0) {
      material.attachments = req.files.map((file) => file.filename);
    }

    await material.save();

    res.status(200).json({
      message: "Material updated successfully",
      data: material,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================================
// ✅ DELETE
// ================================
export const deleteMaterial = async (req, res) => {
  try {
    const { materialId } = req.params;
    const staffId = req.user.facultyId;

    const material = await Material.findById(materialId);

    if (!material) {
      return res.status(404).json({ message: "Material not found" });
    }

    if (material.staffId.toString() !== staffId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // delete files from uploads folder
    material.attachments.forEach((file) => {
      const filePath = path.join("uploads", file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    await Material.findByIdAndDelete(materialId);

    res.status(200).json({
      message: "Material deleted successfully",
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
