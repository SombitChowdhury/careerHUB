const express = require('express');
const Application = require('../models/Application');
const Job = require('../models/Job');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Apply for a job
// @route   POST /api/applications
// @access  Private (Job Seekers)
router.post('/', protect, async (req, res) => {
    try {
        const { jobId, coverLetter } = req.body;

        // Check if job exists
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        // Check if user has already applied
        const existingApplication = await Application.findOne({
            job: jobId,
            applicant: req.user.id
        });

        if (existingApplication) {
            return res.status(400).json({
                success: false,
                message: 'You have already applied for this job'
            });
        }

        // Create application
        const application = await Application.create({
            job: jobId,
            applicant: req.user.id,
            coverLetter,
            resume: req.user.resume // Assuming user has resume uploaded
        });

        // Add application to job
        job.applications.push(application._id);
        await job.save();

        await application.populate('job', 'title company');
        await application.populate('applicant', 'name email');

        res.status(201).json({
            success: true,
            data: application
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// @desc    Get user's applications
// @route   GET /api/applications/my-applications
// @access  Private (Job Seekers)
router.get('/my-applications', protect, async (req, res) => {
    try {
        const applications = await Application.find({ applicant: req.user.id })
            .populate('job', 'title company location type salaryRange')
            .sort('-appliedAt');

        res.status(200).json({
            success: true,
            count: applications.length,
            data: applications
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// @desc    Get applications for a job (Employer)
// @route   GET /api/applications/job/:jobId
// @access  Private (Job Owner)
router.get('/job/:jobId', protect, async (req, res) => {
    try {
        const job = await Job.findById(req.params.jobId);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        // Check if user is job owner
        if (job.employer.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view applications for this job'
            });
        }

        const applications = await Application.find({ job: req.params.jobId })
            .populate('applicant', 'name email profile')
            .sort('-appliedAt');

        res.status(200).json({
            success: true,
            count: applications.length,
            data: applications
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// @desc    Update application status
// @route   PUT /api/applications/:id/status
// @access  Private (Job Owner)
router.put('/:id/status', protect, async (req, res) => {
    try {
        const { status } = req.body;
        
        const application = await Application.findById(req.params.id)
            .populate('job');

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        // Check if user is job owner
        if (application.job.employer.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this application'
            });
        }

        application.status = status;
        await application.save();

        res.status(200).json({
            success: true,
            data: application
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;