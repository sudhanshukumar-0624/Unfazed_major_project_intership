require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./src/config/db');
const chatSocket = require('./src/sockets/chatSocket');
const fs = require('fs');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Create HTTP server (needed for Socket.io)
const server = http.createServer(app);

// Attach Socket.io to the server
const io = new Server(server, {
  cors: {
    origin: [
      process.env.CLIENT_URL,
      'https://unfazed-major-project-intership.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000'
    ].filter(Boolean),
    methods: ['GET', 'POST'],
  },
});

// Register chat socket handlers
chatSocket(io);

// Ensure uploads & invoices directories exist
['uploads', 'invoices'].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created /${dir} directory`);
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Unfazed API running on http://localhost:${PORT}`);
  console.log(`📡 Socket.io ready for real-time chat`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
