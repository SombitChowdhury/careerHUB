// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Enhanced job data (fallback if backend is down)
const localJobs = [
    {
        id: 1,
        title: "Frontend Developer",
        company: "TechCorp Inc.",
        location: "San Francisco, CA",
        type: "Full-time",
        experience: "Mid Level",
        salary: "$90,000 - $120,000",
        category: "Technology",
        description: "We are looking for a skilled Frontend Developer to join our team. You will be responsible for building user interfaces and implementing design systems.",
        posted: "2 days ago",
        skills: ["JavaScript", "React", "CSS", "HTML"],
        benefits: ["Health Insurance", "Remote Work", "Flexible Hours"]
    },
    {
        id: 2,
        title: "Data Scientist",
        company: "DataInsights LLC",
        location: "Remote",
        type: "Full-time",
        experience: "Senior Level",
        salary: "$110,000 - $150,000",
        category: "Technology",
        description: "Join our data science team to analyze complex datasets and build predictive models that drive business decisions.",
        posted: "1 week ago",
        skills: ["Python", "Machine Learning", "SQL", "Statistics"],
        benefits: ["Health Insurance", "Stock Options", "Learning Budget"]
    }
];

// ==================== AUTHENTICATION FUNCTIONS ====================

function showLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
}

function showRegisterModal() {
    document.getElementById('registerModal').style.display = 'block';
}

function closeModals() {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('registerModal').style.display = 'none';
}

function updateAuthUI() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    const authButtons = document.querySelector('.auth-buttons');
    
    if (token && user.name) {
        authButtons.innerHTML = `
            <div class="user-menu">
                <span>Welcome, ${user.name}</span>
                <button class="btn btn-outline" id="logoutBtn">Logout</button>
            </div>
        `;
        
        document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    } else {
        authButtons.innerHTML = `
            <a href="#" class="btn btn-outline" id="loginBtn">Login</a>
            <a href="#" class="btn btn-primary" id="registerBtn">Register</a>
        `;
        
        // Re-attach event listeners
        document.getElementById('loginBtn').addEventListener('click', (e) => {
            e.preventDefault();
            showLoginModal();
        });
        document.getElementById('registerBtn').addEventListener('click', (e) => {
            e.preventDefault();
            showRegisterModal();
        });
    }
}

function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    updateAuthUI();
    showNotification('Logged out successfully', 'success');
}

