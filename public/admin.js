// Authentication and Session Management
const AUTH = {
    isAuthenticated: false,
    username: null,
    
    login(username, password) {
        // Demo credentials - In a real app, this would involve a secure API call
        if (username === 'admin' && password === 'pplgtwo2025') {
            this.isAuthenticated = true;
            this.username = username;
            // Store auth info in localStorage for session persistence (e.g., for 24 hours)
            localStorage.setItem('adminAuth', JSON.stringify({
                username: username,
                timestamp: Date.now()
            }));
            return true;
        }
        return false;
    },
    
    logout() {
        this.isAuthenticated = false;
        this.username = null;
        localStorage.removeItem('adminAuth');
        location.reload(); // Reload to clear state
    },
    
    checkAuth() {
        const stored = localStorage.getItem('adminAuth');
        if (stored) {
            const data = JSON.parse(stored);
            // Check if session is less than 24 hours old
            if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
                this.isAuthenticated = true;
                this.username = data.username;
                return true;
            } else {
                // Session expired
                localStorage.removeItem('adminAuth');
            }
        }
        return false;
    }
};

// API Helper Functions (Assuming a /api endpoint exists for backend interaction)
const API = {
    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`/api${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            if (!response.ok) {
                // Attempt to parse error response from backend
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `API Error: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            throw error; // Re-throw to be handled by caller
        }
    },

    // Gallery API Endpoints
    async getGallery() {
        return this.request('/gallery');
    },

    async uploadImages(formData) {
        // Note: This endpoint likely expects multipart/form-data, so Content-Type is handled by browser
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        if (!response.ok) throw new Error('Upload failed');
        return await response.json();
    },

    async updatePhoto(id, data) {
        return this.request(`/gallery/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    async deletePhoto(id) {
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
        return this.request(`/structure/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    async deleteMember(id) {
        return this.request(`/structure/${id}`, {
            method: 'DELETE'
        });
    },

    // Confessions API Endpoints
    async getConfessions() {
        return this.request('/confessions');
    },

    async deleteConfession(id) {
        return this.request(`/confessions/${id}`, {
            method: 'DELETE'
        });
    },

    // Statistics API Endpoint
    async getStats() {
        return this.request('/stats');
    }
};

// Notification System
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
    notification.className = `px-6 py-3 rounded-lg text-white font-medium ${colors[type]} shadow-lg transform transition-all duration-300 translate-x-full`;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Animate out and remove after duration
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        // Wait for the transition to finish before removing the element
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300); // Match the transition duration
    }, duration);
}

