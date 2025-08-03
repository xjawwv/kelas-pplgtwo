// server.js

// Existing imports
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const multer = require('multer');

// New imports for MongoDB, Auth, and Environment Variables
const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3055;

// === Mongoose Schemas and Models ===

// User Schema for Admin Authentication
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    role: { type: String, default: 'admin' }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcryptjs.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

// Gallery Schema
const gallerySchema = new mongoose.Schema({
    filename: { type: String, required: true },
    originalName: { type: String },
    title: { type: String },
    description: { type: String },
    featured: { type: Boolean, default: false },
    uploadDate: { type: Date, default: Date.now },
    size: { type: Number },
    mimetype: { type: String }
});

const Gallery = mongoose.model('Gallery', gallerySchema);

// Confession Schema
const confessionSchema = new mongoose.Schema({
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const Confession = mongoose.model('Confession', confessionSchema);

// Structure Schema
const structureSchema = new mongoose.Schema({
    position: { type: String, required: true },
    name: { type: String, required: true },
    icon: { type: String },
    level: { type: String }
});

const Structure = mongoose.model('Structure', structureSchema);

// Settings Schema
const settingsSchema = new mongoose.Schema({
    siteName: { type: String, default: 'PPLGTWO' },
    siteTitle: { type: String, default: 'PPLGTWO - Website Kelas' },
    siteDescription: { type: String, default: 'Menciptakan masa depan digital dengan kreativitas, inovasi, dan kolaborasi yang tak terbatas' },
    welcomeText: { type: String, default: 'Welcome to PPLGTWO Digital Space' },
    lastUpdated: { type: Date, default: Date.now }
});

const Settings = mongoose.model('Settings', settingsSchema);

// === Database Connection ===
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');
        // Seed initial data after successful connection
        await seedInitialData();
    } catch (err) {
        console.error('MongoDB Connection Error:', err.message);
        process.exit(1); // Exit process with failure
    }
};

