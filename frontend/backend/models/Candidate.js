const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  electionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Election',
    required: true
  },
  position: {
    type: String,
    required: true
  },
  manifesto: {
    type: String,
    required: false
  },
  imageUrl: {
    type: String,
    required: false
  },
  voteCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Ensure a student can only be a candidate once per position per election
candidateSchema.index({ studentId: 1, electionId: 1, position: 1 }, { unique: true });

module.exports = mongoose.model('Candidate', candidateSchema);