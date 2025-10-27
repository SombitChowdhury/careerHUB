const express = require('express');
const Job = require('../models/Job');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all jobs
// @route   GET /api/jobs
// @access  Public
router.get('/', async (req, res) => {
    try {
        // Filtering
        let query = { isActive: true };
        
        // Search by keyword
        if (req.query.keyword) {
            query.$text = { $search: req.query.keyword };
        }
        
        // Filter by category
        if (req.query.category) {
            query.category = req.query.category;
        }
        
        // Filter by location
        if (req.query.location) {
            query.location = new RegExp(req.query.location, 'i');
        }
        
        // Filter by type
        if (req.query.type) {
            query.type = req.query.type;
        }
        
        // Filter by experience
        if (req.query.experience) {
            query.experience = req.query.experience;
        }

        // Sorting
        let sortBy = '-createdAt';
        if (req.query.sort) {
            const sortFields = {
                'newest': '-createdAt',
                'oldest': 'createdAt',
                'salary-high': '-salary.max',
                'salary-low': 'salary.min'
            };
            sortBy = sortFields[req.query.sort] || '-createdAt';
        }

        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;

        const jobs = await Job.find(query)
            .populate('employer', 'name email')
            .sort(sortBy)
            .limit(limit)
            .skip(startIndex);

        // Get total count for pagination
        const total = await Job.countDocuments(query);

        res.status(200).json({
            success: true,
            count: jobs.length,
            total,
            pagination: {
                page,
                pages: Math.ceil(total / limit)
            },
            data: jobs
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const job = await Job.findById(req.params.id).populate('employer', 'name email profile');

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        res.status(200).json({
            success: true,
            data: job
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// @desc    Create new job
// @route   POST /api/jobs
// @access  Private (Employers)
router.post('/', protect, authorize('employer'), async (req, res) => {
    try {
        // Add employer to req.body
        req.body.employer = req.user.id;

        const job = await Job.create(req.body);

        res.status(201).json({
            success: true,
            data: job
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private (Job Owner)
router.put('/:id', protect, async (req, res) => {
    try {
        let job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        // Check if user is job owner
        if (job.employer.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this job'
            });
        }

        job = await Job.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: job
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private (Job Owner)
router.delete('/:id', protect, async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        // Check if user is job owner
        if (job.employer.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this job'
            });
        }

        await Job.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Job deleted successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// @desc    Get jobs by employer
// @route   GET /api/jobs/employer/my-jobs
// @access  Private (Employers)
router.get('/employer/my-jobs', protect, authorize('employer'), async (req, res) => {
    try {
        const jobs = await Job.find({ employer: req.user.id });

        res.status(200).json({
            success: true,
            count: jobs.length,
            data: jobs
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;