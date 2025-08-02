const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3055;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Melayani file statis dari folder 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Setup multer untuk file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, 'public', 'assets', 'images', 'gallery');
        // Pastikan folder exists
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'photo-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Pastikan folder data dan file JSON ada
function ensureDataExists() {
    const dataDir = path.join(__dirname, 'data');
    const galleryDir = path.join(__dirname, 'public', 'assets', 'images', 'gallery');
    
    // Buat folder data jika belum ada
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log('📁 Created data directory');
    }
    
    // Buat folder gallery jika belum ada
    if (!fs.existsSync(galleryDir)) {
        fs.mkdirSync(galleryDir, { recursive: true });
        console.log('🖼️ Created gallery directory');
    }
    
    // File paths
    const files = {
        confessions: path.join(dataDir, 'confessions.json'),
        gallery: path.join(dataDir, 'gallery.json'),
        structure: path.join(dataDir, 'structure.json'),
        settings: path.join(dataDir, 'settings.json')
    };
    
    // Initialize confessions.json
    if (!fs.existsSync(files.confessions)) {
        fs.writeFileSync(files.confessions, JSON.stringify([], null, 2));
        console.log('📝 Created confessions.json');
    }
    
    // Initialize gallery.json
    if (!fs.existsSync(files.gallery)) {
        const defaultGallery = [
            {
                id: 1,
                filename: 'foto1.jpg',
                title: 'Moment Kelas Terbaik',
                description: 'Kebersamaan yang tak akan pernah terlupakan',
                featured: true,
                uploadDate: new Date().toISOString()
            },
            {
                id: 2,
                filename: 'foto2.jpg',
                title: 'Aktivitas Belajar',
                description: 'Semangat pembelajaran tinggi',
                featured: false,
                uploadDate: new Date().toISOString()
            }
        ];
        fs.writeFileSync(files.gallery, JSON.stringify(defaultGallery, null, 2));
        console.log('🖼️ Created gallery.json');
    }
    
    // Initialize structure.json
    if (!fs.existsSync(files.structure)) {
        const defaultStructure = [
            { id: 1, position: 'Wali Kelas', name: 'Bapak/Ibu Guru', icon: '👨‍🏫', level: 'leader' },
            { id: 2, position: 'Ketua Kelas', name: 'Nama Ketua', icon: '👑', level: 'executive' },
            { id: 3, position: 'Wakil Ketua', name: 'Nama Wakil Ketua', icon: '🤝', level: 'executive' },
            { id: 4, position: 'Sekretaris 1', name: 'Nama Sekretaris 1', icon: '📝', level: 'staff' },
            { id: 5, position: 'Sekretaris 2', name: 'Nama Sekretaris 2', icon: '📋', level: 'staff' },
            { id: 6, position: 'Bendahara 1', name: 'Nama Bendahara 1', icon: '💰', level: 'staff' },
            { id: 7, position: 'Bendahara 2', name: 'Nama Bendahara 2', icon: '💳', level: 'staff' },
            { id: 8, position: 'Keamanan 1', name: 'Nama Keamanan 1', icon: '🛡️', level: 'division' },
            { id: 9, position: 'Keamanan 2', name: 'Nama Keamanan 2', icon: '🔒', level: 'division' },
            { id: 10, position: 'Rohani 1', name: 'Nama Rohani 1', icon: '🕊️', level: 'division' },
            { id: 11, position: 'Rohani 2', name: 'Nama Rohani 2', icon: '🤲', level: 'division' },
            { id: 12, position: 'Kebersihan 1', name: 'Nama Kebersihan 1', icon: '🧹', level: 'division' },
            { id: 13, position: 'Kebersihan 2', name: 'Nama Kebersihan 2', icon: '✨', level: 'division' }
        ];
        fs.writeFileSync(files.structure, JSON.stringify(defaultStructure, null, 2));
        console.log('👥 Created structure.json');
    }
    
    // Initialize settings.json
    if (!fs.existsSync(files.settings)) {
        const defaultSettings = {
            siteName: 'PPLGTWO',
            siteTitle: 'PPLGTWO - Website Kelas',
            siteDescription: 'Menciptakan masa depan digital dengan kreativitas, inovasi, dan kolaborasi yang tak terbatas',
            welcomeText: 'Welcome to PPLGTWO Digital Space',
            lastUpdated: new Date().toISOString()
        };
        fs.writeFileSync(files.settings, JSON.stringify(defaultSettings, null, 2));
        console.log('⚙️ Created settings.json');
    }
}