// Tab Management Logic
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
            // 'settings' tab doesn't require initial data load from API, just UI setup
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
        // Update last activity timestamp, assuming 'lastActivity' is provided by /stats API
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
        galleryStatus.textContent = 'Loading...';
        // Show a loading indicator within the grid
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
                         onerror="this.onerror=null;this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNjM2NmYxIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZTwvdGV4dD48L3N2Zz4=';">
                    ${photo.featured ? '<div class="absolute top-2 left-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded">Featured</div>' : ''}
                </div>
                <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                    <div class="text-center">
                        <button class="px-3 py-1 bg-primary/80 text-white text-sm rounded mb-2 hover:bg-primary transition-colors" onclick="editPhoto(${photo.id})">
                            Edit
                        </button>
                        <button class="px-3 py-1 bg-red-500/80 text-white text-sm rounded hover:bg-red-500 transition-colors" onclick="deletePhoto(${photo.id})">
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
async function editPhoto(id) {
    try {
        // Fetch gallery data to find the specific photo
        const gallery = await API.getGallery();
        const photo = gallery.find(p => p.id === id);
        
        if (!photo) {
            showNotification('Photo not found', 'error');
            return;
        }
        
        // Populate modal form with photo details
        document.getElementById('edit-photo-id').value = photo.id;
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
async function deletePhoto(id) {
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
    
    let selectedFiles = []; // Array to hold files selected for upload
    
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
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
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
            
            // Simulate progress bar (replace with actual XHR progress in a real scenario)
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += Math.random() * 30; // Increment progress randomly
                if (progress > 90) progress = 90; // Cap progress before 100% to show completion visually
                progressBar.style.width = `${progress}%`;
                uploadPercentage.textContent = `${Math.round(progress)}%`;
            }, 200);
            
            // Make the API call to upload files
            const result = await API.uploadImages(formData);
            
            // Clear simulated progress
            clearInterval(progressInterval);
            progressBar.style.width = '100%';
            uploadPercentage.textContent = '100%';
            
            if (result.error) {
                throw new Error(result.error); // Throw error if API returned one
            }
            
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
            memberElement.className = 'flex items-center justify-between p-4 glass-effect rounded-xl';
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
                    <button class="px-3 py-1 bg-primary/20 text-primary text-sm rounded hover:bg-primary/30 transition-colors" onclick="editMember(${member.id})">
                        Edit
                    </button>
                    <!-- Delete button -->
                    <button class="px-3 py-1 bg-red-500/20 text-red-400 text-sm rounded hover:bg-red-500/30 transition-colors" onclick="deleteMember(${member.id})">
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
async function editMember(id) {
    try {
        const structure = await API.getStructure();
        const member = structure.find(m => m.id === id);
        
        if (!member) {
            showNotification('Member not found', 'error');
            return;
        }
        
        // Fill the form fields
        document.getElementById('member-id').value = member.id;
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
async function deleteMember(id) {
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
        confessions.slice().reverse().forEach((confession, index) => {
            const confessionElement = document.createElement('div');
            // Apply styling and animation delay
            confessionElement.className = 'glass-effect rounded-xl p-4 border-l-4 border-primary';
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
                    <button class="px-3 py-1 bg-red-500/20 text-red-400 text-sm rounded hover:bg-red-500/30 transition-colors ml-4" onclick="deleteConfession(${confession.id})">
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
async function deleteConfession(id) {
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

// --- Event Listeners Setup ---
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
    // Check if user is already authenticated (e.g., from previous session)
    if (AUTH.checkAuth()) {
        document.getElementById('login-modal').classList.add('hidden'); // Hide login modal
        document.getElementById('dashboard').classList.remove('hidden'); // Show dashboard
        document.getElementById('current-user').textContent = AUTH.username; // Display logged-in username
        setupFileUpload(); // Initialize file upload components
        updateOverviewStats(); // Load initial stats
    }
    
    // Login form submission handler
    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault(); // Prevent default form submission
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        
        if (AUTH.login(username, password)) {
            // On successful login
            document.getElementById('login-modal').classList.add('hidden');
            document.getElementById('dashboard').classList.remove('hidden');
            document.getElementById('current-user').textContent = username;
            setupFileUpload();
            showNotification('Login successful!', 'success');
            updateOverviewStats(); // Load stats after login
        } else {
            // On failed login
            showNotification('Invalid username or password', 'error');
        }
    });
    
    // Logout button handler
    document.getElementById('logout-btn').addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            AUTH.logout();
        }
    });
    
    // --- Photo Edit Modal Handlers ---
    // Form submission for editing photo details
    document.getElementById('photo-edit-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('edit-photo-id').value;
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
        
        const id = document.getElementById('member-id').value; // ID is present if editing
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
        const className = document.getElementById('class-name').value;
        
        try {
            // In a real application, these would be saved via an API call
            // For this example, we use localStorage to simulate persistence
            localStorage.setItem('websiteSettings', JSON.stringify({
                siteTitle,
                siteDescription,
                className
            }));
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
        
        if (currentPassword !== 'pplgtwo2025') { // Demo: check against a hardcoded password
            showNotification('Current password is incorrect', 'error');
            return;
        }
        
        if (newPassword.length < 6) {
            showNotification('New password must be at least 6 characters long', 'error');
            return;
        }
        
        // In a real app, this would be an API call to update the password
        showNotification('Password updated successfully', 'success');
        document.getElementById('admin-settings-form').reset(); // Clear the form
    });
    
    // --- Danger Zone Buttons ---
    // Backup data button
    document.getElementById('backup-data').addEventListener('click', async () => {
        try {
            // Fetch all necessary data in parallel
            const [gallery, structure, confessions] = await Promise.all([
                API.getGallery(),
                API.getStructure(),
                API.getConfessions()
            ]);
            
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
        
        try {
            // In a real application, this would involve API calls to clear backend data
            // For this example, we clear localStorage and reload the page
            localStorage.clear();
            showNotification('System reset successfully. Refreshing...', 'success');
            
            // Reload the page after a short delay to allow notification to show
            setTimeout(() => {
                location.reload();
            }, 2000);
        } catch (error) {
            console.error('Error resetting system:', error);
            showNotification('Failed to reset system', 'error');
        }
    });
    
    // Load saved website settings from localStorage on page load
    const savedSettings = localStorage.getItem('websiteSettings');
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        document.getElementById('site-title').value = settings.siteTitle || 'PPLGTWO - Website Kelas';
        document.getElementById('site-description').value = settings.siteDescription || '';
        document.getElementById('class-name').value = settings.className || 'PPLGTWO';
    }
    
    // Initialize the dashboard by showing the overview tab content
    switchTab('overview');
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
    showNotification('A network error occurred', 'error');
    event.preventDefault(); // Prevent default behavior like logging to console again
});