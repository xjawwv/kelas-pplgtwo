// admin.js

// === Global Variables and API Configuration ===
const API_BASE_URL = '/api'; // Base URL for API requests

const API = {
    // Function to get the JWT token from localStorage
    getToken() {
        return localStorage.getItem('jwtToken');
    },

    // Function to set the JWT token in localStorage
    setToken(token) {
        localStorage.setItem('jwtToken', token);
    },

    // Function to remove the JWT token from localStorage
    removeToken() {
        localStorage.removeItem('jwtToken');
    },

    // Function to get current user info from localStorage
    getCurrentUser() {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    },

    // Function to set current user info in localStorage
    setCurrentUser(user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
    },

    // General API request function with JWT authentication
    async request(endpoint, options = {}) {
        const token = this.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        // Add Authorization header if token exists
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                headers: headers,
                ...options
            });
            
            const responseData = await response.json();

            // Handle authentication errors (401 Unauthorized, 403 Forbidden)
            if (!response.ok && (response.status === 401 || response.status === 403)) {
                this.removeToken(); // Clear invalid token
                localStorage.removeItem('currentUser'); // Clear user info
                showNotification('Your session has expired or is invalid. Please log in again.', 'error');
                // Redirect to login page or trigger logout flow
                setTimeout(() => {
                    location.reload(); // Simple reload to clear state and show login form
                }, 1500);
                throw new Error('Authentication failed'); // Stop further processing
            }

            // Handle other API errors
            if (!response.ok || responseData.error) {
                 throw new Error(responseData.error || `API Error: ${response.statusText} (${response.status})`);
            }

            return responseData;
        } catch (error) {
            console.error(`API Request failed (${endpoint}):`, error);
            throw error; // Re-throw to be handled by caller
        }
    },

    // Authentication API Endpoint
    async login(username, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `Login failed: ${response.statusText}`);
            }
            
            // Store the token and user info
            this.setToken(data.token);
            this.setCurrentUser(data.user);
            
            return data.user; // Return user info on successful login
        } catch (error) {
            console.error('Login service failed:', error);
            throw error; // Re-throw to be handled by caller
        }
    },

    logout() {
        this.removeToken();
        localStorage.removeItem('currentUser');
        location.reload(); // Reload to clear state and show login form
    },

    // Check if the user is authenticated (has a valid token)
    isAuthenticated() {
        return !!this.getToken(); // Returns true if token exists, false otherwise
    },

    // Gallery API Endpoints
    async getGallery() {
        return this.request('/gallery');
    },

    async uploadImages(formData) {
        // Fetch handles FormData correctly regarding headers, including Authorization
        // when set on the fetch options. Our API.request wrapper adds it.
        // However, for FormData, we usually omit 'Content-Type' header and let the browser set it.
        // Let's modify fetch directly for uploads or ensure API.request handles it.
        
        const token = this.getToken();
        if (!token) throw new Error("Not authenticated");

        const response = await fetch(`${API_BASE_URL}/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}` // Manually add token for FormData requests
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            // Re-check auth error specifically for upload
            if (response.status === 401 || response.status === 403) {
                this.logout(); // Trigger logout process
                throw new Error('Authentication failed');
            }
            throw new Error(errorData.error || `Upload failed: ${response.statusText}`);
        }
        return await response.json();
    },

    async updatePhoto(id, data) {
        // ID here is the MongoDB _id string
        return this.request(`/gallery/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    async deletePhoto(id) {
        // ID here is the MongoDB _id string
        return this.request(`/gallery/${id}`, {
            method: 'DELETE'
        });
    },

    // Structure API Endpoints
    async getStructure() {
        return this.request('/structure');
    },

    async addMember(data) {
        return this.request('/structure', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async updateMember(id, data) {
        // ID here is the MongoDB _id string
        return this.request(`/structure/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    async deleteMember(id) {
        // ID here is the MongoDB _id string
        return this.request(`/structure/${id}`, {
            method: 'DELETE'
        });
    },

    // Confessions API Endpoints
    async getConfessions() {
        return this.request('/confessions');
    },

    async deleteConfession(id) {
        // ID here is the MongoDB _id string
        return this.request(`/confessions/${id}`, {
            method: 'DELETE'
        });
    },

    // Statistics API Endpoint
    async getStats() {
        // Stats endpoint might not require authentication, but we'll use the generic request method anyway
        return this.request('/stats');
    },

    // Settings API Endpoint (assuming PUT requires auth)
    async updateSettings(data) {
        return this.request('/settings', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    // Get current settings from backend
    async getSettings() {
        return this.request('/settings');
    }
};

// === Notification System ===
function showNotification(message, type = 'info', duration = 3000) {
    const container = document.getElementById('notification-container');
    const notification = document.createElement('div');
    
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    };
    
    // Basic styling for the notification pop-up
    // Changed position to fixed top-right
    notification.className = `px-6 py-3 rounded-lg text-white font-medium ${colors[type]} shadow-lg transform transition-all duration-300 fixed top-4 right-4 z-50 w-auto max-w-sm`;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-x-full'); // Start from off-screen right
        notification.classList.add('translate-x-0');      // Slide to visible position
    }, 10); // Small delay to ensure element is in DOM before transition
    
    // Animate out and remove after duration
    setTimeout(() => {
        notification.classList.remove('translate-x-0');
        notification.classList.add('translate-x-full'); // Slide back off-screen right
        // Wait for the transition to finish before removing the element
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300); // Match the transition duration (e.g., 300ms)
    }, duration);
}


