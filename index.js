require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
// বাল্ক আপলোডের জন্য সাইজ লিমিট বাড়ানো হয়েছে
app.use(express.json({ limit: '50mb' })); 
app.use(express.static('public'));

// ---------------------------------------------
// ১. MongoDB কানেকশন
// ---------------------------------------------
const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
    console.error("❌ Error: .env ফাইল থেকে MONGO_URI পাওয়া যাচ্ছে না।");
} else {
    mongoose.connect(mongoUri)
        .then(() => console.log("✅ MongoDB Connected for Tuli Research Institute!"))
        .catch(err => console.error("❌ DB Error:", err));
}

// ---------------------------------------------
// ২. স্কিমা ও মডেল (Schema & Models)
// ---------------------------------------------

// নোটিশ মডেল
const NoticeSchema = new mongoose.Schema({
    title: String,
    date: String,
    createdAt: { type: Date, default: Date.now }
});
const Notice = mongoose.model('Notice', NoticeSchema);

// রেজাল্ট মডেল (মার্কশিট সহ)
// [এই অংশটি অবশ্যই রাউটের উপরে থাকতে হবে]
const ResultSchema = new mongoose.Schema({
    studentName: String,
    fatherName: String,
    motherName: String,
    roll: String,
    regNo: String,
    examName: String,
    year: String,
    institute: String,
    gpa: String,
    resultStatus: String,
    marks: Array, // বিষয়ভিত্তিক নম্বর রাখার জন্য
    createdAt: { type: Date, default: Date.now }
});
const Result = mongoose.model('Result', ResultSchema);

// ---------------------------------------------
// ৩. পেজ রাউটিং (Page Routes)
// ---------------------------------------------
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/about', (req, res) => res.sendFile(path.join(__dirname, 'about.html')));
app.get('/services', (req, res) => res.sendFile(path.join(__dirname, 'services.html')));
app.get('/gallery', (req, res) => res.sendFile(path.join(__dirname, 'gallery.html')));
app.get('/result', (req, res) => res.sendFile(path.join(__dirname, 'result.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('/verification', (req, res) => res.sendFile(path.join(__dirname, 'verification.html')));
// ---------------------------------------------
// ৪. API (Backend Logic)
// ---------------------------------------------

// === নোটিশ API ===
app.get('/api/notices', async (req, res) => {
    try {
        const notices = await Notice.find().sort({ createdAt: -1 });
        res.json(notices);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/notices', async (req, res) => {
    try {
        await new Notice(req.body).save();
        res.json({ message: "Success" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/notices/:id', async (req, res) => {
    try {
        await Notice.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============ LOGIN SYSTEM ============

// ১. লগিন পেজ দেখানো
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// ২. লগিন যাচাই করা (API)
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    // পাসওয়ার্ড এখানে সেট করুন (Username: admin, Password: admin123)
    if (username === 'admin' && password === 'admin123') {
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});
// === রেজাল্ট API ===

// ১. সিঙ্গেল রেজাল্ট আপলোড
app.post('/api/results', async (req, res) => {
    try {
        await new Result(req.body).save();
        res.json({ message: "Result Saved" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ২. বাল্ক রেজাল্ট আপলোড (এখানেই আপনার সমস্যা ছিল, এখন ঠিক করা হয়েছে)
app.post('/api/results/bulk', async (req, res) => {
    try {
        const results = req.body;
        
        if (!Array.isArray(results)) {
            return res.status(400).json({ error: "ডাটা সঠিক ফরম্যাটে নেই (Array হতে হবে)" });
        }

        await Result.insertMany(results);
        res.json({ message: "Bulk upload successful", count: results.length });
    } catch (err) {
        console.error("Bulk Upload Error:", err);
        res.status(500).json({ error: "Bulk upload failed: " + err.message });
    }
});

// ৩. রেজাল্ট সার্চ
app.get('/api/results/search', async (req, res) => {
    try {
        const { roll, examName } = req.query;
        const result = await Result.findOne({ roll, examName });
        
        if (result) {
            res.json({ found: true, data: result });
        } else {
            res.json({ found: false });
        }
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// সার্ভার স্টার্ট
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});