// === Initial Data Seeding ===
async function seedInitialData() {
    try {
        // Ensure admin user exists
        const adminExists = await User.findOne({ username: process.env.ADMIN_USERNAME });
        if (!adminExists) {
            const newUser = new User({
                username: process.env.ADMIN_USERNAME,
                password: process.env.ADMIN_PASSWORD, // Password will be hashed by pre-save hook
                role: 'admin'
            });
            await newUser.save();
            console.log(`🚀 Admin user '${process.env.ADMIN_USERNAME}' created.`);
        } else {
            console.log(`ℹ️ Admin user '${process.env.ADMIN_USERNAME}' already exists.`);
        }

        // Ensure gallery collection has default items if empty
        const galleryCount = await Gallery.countDocuments();
        if (galleryCount === 0) {
            const defaultGallery = [
                {
                    filename: 'foto1.jpg', // Note: These files must exist in public/assets/images/gallery
                    title: 'Moment Kelas Terbaik',
                    description: 'Kebersamaan yang tak akan pernah terlupakan',
                    featured: true,
                    uploadDate: new Date(),
                    size: 102400, // Example size
                    mimetype: 'image/jpeg'
                },
                {
                    filename: 'foto2.jpg',
                    title: 'Aktivitas Belajar',
                    description: 'Semangat pembelajaran tinggi',
                    featured: false,
                    uploadDate: new Date(),
                    size: 120500,
                    mimetype: 'image/jpeg'
                }
            ];
            await Gallery.insertMany(defaultGallery);
            console.log('🖼️ Created default gallery entries.');
        }

        // Ensure structure collection has default items if empty
        const structureCount = await Structure.countDocuments();
        if (structureCount === 0) {
            const defaultStructure = [
                { position: 'Wali Kelas', name: 'Bapak/Ibu Guru', icon: '👩‍🏫', level: 'leader' },
                { position: 'Ketua Kelas', name: 'Nama Ketua', icon: '👑', level: 'executive' },
                { position: 'Wakil Ketua', name: 'Nama Wakil Ketua', icon: '🤝', level: 'executive' },
                { position: 'Sekretaris 1', name: 'Nama Sekretaris 1', icon: '📝', level: 'staff' },
                { position: 'Sekretaris 2', name: 'Nama Sekretaris 2', icon: '📋', level: 'staff' },
                { position: 'Bendahara 1', name: 'Nama Bendahara 1', icon: '💰', level: 'staff' },
                { position: 'Bendahara 2', name: 'Nama Bendahara 2', icon: '💳', level: 'staff' },
                { position: 'Keamanan 1', name: 'Nama Keamanan 1', icon: '🛡️', level: 'division' },
                { position: 'Keamanan 2', name: 'Nama Keamanan 2', icon: '🔒', level: 'division' },
                { position: 'Rohani 1', name: 'Nama Rohani 1', icon: '🕊️', level: 'division' },
                { position: 'Rohani 2', name: 'Nama Rohani 2', icon: '🤲', level: 'division' },
                { position: 'Kebersihan 1', name: 'Nama Kebersihan 1', icon: '🧹', level: 'division' },
                { position: 'Kebersihan 2', name: 'Nama Kebersihan 2', icon: '✨', level: 'division' }
            ];
            await Structure.insertMany(defaultStructure);
            console.log('👥 Created default structure entries.');
        }

        // Ensure settings collection has default settings if empty
        const settingsCount = await Settings.countDocuments();
        if (settingsCount === 0) {
            const defaultSettings = {
                siteName: 'PPLGTWO',
                siteTitle: 'PPLGTWO - Website Kelas',
                siteDescription: 'Menciptakan masa depan digital dengan kreativitas, inovasi, dan kolaborasi yang tak terbatas',
                welcomeText: 'Welcome to PPLGTWO Digital Space',
                lastUpdated: new Date()
            };
            await new Settings(defaultSettings).save();
            console.log('⚙️ Created default settings.');
        }
        
        // Create dummy image files if they don't exist for default seeding
        const galleryUploadPath = path.join(__dirname, 'public', 'assets', 'images', 'gallery');
        if (!fs.existsSync(galleryUploadPath)) {
            fs.mkdirSync(galleryUploadPath, { recursive: true });
        }
        if (!fs.existsSync(path.join(galleryUploadPath, 'foto1.jpg'))) {
            fs.writeFileSync(path.join(galleryUploadPath, 'foto1.jpg'), Buffer.from(''), { encoding: 'binary' });
            console.log('Dummy file foto1.jpg created.');
        }
        if (!fs.existsSync(path.join(galleryUploadPath, 'foto2.jpg'))) {
            fs.writeFileSync(path.join(galleryUploadPath, 'foto2.jpg'), Buffer.from(''), { encoding: 'binary' });
            console.log('Dummy file foto2.jpg created.');
        }

    } catch (error) {
        console.error('Error during initial data seeding:', error);
    }
}

// === Middleware ===
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// === Authentication Middleware ===
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    if (token == null) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.error('JWT Verification Error:', err.message);
            return res.status(403).json({ error: 'Unauthorized: Invalid token' });
        }
        req.user = user; // Attach user payload to request object
        next();
    });
};

// === Multer Setup for File Uploads ===
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, 'public', 'assets', 'images', 'gallery');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'photo-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// === API Endpoints ===

