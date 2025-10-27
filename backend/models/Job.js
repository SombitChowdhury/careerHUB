const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a job title'],
        trim: true
    },
    company: {
        type: String,
        required: [true, 'Please add a company name']
    },
    location: {
        type: String,
        required: [true, 'Please add a location']
    },
    type: {
        type: String,
        enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'],
        required: true
    },
    experience: {
        type: String,
        enum: ['Entry Level', 'Mid Level', 'Senior Level'],
        required: true
    },
    salary: {
        min: Number,
        max: Number,
        currency: {
            type: String,
            default: 'USD'
        }
    },
    salaryRange: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Technology', 'Marketing', 'Finance', 'Healthcare', 'Design', 'Sales', 'Other']
    },
    description: {
        type: String,
        required: [true, 'Please add a job description']
    },
    requirements: {
        type: String,
        required: [true, 'Please add job requirements']
    },
    skills: [String],
    benefits: [String],
    applicationDeadline: Date,
    isActive: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    employer: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    applications: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Application'
    }]
}, {
    timestamps: true
});

// Create index for search functionality
jobSchema.index({ title: 'text', description: 'text', company: 'text' });

module.exports = mongoose.model('Job', jobSchema);