// === Tab Management Logic ===
function switchTab(tabName) {
    // Hide all tab content sections
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    // Remove 'active' class from all tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show the selected tab content
    const selectedContent = document.getElementById(`${tabName}-content`);
    if (selectedContent) {
        selectedContent.classList.remove('hidden');
    }
    
    // Add 'active' class to the selected tab button
    const selectedButton = document.querySelector(`[data-tab="${tabName}"]`);
    if (selectedButton) {
        selectedButton.classList.add('active');
    }
    
    // Update the page title shown in the header
    const titles = {
        overview: 'Overview',
        gallery: 'Gallery Management',
        structure: 'Class Structure',
        confessions: 'Confessions Management',
        settings: 'Website & Admin Settings'
    };
    document.getElementById('page-title').textContent = titles[tabName] || 'Dashboard';
    
    // Load the necessary data for the newly active tab
    loadTabContent(tabName);
}

// Function to load content specific to each tab (API calls)
async function loadTabContent(tabName) {
    try {
        switch (tabName) {
            case 'overview':
                await updateOverviewStats();
                break;
            case 'gallery':
                await loadGalleryContent();
                break;
            case 'structure':
                await loadStructureContent();
                break;
            case 'confessions':
                await loadConfessionsContent();
                break;
            case 'settings':
                await loadSettingsContent(); // Load settings when settings tab is activated
                break;
        }
    } catch (error) {
        console.error(`Error loading ${tabName} content:`, error);
        showNotification(`Failed to load ${tabName} data. Please check console.`, 'error');
    }
}

// --- Overview Tab Functions ---
async function updateOverviewStats() {
    try {
        const stats = await API.getStats();
        document.getElementById('gallery-count').textContent = stats.gallery || 0;
        document.getElementById('structure-count').textContent = stats.structure || 0;
        document.getElementById('confessions-count').textContent = stats.confessions || 0;
        document.getElementById('last-updated').textContent = stats.lastActivity ? new Date(stats.lastActivity).toLocaleString() : 'N/A';
    } catch (error) {
        console.error('Error updating overview stats:', error);
        // Display error indicators if stats fail to load
        document.getElementById('gallery-count').textContent = '-';
        document.getElementById('structure-count').textContent = '-';
        document.getElementById('confessions-count').textContent = '-';
        document.getElementById('last-updated').textContent = 'Error';
    }
}

