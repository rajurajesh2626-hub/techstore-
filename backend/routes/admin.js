const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Create admin (one-time setup)
router.post('/setup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Admin already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new User({ name, email, password: hashedPassword, isAdmin: true });
    await admin.save();

    res.json({ message: 'Admin created successfully', admin: { email, isAdmin: true } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;