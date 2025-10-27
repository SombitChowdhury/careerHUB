const express = require('express');
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/resumes/');
    },
    filename: function (req, file, cb) {
        // Create unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'resume-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    // Allow only pdf, doc, docx files
    if (file.mimetype === 'application/pdf' || 
        file.mimetype === 'application/msword' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF, DOC, and DOCX files are allowed'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter
});

// @desc    Upload resume
// @route   POST /api/resumes/upload
// @access  Private
router.post('/upload', protect, upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a file'
            });
        }

        // Update user's resume information
        const user = await User.findByIdAndUpdate(req.user.id, {
            resume: {
                filename: req.file.filename,
                originalName: req.file.originalname,
                path: req.file.path,
                uploadedAt: new Date()
            }
        }, { new: true });

        res.status(200).json({
            success: true,
            message: 'Resume uploaded successfully',
            data: {
                filename: req.file.filename,
                originalName: req.file.originalname,
                path: req.file.path,
                size: req.file.size,
                uploadedAt: new Date()
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// @desc    Get user's resume
// @route   GET /api/resumes/my-resume
// @access  Private
router.get('/my-resume', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user.resume || !user.resume.filename) {
            return res.status(404).json({
                success: false,
                message: 'No resume found'
            });
        }

        res.status(200).json({
            success: true,
            data: user.resume
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// @desc    Download resume
// @route   GET /api/resumes/download/:filename
// @access  Private
router.get('/download/:filename', protect, async (req, res) => {
    try {
        const filePath = path.join(__dirname, '../uploads/resumes/', req.params.filename);
        
        res.download(filePath, (err) => {
            if (err) {
                res.status(404).json({
                    success: false,
                    message: 'File not found'
                });
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// @desc    Delete resume
// @route   DELETE /api/resumes/delete
// @access  Private
router.delete('/delete', protect, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.user.id, {
            $unset: { resume: 1 }
        }, { new: true });

        res.status(200).json({
            success: true,
            message: 'Resume deleted successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;