// --- Gallery Management Functions ---
async function loadGalleryContent() {
    const galleryGrid = document.getElementById('gallery-grid');
    const galleryStatus = document.getElementById('gallery-status');
    
    try {
        // Show a loading indicator
        galleryGrid.innerHTML = '<div class="col-span-full text-center py-8"><div class="loading-spinner mx-auto mb-4"></div><p class="text-slate-400">Loading gallery...</p></div>';
        
        const gallery = await API.getGallery();
        galleryGrid.innerHTML = ''; // Clear loading indicator
        
        if (gallery.length === 0) {
            // Display message if gallery is empty
            galleryGrid.innerHTML = `
                <div class="col-span-full text-center py-8">
                    <div class="text-4xl mb-4">📷</div>
                    <p class="text-slate-400">No photos uploaded yet</p>
                    <p class="text-slate-500 text-sm">Use the upload area to add photos</p>
                </div>
            `;
            galleryStatus.textContent = 'Empty';
            return;
        }
        
        // Populate the gallery grid with photo items
        gallery.forEach(photo => {
            const photoElement = document.createElement('div');
            photoElement.className = 'relative group'; // For hover effects
            photoElement.innerHTML = `
                <div class="aspect-video bg-slate-700 rounded-lg overflow-hidden">
                    <img src="/assets/images/gallery/${photo.filename}" alt="${photo.title || 'Gallery Image'}" 
                         class="w-full h-full object-cover" 
                         onerror="this.onerror=null; this.src='/path/to/placeholder.png';"> <!-- Update placeholder path if needed -->
                    ${photo.featured ? '<div class="absolute top-2 left-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded">Featured</div>' : ''}
                </div>
                <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                    <div class="text-center">
                        <!-- Pass the MongoDB _id -->
                        <button class="px-3 py-1 bg-primary/80 text-white text-sm rounded mb-2 hover:bg-primary transition-colors" onclick="editPhoto('${photo.id}')">
                            Edit
                        </button>
                        <button class="px-3 py-1 bg-red-500/80 text-white text-sm rounded hover:bg-red-500 transition-colors" onclick="deletePhoto('${photo.id}')">
                            Delete
                        </button>
                    </div>
                </div>
                <div class="mt-2">
                    <p class="text-sm font-medium text-slate-200">${photo.title || 'Untitled'}</p>
                    <p class="text-xs text-slate-400">${photo.filename}</p>
                    ${photo.size ? `<p class="text-xs text-slate-500">${(photo.size / 1024 / 1024).toFixed(2)} MB</p>` : ''}
                </div>
            `;
            galleryGrid.appendChild(photoElement);
        });
        
        galleryStatus.textContent = `${gallery.length} photos`;
    } catch (error) {
        console.error('Error loading gallery:', error);
        // Display error message if loading fails
        galleryGrid.innerHTML = `
            <div class="col-span-full text-center py-8">
                <div class="text-4xl mb-4">❌</div>
                <p class="text-red-400">Failed to load gallery</p>
                <button onclick="loadGalleryContent()" class="text-primary text-sm mt-2">Retry</button>
            </div>
        `;
        galleryStatus.textContent = 'Error';
    }
}

// Function to open the edit modal for a photo
async function editPhoto(id) { // Accepts string ID (_id)
    try {
        // Fetch gallery data to find the specific photo
        const gallery = await API.getGallery();
        const photo = gallery.find(p => p.id === id); // Find by string ID
        
        if (!photo) {
            showNotification('Photo not found', 'error');
            return;
        }
        
        // Populate modal form with photo details
        document.getElementById('edit-photo-id').value = photo.id; // Store the _id string
        document.getElementById('edit-photo-title').value = photo.title || '';
        document.getElementById('edit-photo-description').value = photo.description || '';
        document.getElementById('edit-photo-featured').checked = photo.featured || false;
        
        // Show the modal
        document.getElementById('photo-edit-modal').classList.remove('hidden');
    } catch (error) {
        console.error('Error loading photo for edit:', error);
        showNotification('Failed to load photo details', 'error');
    }
}

// Function to delete a photo
async function deletePhoto(id) { // Accepts string ID (_id)
    if (!confirm('Are you sure you want to delete this photo? This action cannot be undone.')) return;
    
    try {
        await API.deletePhoto(id);
        showNotification('Photo deleted successfully', 'success');
        await loadGalleryContent(); // Refresh gallery view
        await updateOverviewStats(); // Update counts
    } catch (error) {
        console.error('Error deleting photo:', error);
        showNotification('Failed to delete photo', 'error');
    }
}

