const mongoose = require('mongoose');

const ReminderSchema = new mongoose.Schema({
  userEmail: { type: String },
  type: { type: String },
  title: { type: String },
  body: { type: String },
  amount: { type: Number },
  dueDate: { type: String },
  scheduledAt: { type: Date },
  recurring: { type: String },
  status: { type: String, default: 'scheduled' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Reminder', ReminderSchema);