function showNotification(message, type = 'info') {
    // Remove existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button class="close-notification"><i class="fas fa-times"></i></button>
    `;

    document.body.appendChild(notification);

    const closeBtn = notification.querySelector('.close-notification');
    closeBtn.addEventListener('click', () => notification.remove());

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// ==================== MODAL EVENT HANDLERS ====================

function setupModalEvents() {
    // Close buttons
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', closeModals);
    });

    // Switch between login/register
    document.getElementById('showRegister').addEventListener('click', (e) => {
        e.preventDefault();
        closeModals();
        showRegisterModal();
    });

    document.getElementById('showLogin').addEventListener('click', (e) => {
        e.preventDefault();
        closeModals();
        showLoginModal();
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModals();
        }
    });

    // Login form submission
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        const result = await loginUser({ email, password });
        
        if (result.success) {
            closeModals();
            updateAuthUI();
            showNotification('Login successful!', 'success');
            document.getElementById('loginForm').reset();
        } else {
            showNotification(result.message, 'error');
        }
    });

    // Register form submission
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const role = document.getElementById('registerRole').value;

        if (!role) {
            showNotification('Please select a role', 'error');
            return;
        }

        const result = await registerUser({ name, email, password, role });
        
        if (result.success) {
            closeModals();
            updateAuthUI();
            showNotification('Registration successful!', 'success');
            document.getElementById('registerForm').reset();
        } else {
            showNotification(result.message, 'error');
        }
    });
}

// ==================== RESUME UPLOAD FUNCTIONALITY ====================

function setupResumeUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const resumeInput = document.getElementById('resumeInput');
    const browseBtn = document.getElementById('browseBtn');

    // Click on upload area or browse button
    uploadArea.addEventListener('click', () => resumeInput.click());
    browseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        resumeInput.click();
    });

    // Drag and drop functionality
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('active');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('active');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('active');
        if (e.dataTransfer.files.length > 0) {
            handleResumeUpload(e.dataTransfer.files[0]);
        }
    });

    // File input change
    resumeInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleResumeUpload(e.target.files[0]);
        }
    });
}

async function handleResumeUpload(file) {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('Please login to upload resume', 'warning');
        showLoginModal();
        return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
        showNotification('Please upload a PDF, DOC, or DOCX file', 'error');
        return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
        showNotification('File size exceeds 5MB limit', 'error');
        return;
    }

    try {
        showNotification('Uploading resume...', 'info');
        
        const result = await uploadResumeToBackend(file);
        
        if (result.success) {
            showNotification('Resume uploaded successfully!', 'success');
            addUploadedFile(file, result.data);
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        showNotification('Upload failed. Please try again.', 'error');
        console.error('Upload error:', error);
    }
}

function addUploadedFile(file, uploadData = null) {
    const uploadedFiles = document.getElementById('uploadedFiles');
    
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.innerHTML = `
        <div class="file-info">
            <i class="fas fa-file-pdf file-icon"></i>
            <div class="file-details">
                <h4>${file.name}</h4>
                <p>${(file.size / 1024 / 1024).toFixed(2)} MB • Uploaded just now</p>
            </div>
        </div>
        <div class="file-actions">
            <button class="delete-btn"><i class="fas fa-trash"></i></button>
        </div>
    `;

    const deleteBtn = fileItem.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => {
        fileItem.remove();
        showNotification('Resume removed', 'success');
    });

    uploadedFiles.appendChild(fileItem);
}

// ==================== CORE APPLICATION FUNCTIONS ====================

// Test backend connection
async function testBackend() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const data = await response.json();
        console.log('✅ Backend connection:', data);
        return true;
    } catch (error) {
        console.error('❌ Backend connection failed:', error);
        return false;
    }
}

// Load jobs from backend API
async function loadJobsFromBackend(filters = {}) {
    try {
        const queryParams = new URLSearchParams(filters).toString();
        const response = await fetch(`${API_BASE_URL}/jobs?${queryParams}`);
        const result = await response.json();
        
        if (result.success) {
            console.log(`✅ Loaded ${result.data.length} jobs from backend`);
            return result.data;
        } else {
            console.error('Error loading jobs:', result.message);
            return localJobs; // Fallback to local data
        }
    } catch (error) {
        console.error('Failed to load jobs from backend, using local data:', error);
        return localJobs; // Fallback to local data
    }
}

// Function to display jobs
async function displayJobs(jobsToShow = null) {
    const jobListings = document.getElementById('jobListings');
    jobListings.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i><p>Loading jobs...</p></div>';
    
    try {
        // If no jobs provided, load from backend
        const jobs = jobsToShow || await loadJobsFromBackend();
        
        jobListings.innerHTML = '';
        
        if (jobs.length === 0) {
            jobListings.innerHTML = `
                <div class="no-jobs">
                    <i class="fas fa-search"></i>
                    <h3>No jobs available</h3>
                    <p>Check back later for new job postings</p>
                </div>
            `;
            return;
        }
        
        jobs.forEach(job => {
            const jobCard = document.createElement('div');
            jobCard.className = 'job-card';
            jobCard.innerHTML = createJobCardHTML(job);
            jobListings.appendChild(jobCard);
        });
        
        addJobCardEventListeners();
        
    } catch (error) {
        console.error('Error displaying jobs:', error);
        jobListings.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Failed to load jobs</h3>
                <p>Please check your connection and try again</p>
                <button class="btn btn-primary" onclick="displayJobs()">Try Again</button>
            </div>
        `;
    }
}

// Function to create job card HTML
function createJobCardHTML(job) {
    // Handle both backend and local job formats
    const jobId = job._id || job.id;
    const salary = job.salaryRange || job.salary;
    const posted = job.createdAt ? new Date(job.createdAt).toLocaleDateString() : job.posted;
    
    return `
        <div class="job-card">
            <div class="job-header">
                <div>
                    <h3 class="job-title">${job.title}</h3>
                    <p class="job-company">${job.company}</p>
                </div>
                <div>
                    <span class="job-tag">${job.type}</span>
                </div>
            </div>
            <div class="job-meta">
                <span class="job-tag"><i class="fas fa-map-marker-alt"></i> ${job.location}</span>
                <span class="job-tag"><i class="fas fa-briefcase"></i> ${job.experience}</span>
                <span class="job-tag"><i class="fas fa-dollar-sign"></i> ${salary}</span>
            </div>
            <p class="job-description">${job.description}</p>
            ${job.skills ? `
            <div class="job-skills">
                <strong>Skills:</strong>
                <div class="skills-list">
                    ${job.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                </div>
            </div>
            ` : ''}
            <div class="job-footer">
                <span style="color: var(--secondary); font-size: 0.9rem;">
                    <i class="far fa-clock"></i> Posted ${posted}
                </span>
                <button class="btn btn-primary apply-btn" data-job-id="${jobId}">
                    Apply Now
                </button>
            </div>
        </div>
    `;
}

// Function to add event listeners
function addJobCardEventListeners() {
    document.querySelectorAll('.apply-btn').forEach(button => {
        button.addEventListener('click', function() {
            const jobId = this.getAttribute('data-job-id');
            applyForJob(jobId);
        });
    });
}

// Function to handle job application
async function applyForJob(jobId) {
    try {
        // Check if user is logged in
        const token = localStorage.getItem('token');
        if (!token) {
            showNotification('Please register or login to apply for jobs.', 'warning');
            showRegisterModal();
            return;
        }

        // Check if resume is uploaded
        const hasResume = document.querySelector('.file-item') !== null;
        if (!hasResume) {
            showNotification('Please upload your resume before applying for jobs.', 'warning');
            document.querySelector('.upload-section').scrollIntoView({ behavior: 'smooth' });
            return;
        }

        // Apply through backend API
        const response = await fetch(`${API_BASE_URL}/applications`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                jobId: jobId,
                coverLetter: "I'm interested in this position and believe my skills are a great match."
            })
        });

        const result = await response.json();
        
        if (result.success) {
            showNotification(`✅ Successfully applied for: ${result.data.job.title} at ${result.data.job.company}`, 'success');
        } else {
            showNotification(`❌ Application failed: ${result.message}`, 'error');
        }
    } catch (error) {
        console.error('Application error:', error);
        showNotification('Application failed. Please try again.', 'error');
    }
}