// Setup for file upload functionality (drag & drop, file selection)
function setupFileUpload() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const uploadPreview = document.getElementById('upload-preview');
    const previewList = document.getElementById('preview-list');
    const uploadBtn = document.getElementById('upload-btn');
    const filesCount = document.getElementById('files-count');
    const uploadProgressContainer = document.getElementById('upload-progress-container');
    const uploadPercentage = document.getElementById('upload-percentage');
    const progressBar = document.querySelector('.upload-progress');
    
    let selectedFiles = []; // Array to hold File objects
    
    // Trigger file input click when drop zone is clicked
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Drag and drop event listeners
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault(); // Prevent default to allow dropping
        dropZone.classList.add('dragover'); // Add visual feedback
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover'); // Remove visual feedback
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault(); // Prevent default browser behavior
        dropZone.classList.remove('dragover'); // Remove visual feedback
        handleFiles(e.dataTransfer.files); // Process dropped files
    });
    
    // Handle file selection from the input element
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });
    
    // Function to validate and add files to selectedFiles array
    function handleFiles(files) {
        // Filter out invalid files (non-images, too large)
        selectedFiles = Array.from(files).filter(file => {
            if (!file.type.startsWith('image/')) {
                showNotification(`${file.name} is not an image file`, 'error');
                return false;
            }
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                showNotification(`${file.name} is too large (max 5MB)`, 'error');
                return false;
            }
            return true; // File is valid
        });
        
        // If valid files were selected, show the preview
        if (selectedFiles.length > 0) {
            showPreview();
        }
    }
    
    // Function to display previews of selected files
    function showPreview() {
        previewList.innerHTML = ''; // Clear previous previews
        filesCount.textContent = `${selectedFiles.length} file(s)`; // Update file count
        
        selectedFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                // Create HTML for each preview item
                const previewItem = document.createElement('div');
                previewItem.className = 'flex items-center space-x-3 p-3 bg-slate-800/30 rounded-lg';
                previewItem.innerHTML = `
                    <img src="${e.target.result}" alt="${file.name}" class="w-12 h-12 object-cover rounded">
                    <div class="flex-1 min-w-0"> <!-- Truncate text if too long -->
                        <p class="text-sm font-medium text-slate-200 truncate">${file.name}</p>
                        <p class="text-xs text-slate-400">${(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button class="text-red-400 hover:text-red-300" onclick="removeFile(${index})">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                `;
                previewList.appendChild(previewItem);
            };
            reader.readAsDataURL(file); // Read file as data URL for preview
        });
        uploadPreview.classList.remove('hidden'); // Show the preview container
    }
    
    // Make removeFile function globally accessible for the onclick handler
    window.removeFile = function(index) {
        selectedFiles.splice(index, 1); // Remove file from array
        if (selectedFiles.length === 0) {
            uploadPreview.classList.add('hidden'); // Hide preview if no files left
            fileInput.value = ''; // Clear the file input
        } else {
            showPreview(); // Re-render preview list
        }
    };
    
    // Handle the upload button click
    uploadBtn.addEventListener('click', async () => {
        if (selectedFiles.length === 0) return; // Do nothing if no files are selected
        
        const formData = new FormData();
        selectedFiles.forEach(file => {
            formData.append('images', file); // Append each file to FormData
        });
        
        try {
            // Update UI for upload process
            uploadBtn.innerHTML = '<div class="loading-spinner"></div><span class="ml-2">Uploading...</span>';
            uploadBtn.disabled = true;
            uploadProgressContainer.classList.remove('hidden');
            
            // Simulate progress bar
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += Math.random() * 15; // Increment progress randomly
                if (progress > 95) progress = 95; // Cap progress before 100%
                progressBar.style.width = `${progress}%`;
                uploadPercentage.textContent = `${Math.round(progress)}%`;
            }, 150);
            
            // Make the API call to upload files using the updated API service
            const result = await API.uploadImages(formData);
            
            // Clear simulated progress
            clearInterval(progressInterval);
            progressBar.style.width = '100%';
            uploadPercentage.textContent = '100%';
            
            showNotification(result.message, 'success'); // Show success message
            await loadGalleryContent(); // Refresh gallery view
            await updateOverviewStats(); // Update counts
            
            // Reset the upload UI
            uploadPreview.classList.add('hidden');
            uploadProgressContainer.classList.add('hidden');
            selectedFiles = [];
            fileInput.value = '';
            progressBar.style.width = '0%';
            
        } catch (error) {
            console.error('Upload error:', error);
            showNotification(error.message || 'Upload failed', 'error');
            // Reset progress bar on error
            uploadProgressContainer.classList.add('hidden');
            progressBar.style.width = '0%';
        } finally {
            // Restore upload button state
            uploadBtn.innerHTML = '<span>Upload Photos</span>';
            uploadBtn.disabled = false;
        }
    });
}