// Login Route
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Create JWT
        const payload = {
            id: user._id,
            username: user.username,
            role: user.role
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' }); // Token valid for 24 hours

        res.json({
            message: 'Login successful',
            token,
            user: { id: user._id, username: user.username, role: user.role }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// IMAGE UPLOAD ENDPOINT (Protected)
app.post('/api/upload', authenticateToken, upload.array('images', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const uploadedPhotos = [];
        for (const file of req.files) {
            const newPhoto = new Gallery({
                filename: file.filename,
                originalName: file.originalname,
                title: path.parse(file.originalname).name.replace(/[_-]/g, ' '),
                description: 'Uploaded via admin dashboard',
                featured: false,
                uploadDate: new Date(),
                size: file.size,
                mimetype: file.mimetype
            });
            await newPhoto.save();
            uploadedPhotos.push(newPhoto);
        }

        res.status(201).json({
            message: `${uploadedPhotos.length} photo(s) uploaded successfully`,
            data: uploadedPhotos.map(p => ({ ...p._doc, id: p._id })) // Return MongoDB _id
        });

    } catch (error) {
        console.error('Upload error:', error);
        // Attempt to clean up partially uploaded files if an error occurs
        if (req.files) {
            req.files.forEach(file => {
                const filePath = path.join(__dirname, 'public', 'assets', 'images', 'gallery', file.filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });
        }
        res.status(500).json({ error: 'Failed to upload images' });
    }
});

// CONFESSIONS API ENDPOINTS
app.get('/api/confessions', async (req, res) => {
    try {
        const confessions = await Confession.find().sort({ timestamp: -1 }); // Newest first
        res.json(confessions.map(c => ({ ...c._doc, id: c._id }))); // Return MongoDB _id
    } catch (error) {
        console.error('Error fetching confessions:', error);
        res.status(500).json({ error: 'Failed to fetch confessions' });
    }
});

app.post('/api/confessions', async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message || message.trim() === '') {
            return res.status(400).json({ error: 'Message is required' });
        }
        if (message.length > 500) {
            return res.status(400).json({ error: 'Message too long (max 500 characters)' });
        }

        const newConfession = new Confession({ message: message.trim() });
        await newConfession.save();
        
        res.status(201).json({ 
            message: 'Confession submitted successfully',
            data: { ...newConfession._doc, id: newConfession._id } // Return MongoDB _id
        });
    } catch (error) {
        console.error('Error posting confession:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/api/confessions/:id', authenticateToken, async (req, res) => {
    try {
        const confessionId = req.params.id;
        const result = await Confession.findByIdAndDelete(confessionId);
        
        if (!result) {
            return res.status(404).json({ error: 'Confession not found' });
        }
        
        res.json({ message: 'Confession deleted successfully' });
    } catch (error) {
        console.error('Error deleting confession:', error);
        res.status(500).json({ error: 'Failed to delete confession' });
    }
});

// GALLERY API ENDPOINTS (Protected for PUT/DELETE)
app.get('/api/gallery', async (req, res) => {
    try {
        const gallery = await Gallery.find();
        res.json(gallery.map(p => ({ ...p._doc, id: p._id }))); // Return MongoDB _id
    } catch (error) {
        console.error('Error fetching gallery:', error);
        res.status(500).json({ error: 'Failed to fetch gallery' });
    }
});

// Adding a photo manually (not via upload.array) - usually not needed if upload endpoint works
app.post('/api/gallery', authenticateToken, async (req, res) => {
    try {
        const newPhoto = new Gallery(req.body); // Assuming body contains valid gallery data
        await newPhoto.save();
        res.status(201).json({ ...newPhoto._doc, id: newPhoto._id }); // Return MongoDB _id
    } catch (error) {
        console.error('Error adding photo:', error);
        res.status(500).json({ error: 'Failed to add photo' });
    }
});

app.put('/api/gallery/:id', authenticateToken, async (req, res) => {
    try {
        const photoId = req.params.id;
        // Find and update photo, return the updated document
        const updatedPhoto = await Gallery.findByIdAndUpdate(photoId, req.body, { new: true, runValidators: true });
        
        if (!updatedPhoto) {
            return res.status(404).json({ error: 'Photo not found' });
        }
        
        res.json({ ...updatedPhoto._doc, id: updatedPhoto._id }); // Return MongoDB _id
    } catch (error) {
        console.error('Error updating photo:', error);
        res.status(500).json({ error: 'Failed to update photo' });
    }
});

app.delete('/api/gallery/:id', authenticateToken, async (req, res) => {
    try {
        const photoId = req.params.id;
        // Find photo first to delete the file from the filesystem
        const photo = await Gallery.findById(photoId);
        
        if (photo) {
            const filePath = path.join(__dirname, 'public', 'assets', 'images', 'gallery', photo.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`Deleted file: ${filePath}`);
            }
            // Delete the database record
            const result = await Gallery.findByIdAndDelete(photoId);
            if (!result) { // Should not happen if photo was found, but good practice
                return res.status(404).json({ error: 'Photo not found (after file deletion)' });
            }
            res.json({ message: 'Photo deleted successfully' });
        } else {
            // If photo not found in DB, perhaps the file was already deleted manually
            res.status(404).json({ error: 'Photo not found' });
        }
    } catch (error) {
        console.error('Error deleting photo:', error);
        res.status(500).json({ error: 'Failed to delete photo' });
    }
});

// STRUCTURE API ENDPOINTS (Protected for PUT/DELETE)
app.get('/api/structure', async (req, res) => {
    try {
        const structure = await Structure.find();
        res.json(structure.map(m => ({ ...m._doc, id: m._id }))); // Return MongoDB _id
    } catch (error) {
        console.error('Error fetching structure:', error);
        res.status(500).json({ error: 'Failed to fetch structure' });
    }
});

app.post('/api/structure', authenticateToken, async (req, res) => {
    try {
        const newMember = new Structure(req.body);
        await newMember.save();
        res.status(201).json({ ...newMember._doc, id: newMember._id }); // Return MongoDB _id
    } catch (error) {
        console.error('Error adding member:', error);
        res.status(500).json({ error: 'Failed to add member' });
    }
});

app.put('/api/structure/:id', authenticateToken, async (req, res) => {
    try {
        const memberId = req.params.id;
        const updatedMember = await Structure.findByIdAndUpdate(memberId, req.body, { new: true, runValidators: true });
        
        if (!updatedMember) {
            return res.status(404).json({ error: 'Member not found' });
        }
        
        res.json({ ...updatedMember._doc, id: updatedMember._id }); // Return MongoDB _id
    } catch (error) {
        console.error('Error updating member:', error);
        res.status(500).json({ error: 'Failed to update member' });
    }
});

app.delete('/api/structure/:id', authenticateToken, async (req, res) => {
    try {
        const memberId = req.params.id;
        const result = await Structure.findByIdAndDelete(memberId);
        
        if (!result) {
            return res.status(404).json({ error: 'Member not found' });
        }
        
        res.json({ message: 'Member deleted successfully' });
    } catch (error) {
        console.error('Error deleting member:', error);
        res.status(500).json({ error: 'Failed to delete member' });
    }
});

// SETTINGS API ENDPOINTS (Protected)
app.get('/api/settings', async (req, res) => {
    try {
        // Fetch the single settings document. Assuming there's only one.
        let settings = await Settings.findOne();
        if (!settings) {
            // If no settings document exists, create one with defaults
            const defaultSettings = new Settings({ /* ... default values ... */ });
            await defaultSettings.save();
            settings = defaultSettings; // Assign newly created settings
            console.log('Created default settings upon first GET request.');
        }
        res.json({ ...settings._doc, id: settings._id }); // Return MongoDB _id
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

app.put('/api/settings', authenticateToken, async (req, res) => {
    try {
        // Find the settings document and update it. Assuming there's only one.
        // Use upsert: true to create if it doesn't exist.
        const updatedSettings = await Settings.findOneAndUpdate({}, { ...req.body, lastUpdated: new Date() }, { new: true, runValidators: true, upsert: true });
        
        res.json({ ...updatedSettings._doc, id: updatedSettings._id }); // Return MongoDB _id
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

// STATS API ENDPOINT
app.get('/api/stats', async (req, res) => {
    try {
        // Fetch counts from each collection
        const galleryCount = await Gallery.countDocuments();
        const structureCount = await Structure.countDocuments();
        const confessionsCount = await Confession.countDocuments();
        
        res.json({
            gallery: galleryCount,
            structure: structureCount,
            confessions: confessionsCount,
            lastActivity: new Date().toISOString() // Simple timestamp, could be more sophisticated
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve admin.html
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Error handling middleware for Multer errors
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

// === Start Server ===
connectDB().then(() => { // Ensure DB is connected before starting server
    app.listen(PORT, () => {
        console.log(`
╔══════════════════════════════════════╗
║          PPLGTWO SERVER              ║
║                                      ║
║  🌐 Server: http://localhost:${PORT}    ║
║  📱 Website: http://localhost:${PORT}   ║
║  ⚙️  Admin: http://localhost:${PORT}/admin ║
║                                      ║
║  ✅ Database connected successfully  ║
║  🚀 Server is ready!                ║
╚══════════════════════════════════════╝
        `);
    });
});

module.exports = app;