// Helper functions
function readJSONFile(filename) {
    const filePath = path.join(__dirname, 'data', filename);
    try {
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filename}:`, error.message);
        return [];
    }
}

function writeJSONFile(filename, data) {
    const filePath = path.join(__dirname, 'data', filename);
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error writing ${filename}:`, error.message);
        return false;
    }
}

// IMAGE UPLOAD ENDPOINT
app.post('/api/upload', upload.array('images', 10), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const gallery = readJSONFile('gallery.json');
        const uploadedPhotos = [];

        req.files.forEach(file => {
            const newPhoto = {
                id: Date.now() + Math.random(),
                filename: file.filename,
                originalName: file.originalname,
                title: path.parse(file.originalname).name.replace(/[_-]/g, ' '),
                description: 'Uploaded via admin dashboard',
                featured: false,
                uploadDate: new Date().toISOString(),
                size: file.size,
                mimetype: file.mimetype
            };
            
            gallery.push(newPhoto);
            uploadedPhotos.push(newPhoto);
        });

        if (writeJSONFile('gallery.json', gallery)) {
            res.status(201).json({
                message: `${uploadedPhotos.length} photo(s) uploaded successfully`,
                data: uploadedPhotos
            });
        } else {
            res.status(500).json({ error: 'Failed to save photo data' });
        }
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload images' });
    }
});