// --- Structure Management Functions ---
async function loadStructureContent() {
    const structureList = document.getElementById('structure-list');
    
    try {
        // Show loading indicator
        structureList.innerHTML = '<div class="text-center py-4"><div class="loading-spinner mx-auto mb-2"></div><p class="text-slate-400 text-sm">Loading structure...</p></div>';
        
        const structure = await API.getStructure();
        structureList.innerHTML = ''; // Clear loading indicator
        
        if (structure.length === 0) {
            // Display message if structure is empty
            structureList.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-4xl mb-4">👥</div>
                    <p class="text-slate-400">No members added yet</p>
                    <p class="text-slate-500 text-sm">Use the form to add members</p>
                </div>
            `;
            return;
        }
        
        // Populate the structure list
        structure.forEach(member => {
            const memberElement = document.createElement('div');
            memberElement.className = 'flex items-center justify-between p-4 glass-effect rounded-xl mb-3'; // Added mb-3 for spacing
            memberElement.innerHTML = `
                <div class="flex items-center space-x-3">
                    <div class="text-2xl">${member.icon}</div> <!-- Display member icon -->
                    <div>
                        <p class="font-medium text-slate-200">${member.position}</p>
                        <p class="text-sm text-slate-400">${member.name}</p>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <!-- Edit button -->
                    <button class="px-3 py-1 bg-primary/20 text-primary text-sm rounded hover:bg-primary/30 transition-colors" onclick="editMember('${member.id}')">
                        Edit
                    </button>
                    <!-- Delete button -->
                    <button class="px-3 py-1 bg-red-500/20 text-red-400 text-sm rounded hover:bg-red-500/30 transition-colors" onclick="deleteMember('${member.id}')">
                        Delete
                    </button>
                </div>
            `;
            structureList.appendChild(memberElement);
        });
    } catch (error) {
        console.error('Error loading structure:', error);
        structureList.innerHTML = `
            <div class="text-center py-8">
                <div class="text-4xl mb-4">❌</div>
                <p class="text-red-400">Failed to load structure</p>
                <button onclick="loadStructureContent()" class="text-primary text-sm mt-2">Retry</button>
            </div>
        `;
    }
}

// Function to populate the form for editing a member
async function editMember(id) { // Accepts string ID (_id)
    try {
        const structure = await API.getStructure();
        const member = structure.find(m => m.id === id); // Find by string ID
        
        if (!member) {
            showNotification('Member not found', 'error');
            return;
        }
        
        // Fill the form fields
        document.getElementById('member-id').value = member.id; // Store the _id string
        document.getElementById('member-position').value = member.position;
        document.getElementById('member-name').value = member.name;
        document.getElementById('member-icon').value = member.icon;
        
        // Change submit button text and show cancel button
        document.getElementById('member-submit-text').textContent = 'Update Member';
        document.getElementById('cancel-edit').classList.remove('hidden');
    } catch (error) {
        console.error('Error loading member for edit:', error);
        showNotification('Failed to load member details', 'error');
    }
}

// Function to delete a member from the structure
async function deleteMember(id) { // Accepts string ID (_id)
    if (!confirm('Are you sure you want to delete this member? This action cannot be undone.')) return;
    
    try {
        await API.deleteMember(id);
        showNotification('Member deleted successfully', 'success');
        await loadStructureContent(); // Refresh the list
        await updateOverviewStats(); // Update counts
    } catch (error) {
        console.error('Error deleting member:', error);
        showNotification('Failed to delete member', 'error');
    }
}

// Function to reset the member form to its default state
function resetMemberForm() {
    document.getElementById('member-form').reset(); // Reset form fields
    document.getElementById('member-id').value = ''; // Clear hidden ID field
    document.getElementById('member-submit-text').textContent = 'Add Member'; // Reset button text
    document.getElementById('cancel-edit').classList.add('hidden'); // Hide cancel button
}

// --- Confessions Management Functions ---
async function loadConfessionsContent() {
    const confessionsList = document.getElementById('confessions-list');
    
    try {
        // Show loading indicator
        confessionsList.innerHTML = '<div class="text-center py-4"><div class="loading-spinner mx-auto mb-2"></div><p class="text-slate-400 text-sm">Loading confessions...</p></div>';
        
        const confessions = await API.getConfessions();
        confessionsList.innerHTML = ''; // Clear loading indicator
        
        if (confessions.length === 0) {
            // Display message if no confessions are available
            confessionsList.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-4xl mb-4">💭</div>
                    <p class="text-slate-400">No confessions yet</p>
                    <p class="text-slate-500 text-sm">Messages will appear here when submitted</p>
                </div>
            `;
            return;
        }
        
        // Display confessions, newest first
        confessions.slice().reverse().forEach((confession) => {
            const confessionElement = document.createElement('div');
            // Apply styling and animation delay
            confessionElement.className = 'glass-effect rounded-xl p-4 border-l-4 border-primary mb-3'; // Added mb-3 for spacing
            confessionElement.innerHTML = `
                <div class="flex items-start justify-between">
                    <div class="flex items-start space-x-3 flex-1">
                        <div class="text-2xl">💭</div> <!-- Icon for confession -->
                        <div class="flex-1">
                            <p class="text-slate-200 leading-relaxed">"${confession.message}"</p> <!-- Display message -->
                            <p class="text-slate-500 text-xs mt-2">
                                <!-- Format timestamp -->
                                ${new Date(confession.timestamp || Date.now()).toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <!-- Delete button for each confession -->
                    <button class="px-3 py-1 bg-red-500/20 text-red-400 text-sm rounded hover:bg-red-500/30 transition-colors ml-4" onclick="deleteConfession('${confession.id}')">
                        Delete
                    </button>
                </div>
            `;
            confessionsList.appendChild(confessionElement);
        });
    } catch (error) {
        console.error('Error loading confessions:', error);
        confessionsList.innerHTML = `
            <div class="text-center py-8">
                <div class="text-4xl mb-4">❌</div>
                <p class="text-red-400">Failed to load confessions</p>
                <button onclick="loadConfessionsContent()" class="text-primary text-sm mt-2">Retry</button>
            </div>
        `;
    }
}

