// server.js
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

// const Student = require('./models/student');

// Import models
const Vote = require('./models/vote');
const Student = require('./models/student');
const Election = require('./models/election');
const Candidate = require('./models/candidate');

const app = express();
app.use(cors());
app.use(express.json());

// Add a root route to handle "Cannot GET /"
app.get('/', (req, res) => {
  res.json({ 
    message: 'Unilorin Election Blockchain Backend API', 
    status: 'Running',
    endpoints: {
      sendCode: 'POST /api/send-code',
      verifyCode: 'POST /api/verify-code',
      auth: '/api/auth',
      vote: '/api/vote',
      students: '/api/students',
      elections: '/api/elections',
      candidates: '/api/candidates'
    }
  });
});

// Temporary in-memory store
const codes = new Map();

// Helper to generate 6-digit code
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// SEND CODE API
app.post('/api/send-code', async (req, res) => {
  const { email } = req.body;
  const code = generateCode();
  const expires = Date.now() + 5 * 60 * 1000; // 5 minutes

  // Save code temporarily
  codes.set(email, { code, expires });

  // Email the code using nodemailer
  const transporter = nodemailer.createTransporter({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  try {
    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: 'Your Voting Verification Code',
      text: `Your verification code is: ${code}`,
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// VERIFY CODE API
app.post('/api/verify-code', (req, res) => {
  const { email, code } = req.body;
  const record = codes.get(email);

  if (record && record.code === code && Date.now() < record.expires) {
    codes.delete(email); // one-time use
    res.json({ success: true });
  } else {
    res.json({ success: false, message: 'Invalid or expired code' });
  }
});

// ========== AUTH ROUTES ==========
// Login route
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find student by email
    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    // In a real app, you'd verify the password here
    res.json({ 
      success: true, 
      message: 'Login successful',
      student: {
        id: student._id,
        matricNumber: student.matricNumber,
        fullName: student.fullName,
        email: student.email
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Register route
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, matricNumber, fullName, faculty, department, level } = req.body;
    
    // Check if student already exists
    const existingStudent = await Student.findOne({ 
      $or: [{ email }, { matricNumber }] 
    });
    
    if (existingStudent) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student with this email or matric number already exists' 
      });
    }
    
    // Create new student
    const newStudent = new Student({
      email,
      matricNumber,
      fullName,
      faculty,
      department,
      level
    });
    
    await newStudent.save();
    
    res.json({ 
      success: true, 
      message: 'Registration successful',
      student: {
        id: newStudent._id,
        matricNumber: newStudent.matricNumber,
        fullName: newStudent.fullName,
        email: newStudent.email
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== VOTE ROUTES ==========
// Cast vote
app.post('/api/vote', async (req, res) => {
  try {
    const { electionId, candidateId, voterId, transactionHash } = req.body;
    
    // Check if student has already voted in this election
    const existingVote = await Vote.findOne({ 
      studentId: voterId, 
      electionId: electionId 
    });
    
    if (existingVote) {
      return res.status(400).json({
        success: false,
        message: 'Student has already voted in this election'
      });
    }
    
    // Create new vote
    const newVote = new Vote({
      studentId: voterId,
      candidateId: candidateId,
      electionId: electionId,
      transactionHash: transactionHash
    });
    
    await newVote.save();
    
    // Update candidate vote count
    await Candidate.findByIdAndUpdate(candidateId, {
      $inc: { voteCount: 1 }
    });
    
    res.status(200).json({
      success: true,
      message: 'Vote cast successfully',
      data: {
        voteId: newVote._id,
        electionId,
        candidateId,
        voterId,
        timestamp: newVote.timestamp
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error casting vote',
      error: error.message
    });
  }
});

// Get votes for an election
app.get('/api/vote/:electionId', async (req, res) => {
  try {
    const { electionId } = req.params;
    
    const votes = await Vote.find({ electionId })
      .populate('studentId', 'matricNumber fullName')
      .populate('candidateId', 'position')
      .sort({ timestamp: -1 });
    
    res.status(200).json({
      success: true,
      message: 'Votes retrieved successfully',
      data: {
        electionId,
        votes: votes,
        totalVotes: votes.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving votes',
      error: error.message
    });
  }
});

// Get vote results for an election
app.get('/api/vote/results/:electionId', async (req, res) => {
  try {
    const { electionId } = req.params;
    
    const candidates = await Candidate.find({ electionId })
      .populate('studentId', 'fullName matricNumber')
      .sort({ voteCount: -1 });
    
    const totalVotes = await Vote.countDocuments({ electionId });
    
    const results = candidates.map(candidate => ({
      candidateId: candidate._id,
      candidateName: candidate.studentId.fullName,
      matricNumber: candidate.studentId.matricNumber,
      position: candidate.position,
      voteCount: candidate.voteCount,
      percentage: totalVotes > 0 ? ((candidate.voteCount / totalVotes) * 100).toFixed(2) : 0
    }));
    
    res.status(200).json({
      success: true,
      message: 'Vote results retrieved successfully',
      data: {
        electionId,
        totalVotes,
        results
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving vote results',
      error: error.message
    });
  }
});

// ========== STUDENT ROUTES ==========
// Register a student (admin only)
app.post('/api/students', async (req, res) => {
  try {
    const { address, matricNumber, fullName, faculty, department, level, email } = req.body;
    
    const newStudent = new Student({
      address,
      matricNumber,
      fullName,
      faculty,
      department,
      level,
      email
    });
    
    await newStudent.save();
    
    res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      student: newStudent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error registering student',
      error: error.message
    });
  }
});

// Get all students
app.get('/api/students', async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving students',
      error: error.message
    });
  }
});

// ========== ELECTION ROUTES ==========
// Create election
app.post('/api/elections', async (req, res) => {
  try {
    const { title, description, startTime, endTime, positions, createdBy } = req.body;
    
    const newElection = new Election({
      title,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      positions,
      createdBy
    });
    
    await newElection.save();
    
    res.status(201).json({
      success: true,
      message: 'Election created successfully',
      election: newElection
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating election',
      error: error.message
    });
  }
});

// Get all elections
app.get('/api/elections', async (req, res) => {
  try {
    const elections = await Election.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: elections
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving elections',
      error: error.message
    });
  }
});

// ========== CANDIDATE ROUTES ==========
// Add candidate to election
app.post('/api/candidates', async (req, res) => {
  try {
    const { studentId, electionId, position, manifesto, imageUrl } = req.body;
    
    // Check if student is already a candidate for this position in this election
    const existingCandidate = await Candidate.findOne({
      studentId,
      electionId,
      position
    });
    
    if (existingCandidate) {
      return res.status(400).json({
        success: false,
        message: 'Student is already a candidate for this position'
      });
    }
    
    const newCandidate = new Candidate({
      studentId,
      electionId,
      position,
      manifesto,
      imageUrl
    });
    
    await newCandidate.save();
    
    res.status(201).json({
      success: true,
      message: 'Candidate added successfully',
      candidate: newCandidate
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding candidate',
      error: error.message
    });
  }
});

// Get candidates for an election
app.get('/api/candidates/:electionId', async (req, res) => {
  try {
    const { electionId } = req.params;
    
    const candidates = await Candidate.find({ electionId })
      .populate('studentId', 'fullName matricNumber faculty department level')
      .sort({ position: 1, createdAt: 1 });
    
    res.status(200).json({
      success: true,
      data: candidates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving candidates',
      error: error.message
    });
  }
});

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => {
    console.log("MongoDB connected");
})
.catch(err => console.error(err));

// ...existing code...

// SEND CODE API
app.post('/api/send-code', async (req, res) => {
  const { email } = req.body;
  const code = generateCode();
  const expires = Date.now() + 5 * 60 * 1000; // 5 minutes

  // Save code temporarily
  codes.set(email, { code, expires });

  // Email the code using nodemailer
  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  try {
    await transporter.sendMail({
      from: `"Unilorin Election System" <${process.env.EMAIL}>`,
      to: email,
      subject: 'Your Voting Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Verification Code</h2>
          <p>Your verification code is: <strong style="font-size: 24px; color: #2563eb;">${code}</strong></p>
          <p>This code will expire in 5 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    });
    res.json({ success: true, message: 'Verification code sent successfully' });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ success: false, error: 'Failed to send verification code' });
  }
});

// ...existing code...

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));