// CONFESSIONS API ENDPOINTS
app.get('/api/confessions', (req, res) => {
    try {
        const confessions = readJSONFile('confessions.json');
        res.json(confessions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch confessions' });
    }
});

app.post('/api/confessions', (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message || message.trim() === '') {
            return res.status(400).json({ error: 'Message is required' });
        }
        
        if (message.length > 500) {
            return res.status(400).json({ error: 'Message too long (max 500 characters)' });
        }

        const confessions = readJSONFile('confessions.json');
        const newConfession = {
            id: Date.now(),
            message: message.trim(),
            timestamp: new Date().toISOString()
        };
        
        confessions.push(newConfession);
        
        if (writeJSONFile('confessions.json', confessions)) {
            res.status(201).json({ 
                message: 'Confession submitted successfully',
                data: newConfession
            });
        } else {
            res.status(500).json({ error: 'Failed to save confession' });
        }
    } catch (error) {
        console.error('Error posting confession:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/api/confessions/:id', (req, res) => {
    try {
        const confessionId = parseInt(req.params.id);
        const confessions = readJSONFile('confessions.json');
        
        const filteredConfessions = confessions.filter(c => c.id !== confessionId);
        
        if (writeJSONFile('confessions.json', filteredConfessions)) {
            res.json({ message: 'Confession deleted successfully' });
        } else {
            res.status(500).json({ error: 'Failed to delete confession' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete confession' });
    }
});

// GALLERY API ENDPOINTS
app.get('/api/gallery', (req, res) => {
    try {
        const gallery = readJSONFile('gallery.json');
        res.json(gallery);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch gallery' });
    }
});

app.post('/api/gallery', (req, res) => {
    try {
        const gallery = readJSONFile('gallery.json');
        const newPhoto = {
            id: Date.now(),
            ...req.body,
            uploadDate: new Date().toISOString()
        };
        
        gallery.push(newPhoto);
        
        if (writeJSONFile('gallery.json', gallery)) {
            res.status(201).json(newPhoto);
        } else {
            res.status(500).json({ error: 'Failed to save photo' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to add photo' });
    }
});

app.put('/api/gallery/:id', (req, res) => {
    try {
        const photoId = parseFloat(req.params.id);
        const gallery = readJSONFile('gallery.json');
        
        const photoIndex = gallery.findIndex(photo => photo.id === photoId);
        if (photoIndex === -1) {
            return res.status(404).json({ error: 'Photo not found' });
        }
        
        gallery[photoIndex] = { ...gallery[photoIndex], ...req.body };
        
        if (writeJSONFile('gallery.json', gallery)) {
            res.json(gallery[photoIndex]);
        } else {
            res.status(500).json({ error: 'Failed to update photo' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update photo' });
    }
});

app.delete('/api/gallery/:id', (req, res) => {
    try {
        const photoId = parseFloat(req.params.id);
        const gallery = readJSONFile('gallery.json');
        
        // Find the photo to get filename
        const photo = gallery.find(photo => photo.id === photoId);
        if (photo) {
            // Delete file from filesystem
            const filePath = path.join(__dirname, 'public', 'assets', 'images', 'gallery', photo.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        
        const filteredGallery = gallery.filter(photo => photo.id !== photoId);
        
        if (writeJSONFile('gallery.json', filteredGallery)) {
            res.json({ message: 'Photo deleted successfully' });
        } else {
            res.status(500).json({ error: 'Failed to delete photo' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete photo' });
    }
});

// STRUCTURE API ENDPOINTS
app.get('/api/structure', (req, res) => {
    try {
        const structure = readJSONFile('structure.json');
        res.json(structure);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch structure' });
    }
});

app.post('/api/structure', (req, res) => {
    try {
        const structure = readJSONFile('structure.json');
        const newMember = {
            id: Date.now(),
            ...req.body,
            createdAt: new Date().toISOString()
        };
        
        structure.push(newMember);
        
        if (writeJSONFile('structure.json', structure)) {
            res.status(201).json(newMember);
        } else {
            res.status(500).json({ error: 'Failed to save member' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to add member' });
    }
});

app.put('/api/structure/:id', (req, res) => {
    try {
        const memberId = parseInt(req.params.id);
        const structure = readJSONFile('structure.json');
        
        const memberIndex = structure.findIndex(member => member.id === memberId);
        if (memberIndex === -1) {
            return res.status(404).json({ error: 'Member not found' });
        }
        
        structure[memberIndex] = { ...structure[memberIndex], ...req.body };
        
        if (writeJSONFile('structure.json', structure)) {
            res.json(structure[memberIndex]);
        } else {
            res.status(500).json({ error: 'Failed to update member' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update member' });
    }
});

app.delete('/api/structure/:id', (req, res) => {
    try {
        const memberId = parseInt(req.params.id);
        const structure = readJSONFile('structure.json');
        
        const filteredStructure = structure.filter(member => member.id !== memberId);
        
        if (writeJSONFile('structure.json', filteredStructure)) {
            res.json({ message: 'Member deleted successfully' });
        } else {
            res.status(500).json({ error: 'Failed to delete member' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete member' });
    }
});

// SETTINGS API ENDPOINTS
app.get('/api/settings', (req, res) => {
    try {
        const settings = readJSONFile('settings.json');
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

app.put('/api/settings', (req, res) => {
    try {
        const currentSettings = readJSONFile('settings.json');
        const updatedSettings = {
            ...currentSettings,
            ...req.body,
            lastUpdated: new Date().toISOString()
        };
        
        if (writeJSONFile('settings.json', updatedSettings)) {
            res.json(updatedSettings);
        } else {
            res.status(500).json({ error: 'Failed to update settings' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

// STATS API ENDPOINT
app.get('/api/stats', (req, res) => {
    try {
        const gallery = readJSONFile('gallery.json');
        const structure = readJSONFile('structure.json');
        const confessions = readJSONFile('confessions.json');
        
        res.json({
            gallery: gallery.length,
            structure: structure.length,
            confessions: confessions.length,
            lastActivity: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// Serve index.html untuk root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve admin.html
app.get('/m123admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large (max 5MB)' });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ error: 'Too many files (max 10)' });
        }
    }
    console.error('Server Error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Initialize data dan start server
ensureDataExists();

app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════╗
║          PPLGTWO SERVER              ║
║                                      ║
║  🌐 Server: http://localhost:${PORT}    ║
║  📱 Website: http://localhost:${PORT}   ║
║  ⚙️  Admin: http://localhost:${PORT}/admin ║
║                                      ║
║  📁 Data folder created successfully ║
║  🖼️  Gallery folder ready            ║
║  🚀 Server is ready!                ║
╚══════════════════════════════════════╝
    `);
});

module.exports = app;