// Function to delete a single confession
async function deleteConfession(id) { // Accepts string ID (_id)
    if (!confirm('Are you sure you want to delete this confession? This action cannot be undone.')) return;
    
    try {
        await API.deleteConfession(id);
        showNotification('Confession deleted successfully', 'success');
        await loadConfessionsContent(); // Refresh the list
        await updateOverviewStats(); // Update counts
    } catch (error) {
        console.error('Error deleting confession:', error);
        showNotification('Failed to delete confession', 'error');
    }
}

// Function to clear all confessions
async function clearAllConfessions() {
    if (!confirm('Are you sure you want to delete ALL confessions? This action cannot be undone.')) return;
    
    try {
        // Get all confessions to know which IDs to delete
        const confessions = await API.getConfessions();
        // Make parallel delete requests for efficiency
        await Promise.all(confessions.map(confession => API.deleteConfession(confession.id)));
        
        showNotification('All confessions cleared successfully', 'success');
        await loadConfessionsContent(); // Refresh the list
        await updateOverviewStats(); // Update counts
    } catch (error) {
        console.error('Error clearing confessions:', error);
        showNotification('Failed to clear confessions', 'error');
    }
}

// --- Settings Management Functions ---
async function loadSettingsContent() {
    const settingsForm = document.getElementById('website-settings-form');
    const adminSettingsForm = document.getElementById('admin-settings-form'); // Separate form for admin password etc.
    
    // Fetch current settings from backend
    try {
        const settings = await API.getSettings(); // This will use the GET /api/settings endpoint
        
        // Populate website settings form
        document.getElementById('site-title').value = settings.siteTitle || '';
        document.getElementById('site-description').value = settings.siteDescription || '';
        document.getElementById('class-name').value = settings.siteName || ''; // Assuming 'className' in admin.js maps to 'siteName' in backend settings
        
        // Enable the form after loading settings
        settingsForm.querySelector('button[type="submit"]').disabled = false;
        adminSettingsForm.querySelector('button[type="submit"]').disabled = false;

    } catch (error) {
        console.error('Error loading settings:', error);
        showNotification('Failed to load settings', 'error');
        // Disable forms if settings fail to load
        settingsForm.querySelector('button[type="submit"]').disabled = true;
        adminSettingsForm.querySelector('button[type="submit"]').disabled = true;
    }
}


