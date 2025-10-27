const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use(limiter);

// Simple MongoDB connection
const connectDB = async () => {
    try {
        console.log('🔄 Connecting to MongoDB Atlas...');
        
        const conn = await mongoose.connect(process.env.MONGODB_URI);

        console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
        console.log(`📊 Database: ${conn.connection.name}`);
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        process.exit(1);
    }
};

// Check database for sample data
const checkSampleData = async () => {
    try {
        const Job = require('./models/Job');
        const jobCount = await Job.countDocuments();
        
        if (jobCount === 0) {
            console.log('📝 No jobs found in database.');
            console.log('💡 To add sample jobs, run: node seedData.js');
            console.log('💡 Or register as employer and create jobs through the API');
        } else {
            console.log(`📊 Found ${jobCount} jobs in database`);
        }
    } catch (error) {
        console.log('⚠️ Could not check job count - models might not be loaded yet');
    }
};

// Add sample data endpoint (for testing)
app.post('/api/seed-data', async (req, res) => {
    try {
        const Job = require('./models/Job');
        const User = require('./models/User');
        
        // Clear existing data
        await Job.deleteMany();
        
        // Create sample employer if not exists
        let employer = await User.findOne({ email: 'hr@techcorp.com' });
        if (!employer) {
            employer = await User.create({
                name: 'TechCorp HR',
                email: 'hr@techcorp.com',
                password: 'password123',
                role: 'employer'
            });
        }

        // Create sample jobs
        const sampleJobs = [
            {
                title: "Frontend Developer",
                company: "TechCorp Inc.",
                location: "San Francisco, CA",
                type: "Full-time",
                experience: "Mid Level",
                salaryRange: "$90,000 - $120,000",
                category: "Technology",
                description: "We are looking for a skilled Frontend Developer to join our team. You will be responsible for building user interfaces and implementing design systems using React, JavaScript, and modern CSS.",
                requirements: "3+ years of experience with React, JavaScript, and modern frontend technologies.",
                skills: ["JavaScript", "React", "CSS", "HTML", "TypeScript"],
                benefits: ["Health Insurance", "Remote Work", "Flexible Hours"],
                employer: employer._id
            },
            {
                title: "Data Scientist",
                company: "DataInsights LLC",
                location: "Remote",
                type: "Full-time",
                experience: "Senior Level",
                salaryRange: "$110,000 - $150,000",
                category: "Technology",
                description: "Join our data science team to analyze complex datasets and build predictive models that drive business decisions.",
                requirements: "5+ years of experience in data science and machine learning.",
                skills: ["Python", "Machine Learning", "SQL", "Statistics"],
                benefits: ["Health Insurance", "Stock Options", "Learning Budget"],
                employer: employer._id
            },
            {
                title: "UX/UI Designer",
                company: "CreativeMinds Studio",
                location: "New York, NY",
                type: "Full-time",
                experience: "Mid Level",
                salaryRange: "$80,000 - $100,000",
                category: "Design",
                description: "We're seeking a talented UX/UI Designer to create beautiful and intuitive user experiences for our digital products.",
                requirements: "3+ years of UX/UI design experience. Proficiency in Figma, Sketch, or Adobe XD.",
                skills: ["Figma", "UI/UX Design", "User Research", "Wireframing"],
                benefits: ["Health Insurance", "Creative Freedom", "Professional Development"],
                employer: employer._id
            }
        ];

        await Job.create(sampleJobs);
        
        res.json({
            success: true,
            message: `Created ${sampleJobs.length} sample jobs successfully!`,
            jobsCount: sampleJobs.length
        });
    } catch (error) {
        console.error('Seed data error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create sample data',
            error: error.message
        });
    }
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/resumes', require('./routes/resumes'));

// Test route
app.get('/api/test', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({ 
        success: true,
        message: 'Job Portal API is working!',
        database: {
            status: dbStatus,
            cluster: 'Cluster2'
        },
        timestamp: new Date().toISOString()
    });
});

// Enhanced health check with job count
app.get('/api/health', async (req, res) => {
    try {
        const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
        
        let jobCount = 0;
        if (dbStatus === 'connected') {
            const Job = require('./models/Job');
            jobCount = await Job.countDocuments();
        }

        res.json({
            status: 'OK',
            database: dbStatus,
            jobsInDatabase: jobCount,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.json({
            status: 'OK',
            database: 'connected',
            jobsInDatabase: 'unknown',
            timestamp: new Date().toISOString()
        });
    }
});

// Get job count endpoint
app.get('/api/jobs-count', async (req, res) => {
    try {
        const Job = require('./models/Job');
        const count = await Job.countDocuments();
        res.json({
            success: true,
            count: count
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get job count'
        });
    }
});

// Error handling
app.use((err, req, res, next) => {
    console.error('🚨 Error:', err.stack);
    res.status(500).json({ 
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ 
        success: false,
        message: 'Route not found',
        availableEndpoints: [
            'GET  /api/health',
            'GET  /api/test',
            'GET  /api/jobs',
            'GET  /api/jobs-count',
            'POST /api/seed-data',
            'POST /api/auth/register',
            'POST /api/auth/login',
            'POST /api/applications',
            'POST /api/resumes/upload'
        ]
    });
});

const PORT = process.env.PORT || 5000;

// Connect to database and start server
connectDB().then(() => {
    // Check for sample data after a short delay
    setTimeout(() => {
        checkSampleData();
    }, 2000);

    app.listen(PORT, () => {
        console.log(`\n🎉 Job Portal Backend Started Successfully!`);
        console.log(`=========================================`);
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📊 Environment: ${process.env.NODE_ENV}`);
        console.log(`🗄️ Database: MongoDB Atlas - Cluster2`);
        console.log(`📍 API URL: http://localhost:${PORT}/api`);
        console.log(`🔍 Health Check: http://localhost:${PORT}/api/health`);
        console.log(`🧪 Test API: http://localhost:${PORT}/api/test`);
        console.log(`📊 Check Jobs: http://localhost:${PORT}/api/jobs`);
        console.log(`🌱 Add Sample Data: POST http://localhost:${PORT}/api/seed-data`);
        console.log(`=========================================\n`);
    });
});