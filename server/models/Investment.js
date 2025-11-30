const mongoose = require('mongoose');

const InvestmentSchema = new mongoose.Schema({
  userEmail: { type: String },
  name: { type: String, required: true },
  amount: { type: Number, default: 0 },
  date: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Investment', InvestmentSchema);
