const express = require('express');
const router = express.Router();
const Vote = require('../models/vote');  // Import the Vote model

// POST route to save a vote
router.post('/', async (req, res) => {
  const { studentId, candidateId } = req.body;
  try {
    const newVote = new Vote({ studentId, candidateId });
    await newVote.save();
    res.status(200).send('Vote saved successfully!');
  } catch (err) {
    res.status(500).send('Error saving vote');
  }
});

// GET route to fetch all votes
router.get('/', async (req, res) => {
  try {
    const votes = await Vote.find();  // Find all votes in the database
    res.status(200).json(votes);  // Return the votes as a JSON response
  } catch (err) {
    res.status(500).send('Error retrieving votes');
  }
});

module.exports = router;
