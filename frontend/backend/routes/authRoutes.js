const express = require('express');
const router = express.Router();

// Login route
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    // Add your authentication logic here
    res.json({ success: true, message: 'Login successful' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Register route
router.post('/register', (req, res) => {
  try {
    const { email, password, matricNumber } = req.body;
    // Add your registration logic here
    res.json({ success: true, message: 'Registration successful' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;