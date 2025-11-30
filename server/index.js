require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const investmentsRouter = require('./routes/investments');
const remindersRouter = require('./routes/reminders');
const usersRouter = require('./routes/users');

const app = express();
app.use(cors());
app.use(express.json());

// Simple request logger to help debugging incoming API calls
app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.originalUrl);
  next();
});

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI;

// Improve mongoose behavior and logging
mongoose.set('strictQuery', false);

if (!MONGODB_URI) {
  console.error('No MONGODB_URI set in environment. See server/.env.example');
  process.exit(1);
} else {
  const connectOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // increase server selection timeout to 30s to reduce transient DNS/latency failures
    serverSelectionTimeoutMS: 30000
  };

  mongoose.connect(MONGODB_URI, connectOptions)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => {
      console.error('MongoDB connection error', err);
      // exit so the process manager can restart if needed; avoids running app without DB
      process.exit(1);
    });

  // connection event logging
  mongoose.connection.on('connected', () => console.log('Mongoose connected to', mongoose.connection.name));
  mongoose.connection.on('error', err => console.error('Mongoose connection error', err));
  mongoose.connection.on('disconnected', () => console.warn('Mongoose disconnected'));
  mongoose.connection.on('reconnected', () => console.log('Mongoose reconnected'));
}

app.use('/api/investments', investmentsRouter);
app.use('/api/reminders', remindersRouter);
app.use('/api/users', usersRouter);

// Debug endpoint: report mongoose connection info (safe, no secrets)
app.get('/api/debug/db', (req, res) => {
  try {
    const conn = mongoose.connection || {};
    res.json({
      ok: true,
      readyState: conn.readyState || 0,
      dbName: conn.name || null
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/', (req, res) => res.json({ ok: true, msg: 'Mutual funds API' }));

// Start the HTTP server only after MongoDB connection is established.
function startServer() {
  app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
}

if (mongoose.connection.readyState === 1) {
  // already connected synchronously
  startServer();
} else {
  mongoose.connection.once('open', () => {
    // open event indicates successful connection
    startServer();
  });
}
