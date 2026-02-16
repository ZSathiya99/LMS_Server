import mongoose from 'mongoose';
import Material from '../models/Material.js';

/* =====================================================
   CREATE MATERIAL
===================================================== */
export const createMaterial = async (req, res) => {
  try {
    const { subjectId, sectionId, title, instruction, link, youtubeLink } =
      req.body;

    const staffId = req.user.facultyId;

    if (!subjectId || !sectionId || !title) {
      return res.status(400).json({
        message: 'Subject ID, Section ID and title are required'
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(subjectId) ||
      !mongoose.Types.ObjectId.isValid(sectionId)
    ) {
      return res.status(400).json({
        message: 'Invalid Subject ID or Section ID'
      });
    }

    const uploadedFiles =
      req.files?.map(
        (file) =>
          `${req.protocol}://${req.get('host')}/uploads/${file.filename}`
      ) || [];

    const material = await Material.create({
      subjectId,
      sectionId, // 🔥 added
      staffId,
      title,
      instruction: instruction || '',
      attachments: uploadedFiles,
      link: link || '',
      youtubeLink: youtubeLink || '',
      comments: []
    });

    return res.status(201).json({
      message: 'Material created successfully',
      data: material
    });
  } catch (error) {
    console.error('Create Material Error:', error);
    return res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   GET MATERIALS BY SUBJECT
===================================================== */
export const getMaterialsBySubject = async (req, res) => {
  try {
    const { subjectId, sectionId } = req.params;
    const staffId = req.user.facultyId;

    if (
      !mongoose.Types.ObjectId.isValid(subjectId) ||
      !mongoose.Types.ObjectId.isValid(sectionId)
    ) {
      return res.status(400).json({ message: 'Invalid ID provided' });
    }

    const materials = await Material.find({
      subjectId,
      sectionId,
      staffId // 🔥 prevents other staff collision
    }).sort({ createdAt: -1 });

    const formattedMaterials = materials.map((material) => ({
      ...material.toObject(),
      key: 'Material'
    }));

    return res.status(200).json({
      total: formattedMaterials.length,
      data: formattedMaterials
    });
  } catch (error) {
    console.error('Get Materials Error:', error);
    return res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   GET SINGLE MATERIAL
===================================================== */
export const getSingleMaterial = async (req, res) => {
  try {
    const { materialId } = req.params;
    const staffId = req.user.facultyId;

    if (!mongoose.Types.ObjectId.isValid(materialId)) {
      return res.status(400).json({ message: 'Invalid Material ID' });
    }

    const material = await Material.findOne({
      _id: materialId,
      staffId // 🔥 prevent cross access
    });

    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    return res.status(200).json(material);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   UPDATE MATERIAL
===================================================== */
export const updateMaterial = async (req, res) => {
  try {
    const { materialId } = req.params;
    const staffId = req.user.facultyId;

    if (!mongoose.Types.ObjectId.isValid(materialId)) {
      return res.status(400).json({ message: 'Invalid Material ID' });
    }

    const updated = await Material.findOneAndUpdate(
      { _id: materialId, staffId }, // 🔥 protect section
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Material not found' });
    }

    return res.status(200).json({
      message: 'Material updated successfully',
      data: updated
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   DELETE MATERIAL
===================================================== */
export const deleteMaterial = async (req, res) => {
  try {
    const { materialId } = req.params;
    const staffId = req.user.facultyId;

    if (!mongoose.Types.ObjectId.isValid(materialId)) {
      return res.status(400).json({ message: 'Invalid Material ID' });
    }

    const deleted = await Material.findOneAndDelete({
      _id: materialId,
      staffId
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Material not found' });
    }

    return res.status(200).json({
      message: 'Material deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   ADD COMMENT
===================================================== */
export const addMaterialComment = async (req, res) => {
  try {
    const { materialId } = req.params;
    const { comment } = req.body;

    if (!comment) {
      return res.status(400).json({ message: 'Comment required' });
    }

    const material = await Material.findById(materialId);
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    material.comments.push({
      userId:
        req.user.role === 'faculty' ? req.user.facultyId : req.user.studentId,
      userType: req.user.role === 'faculty' ? 'staff' : 'student',
      comment
    });

    await material.save();

    return res.status(201).json({
      message: 'Comment added successfully',
      comments: material.comments
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   EDIT COMMENT
===================================================== */
export const editMaterialComment = async (req, res) => {
  try {
    const { materialId, commentId } = req.params;
    const { comment } = req.body;

    const material = await Material.findById(materialId);
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    const existingComment = material.comments.id(commentId);
    if (!existingComment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    existingComment.comment = comment;
    await material.save();

    return res.status(200).json({
      message: 'Comment updated successfully',
      comments: material.comments
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   DELETE COMMENT
===================================================== */
export const deleteMaterialComment = async (req, res) => {
  try {
    const { materialId, commentId } = req.params;

    const material = await Material.findById(materialId);
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    const comment = material.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    comment.deleteOne();
    await material.save();

    return res.status(200).json({
      message: 'Comment deleted successfully',
      comments: material.comments
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