// User registration
async function registerUser(userData) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });
        return await response.json();
    } catch (error) {
        console.error('Registration error:', error);
        return { success: false, message: 'Network error' };
    }
}

// User login
async function loginUser(credentials) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials)
        });
        const result = await response.json();
        
        if (result.success && result.token) {
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));
        }
        
        return result;
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: 'Network error' };
    }
}

// Upload resume to backend
async function uploadResumeToBackend(file) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            return { success: false, message: 'Not logged in' };
        }

        const formData = new FormData();
        formData.append('resume', file);

        const response = await fetch(`${API_BASE_URL}/resumes/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        return await response.json();
    } catch (error) {
        console.error('Resume upload error:', error);
        return { success: false, message: 'Network error' };
    }
}

// Search and filter functionality
function setupSearchAndFilters() {
    const searchForm = document.getElementById('searchForm');
    const categoryFilter = document.getElementById('categoryFilter');
    const locationFilter = document.getElementById('locationFilter');
    const experienceFilter = document.getElementById('experienceFilter');
    const resetFilters = document.getElementById('resetFilters');

    if (searchForm) {
        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const jobTitle = document.getElementById('job-title').value;
            const location = document.getElementById('location').value;
            
            const filters = {};
            if (jobTitle) filters.keyword = jobTitle;
            if (location) filters.location = location;
            
            await displayJobs(await loadJobsFromBackend(filters));
        });
    }

    // Add filter change listeners
    [categoryFilter, locationFilter, experienceFilter].forEach(filter => {
        if (filter) {
            filter.addEventListener('change', async () => {
                const filters = {
                    category: categoryFilter?.value,
                    location: locationFilter?.value,
                    experience: experienceFilter?.value
                };
                
                // Remove empty filters
                Object.keys(filters).forEach(key => {
                    if (!filters[key]) delete filters[key];
                });
                
                await displayJobs(await loadJobsFromBackend(filters));
            });
        }
    });

    // Reset filters
    if (resetFilters) {
        resetFilters.addEventListener('click', async () => {
            document.getElementById('searchForm').reset();
            categoryFilter.value = '';
            locationFilter.value = '';
            experienceFilter.value = '';
            await displayJobs();
        });
    }
}
// Debug function to check what's happening
async function debugApplication() {
    console.log('🔍 Debugging Application...');
    
    // Check backend connection
    try {
        const health = await fetch(`${API_BASE_URL}/health`);
        const healthData = await health.json();
        console.log('✅ Backend Health:', healthData);
    } catch (error) {
        console.error('❌ Backend Connection Failed:', error);
    }
    
    // Check jobs endpoint
    try {
        const jobs = await fetch(`${API_BASE_URL}/jobs`);
        const jobsData = await jobs.json();
        console.log('📊 Jobs Response:', jobsData);
    } catch (error) {
        console.error('❌ Jobs API Failed:', error);
    }
    
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    console.log('🔐 User Auth:', { hasToken: !!token, user: user });
}

// Call this in your browser console to debug
window.debugApp = debugApplication;

// ==================== INITIALIZATION ====================

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Initializing Job Portal...');
    
    // Setup authentication UI
    updateAuthUI();
    
    // Setup modal events
    setupModalEvents();
    
    // Setup resume upload
    setupResumeUpload();
    
    // Test backend connection
    const isBackendConnected = await testBackend();
    
    if (isBackendConnected) {
        console.log('✅ Backend connected - loading jobs from API');
    } else {
        console.log('⚠️ Backend not available - using local data');
    }
    
    // Load and display jobs
    await displayJobs();
    
    // Setup search and filters
    setupSearchAndFilters();
    
    console.log('🎉 Job Portal initialized successfully!');
});
