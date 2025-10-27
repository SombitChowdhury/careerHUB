const mongoose = require('mongoose');
const Job = require('./models/Job');
const User = require('./models/User');
require('dotenv').config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB for seeding...');

        // Clear existing data
        await Job.deleteMany();
        console.log('🗑️  Cleared existing jobs');

        // Create sample employer
        let employer = await User.findOne({ email: 'hr@techcorp.com' });
        if (!employer) {
            employer = await User.create({
                name: 'TechCorp HR',
                email: 'hr@techcorp.com',
                password: 'password123',
                role: 'employer'
            });
            console.log('👤 Created sample employer');
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
                requirements: "3+ years of experience with React, JavaScript, and modern frontend technologies. Strong understanding of responsive design and web performance optimization.",
                skills: ["JavaScript", "React", "CSS", "HTML", "TypeScript", "Redux"],
                benefits: ["Health Insurance", "Remote Work", "Flexible Hours", "Stock Options"],
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
                description: "Join our data science team to analyze complex datasets and build predictive models that drive business decisions. Work with large-scale data and machine learning algorithms.",
                requirements: "5+ years of experience in data science and machine learning. Proficiency in Python, SQL, and statistical analysis. Experience with ML frameworks like TensorFlow or PyTorch.",
                skills: ["Python", "Machine Learning", "SQL", "Statistics", "TensorFlow", "Data Analysis"],
                benefits: ["Health Insurance", "Stock Options", "Learning Budget", "Remote First"],
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
                description: "We're seeking a talented UX/UI Designer to create beautiful and intuitive user experiences for our digital products. You'll conduct user research and design high-fidelity prototypes.",
                requirements: "3+ years of UX/UI design experience. Proficiency in Figma, Sketch, or Adobe XD. Strong portfolio demonstrating user-centered design principles.",
                skills: ["Figma", "UI/UX Design", "User Research", "Wireframing", "Prototyping"],
                benefits: ["Health Insurance", "Creative Freedom", "Professional Development", "Flexible Schedule"],
                employer: employer._id
            },
            {
                title: "Backend Engineer",
                company: "ServerStack Technologies",
                location: "Austin, TX",
                type: "Full-time",
                experience: "Senior Level",
                salaryRange: "$100,000 - $140,000",
                category: "Technology",
                description: "Looking for an experienced Backend Engineer to design and implement scalable server-side applications. You'll work with Node.js, Python, and cloud platforms.",
                requirements: "5+ years of backend development experience. Strong knowledge of REST APIs, databases, and cloud infrastructure. Experience with microservices architecture.",
                skills: ["Node.js", "Python", "MongoDB", "AWS", "Docker", "REST APIs"],
                benefits: ["Health Insurance", "Remote Options", "Conference Budget", "Equity"],
                employer: employer._id
            },
            {
                title: "Marketing Manager",
                company: "GrowthHackers Co.",
                location: "Chicago, IL",
                type: "Full-time",
                experience: "Mid Level",
                salaryRange: "$70,000 - $90,000",
                category: "Marketing",
                description: "We need a Marketing Manager to develop and execute marketing strategies that drive customer acquisition and brand awareness. You'll manage digital campaigns and analytics.",
                requirements: "3+ years of marketing experience. Knowledge of digital marketing channels, SEO, and analytics tools. Strong communication and analytical skills.",
                skills: ["Digital Marketing", "SEO", "Google Analytics", "Content Strategy", "Social Media"],
                benefits: ["Health Insurance", "Performance Bonuses", "Learning Stipend", "Flexible PTO"],
                employer: employer._id
            },
            {
                title: "DevOps Engineer",
                company: "CloudFirst Solutions",
                location: "Remote",
                type: "Full-time",
                experience: "Senior Level",
                salaryRange: "$95,000 - $130,000",
                category: "Technology",
                description: "Join our DevOps team to build and maintain our cloud infrastructure and CI/CD pipelines. You'll work with Docker, Kubernetes, and infrastructure-as-code tools.",
                requirements: "4+ years of DevOps experience. Proficiency with cloud platforms (AWS/Azure/GCP), containerization, and CI/CD pipelines. Strong scripting skills.",
                skills: ["Docker", "Kubernetes", "AWS", "CI/CD", "Terraform", "Linux"],
                benefits: ["Health Insurance", "Remote Work", "Home Office Stipend", "Unlimited PTO"],
                employer: employer._id
            }
        ];

        await Job.create(sampleJobs);
        console.log(`✅ Created ${sampleJobs.length} sample jobs`);

        console.log('\n🎉 Sample data created successfully!');
        console.log('📊 You can now view jobs at: http://localhost:5000/api/jobs');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
};

seedData();