// === Event Listeners Setup ===
document.addEventListener('DOMContentLoaded', () => {
    // --- Sidebar and Mobile Menu Handling ---
    const sidebar = document.getElementById('main-sidebar');
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const sidebarBackdrop = document.getElementById('sidebar-backdrop');

    // Function to toggle sidebar visibility (for mobile)
    const toggleSidebar = () => {
        const isMobileView = window.innerWidth < 768; // Check if current view is mobile breakpoint
        const isSidebarOpen = sidebar.classList.contains('open');

        if (isMobileView) {
            if (isSidebarOpen) {
                // Close sidebar
                sidebar.classList.remove('open');
                sidebarBackdrop.classList.remove('active'); // Hide backdrop
                document.body.classList.remove('overflow-hidden'); // Re-enable body scrolling
                // Reset menu button icon to hamburger
                mobileMenuButton.querySelector('svg').innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>';
            } else {
                // Open sidebar
                sidebar.classList.add('open');
                sidebarBackdrop.classList.add('active'); // Show backdrop
                document.body.classList.add('overflow-hidden'); // Disable body scrolling
                // Change menu button icon to close icon
                mobileMenuButton.querySelector('svg').innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>';
            }
        }
    };

    // Add click listener to the mobile menu button
    if (mobileMenuButton) {
        mobileMenuButton.addEventListener('click', toggleSidebar);
    }

    // Add click listener to the backdrop to close the sidebar
    if (sidebarBackdrop) {
        sidebarBackdrop.addEventListener('click', toggleSidebar);
    }

    // Close sidebar when a tab or quick action is clicked (on mobile)
    document.querySelectorAll('.tab-button, .quick-action').forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            switchTab(tabName); // Switch to the new tab
            // If on mobile and sidebar is open, close it
            if (window.innerWidth < 768 && sidebar.classList.contains('open')) {
                toggleSidebar();
            }
        });
    });

    // Handle window resize events to adjust sidebar visibility and behavior
    const handleResize = () => {
        if (window.innerWidth < 768) {
            // Mobile view: ensure sidebar is hidden by default, show menu button
            mobileMenuButton.classList.remove('hidden');
            sidebar.classList.remove('open'); // Ensure sidebar is closed
            sidebarBackdrop.classList.add('hidden'); // Ensure backdrop is hidden
            document.body.classList.remove('overflow-hidden'); // Ensure scrolling is enabled
            // Reset menu button icon to hamburger
            mobileMenuButton.querySelector('svg').innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>';
        } else {
            // Desktop view: ensure sidebar is visible, hide menu button
            mobileMenuButton.classList.add('hidden');
            sidebar.classList.remove('open'); // Ensure sidebar is not in 'open' state
            sidebarBackdrop.classList.add('hidden'); // Ensure backdrop is hidden
            document.body.classList.remove('overflow-hidden'); // Ensure scrolling is enabled
        }
    };

    window.addEventListener('resize', handleResize);
    // Run initial setup on page load
    handleResize();

    // --- Authentication and Initial Setup ---
    const loginModal = document.getElementById('login-modal');
    const dashboard = document.getElementById('dashboard');
    const currentUserDisplay = document.getElementById('current-user');

    // Check if already logged in on page load
    if (API.isAuthenticated()) {
        const user = API.getCurrentUser();
        if (user) {
            currentUserDisplay.textContent = user.username;
            loginModal.classList.add('hidden');
            dashboard.classList.remove('hidden');
            setupFileUpload(); // Initialize file upload components
            switchTab('overview'); // Load overview on startup
        } else {
            // Token exists but user info is missing, indicates potential issue, force re-login
            API.logout();
        }
    } else {
        // Not authenticated, show login form
        loginModal.classList.remove('hidden');
        dashboard.classList.add('hidden');
    }
    
    // Login form submission handler
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent default form submission
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        
        try {
            const user = await API.login(username, password);
            currentUserDisplay.textContent = user.username;
            loginModal.classList.add('hidden');
            dashboard.classList.remove('hidden');
            setupFileUpload();
            showNotification('Login successful!', 'success');
            switchTab('overview'); // Load overview after successful login
        } catch (error) {
            showNotification(error.message || 'Invalid username or password', 'error');
        }
    });
    
    // Logout button handler
    document.getElementById('logout-btn').addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            API.logout();
        }
    });
    
    // --- Photo Edit Modal Handlers ---
    // Form submission for editing photo details
    document.getElementById('photo-edit-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('edit-photo-id').value; // This should be the _id string
        const title = document.getElementById('edit-photo-title').value;
        const description = document.getElementById('edit-photo-description').value;
        const featured = document.getElementById('edit-photo-featured').checked;
        
        try {
            await API.updatePhoto(id, { title, description, featured });
            showNotification('Photo updated successfully', 'success');
            document.getElementById('photo-edit-modal').classList.add('hidden'); // Hide modal
            await loadGalleryContent(); // Refresh gallery view
        } catch (error) {
            console.error('Error updating photo:', error);
            showNotification('Failed to update photo', 'error');
        }
    });
    
    // Close photo edit modal handlers
    document.getElementById('close-edit-modal').addEventListener('click', () => {
        document.getElementById('photo-edit-modal').classList.add('hidden');
    });
    document.getElementById('cancel-photo-edit').addEventListener('click', () => {
        document.getElementById('photo-edit-modal').classList.add('hidden');
    });
    
    // --- Structure Management Form Handlers ---
    // Form submission for adding/editing a member
    document.getElementById('member-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('member-id').value; // This should be the _id string or empty
        const position = document.getElementById('member-position').value;
        const name = document.getElementById('member-name').value.trim();
        const icon = document.getElementById('member-icon').value.trim() || '👤'; // Default icon
        
        // Basic validation
        if (!position || !name) {
            showNotification('Please fill in Position and Name', 'error');
            return;
        }
        
        try {
            if (id) {
                // If ID exists, it's an update operation
                await API.updateMember(id, { position, name, icon });
                showNotification('Member updated successfully', 'success');
            } else {
                // Otherwise, it's an add operation
                await API.addMember({ position, name, icon });
                showNotification('Member added successfully', 'success');
            }
            
            await loadStructureContent(); // Refresh the structure list
            await updateOverviewStats(); // Update counts
            resetMemberForm(); // Clear and reset the form
        } catch (error) {
            console.error('Error saving member:', error);
            showNotification('Failed to save member', 'error');
        }
    });
    
    // Handler for the 'Cancel Edit' button
    document.getElementById('cancel-edit').addEventListener('click', resetMemberForm);
    
    // --- Confessions Management Handlers ---
    // Handler for clearing all confessions
    document.getElementById('clear-all-confessions').addEventListener('click', clearAllConfessions);
    
    // --- Refresh Buttons ---
    document.getElementById('refresh-gallery').addEventListener('click', loadGalleryContent);
    document.getElementById('refresh-structure').addEventListener('click', loadStructureContent);
    document.getElementById('refresh-confessions').addEventListener('click', loadConfessionsContent);
    
    // --- Settings Form Handlers ---
    // Website settings form submission
    document.getElementById('website-settings-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const siteTitle = document.getElementById('site-title').value;
        const siteDescription = document.getElementById('site-description').value;
        const className = document.getElementById('class-name').value; // Assuming this maps to siteName
        
        try {
            await API.updateSettings({ siteTitle, siteDescription, siteName: className });
            showNotification('Website settings saved successfully', 'success');
        } catch (error) {
            console.error('Error saving settings:', error);
            showNotification('Failed to save settings', 'error');
        }
    });
    
    // Admin settings form submission (password change, etc.)
    document.getElementById('admin-settings-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        // Password validation
        if (newPassword !== confirmPassword) {
            showNotification('New passwords do not match', 'error');
            return;
        }
        
        // Basic client-side validation for new password length
        if (newPassword.length < 6) {
            showNotification('New password must be at least 6 characters long', 'error');
            return;
        }
        
        // In a real app, this would be an API call to update the password.
        // Currently, there's no backend API endpoint for changing the admin password.
        // We'll show a placeholder message.
        showNotification('Password change functionality needs backend implementation.', 'warning');
        
        // For demonstration, we'll just reset the form if validations pass
        // and show a success message indicating the need for a backend call.
        document.getElementById('admin-settings-form').reset(); // Clear the form
    });
    
    // --- Danger Zone Buttons ---
    // Backup data button
    document.getElementById('backup-data').addEventListener('click', async () => {
        try {
            // Fetch all necessary data in parallel
            const gallery = await API.getGallery();
            const structure = await API.getStructure();
            const confessions = await API.getConfessions();
            
            // Compile data into a single object
            const data = {
                gallery,
                structure,
                confessions,
                timestamp: new Date().toISOString() // Add a timestamp for the backup
            };
            
            // Create a Blob and trigger download
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); // Pretty-print JSON
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `pplgtwo-backup-${new Date().toISOString().split('T')[0]}.json`; // Filename format
            a.click(); // Programmatically click the link to trigger download
            URL.revokeObjectURL(url); // Clean up the object URL
            
            showNotification('Data backup downloaded successfully', 'success');
        } catch (error) {
            console.error('Error creating backup:', error);
            showNotification('Failed to create backup', 'error');
        }
    });
    
    // Reset system button
    document.getElementById('reset-system').addEventListener('click', async () => {
        if (!confirm('Are you sure you want to reset ALL data? This action cannot be undone.')) return;
        
        // Add an extra confirmation step to prevent accidental resets
        const confirmText = prompt('Type "RESET" to confirm deletion of all data:');
        if (confirmText !== 'RESET') {
            showNotification('Reset cancelled', 'info');
            return;
        }
        
        // Simulate reset by clearing tokens and reloading.
        // A real reset would require a backend API call to clear DB collections.
        API.removeToken();
        localStorage.removeItem('currentUser');
        showNotification('System reset simulated (tokens cleared). Refreshing page...', 'success');
        
        // Reload the page after a short delay to allow notification to show
        setTimeout(() => {
            location.reload();
        }, 2000);
    });
    
    // Load saved website settings from backend on page load if authenticated
    if (API.isAuthenticated()) {
        loadSettingsContent(); // Load settings for the settings tab
    }
    
    // Initialize the dashboard by showing the overview tab content on first load
    // This is already handled by the initial auth check, but ensure it loads overview
    if (API.isAuthenticated()) {
       switchTab('overview');
    }
});

// --- Global Error Handling ---
// Catch unhandled errors and display notifications
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    showNotification('An unexpected error occurred', 'error');
});

// Catch unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    showNotification('A network or processing error occurred', 'error');
    event.preventDefault(); // Prevent default behavior like logging to console again
});
