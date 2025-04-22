// const mongoose = require("mongoose");
// const dotenv = require("dotenv");
// const http = require('http');
// const socketIo = require('socket.io');
// const app = require('./app')

// process.on("unhandledException", (err) => {
//   console.log("UNCAUGHT EXCEPTION 💥 Shutting down.");
//   console.log(err.name, err.message);
//   process.exit(1);
// });

// dotenv.config({ path: "./config.env" });
// const app = require("./app");

// const DB = process.env.DATABASE.replace(
//   "<PASSWORD>",
//   process.env.DATABASE_PASSWORD
// );

// mongoose.connect(DB).then((con) => console.log("DB connection successful!"));

// const port = process.env.PORT;
// const server = app.listen(port, () => {
//   console.log(`App running on port ${port}...`);
// });

// process.on("unhandledRejection", (err) => {
//   console.log("UNHANDLED REJECTION 💥 Shutting down.");
//   console.log(err.name, err.message);
//   server.close(() => {
//     process.exit(1);
//   });
// });

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const http = require('http');
const socketIo = require('socket.io');
const app = require('./app');

process.on("unhandledException", (err) => {
  console.log("UNCAUGHT EXCEPTION 💥 Shutting down.");
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: "./config.env" });

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

mongoose.connect(DB).then(() => console.log("DB connection successful!"));

// Create HTTP server (needed for socket.io)
const httpServer = http.createServer(app);

// Attach Socket.IO to the server
const io = socketIo(httpServer, {
  cors: {
    origin: '*', // Replace with your frontend URL in production
    methods: ['GET', 'POST']
  }
});

// Make io globally available
global.io = io;

// Handle socket connections
io.on('connection', (socket) => {
  console.log('🟢 New client connected:', socket.id);

  // Optional: join user's personal room by userId
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  socket.on('disconnect', () => {
    console.log('🔴 Client disconnected:', socket.id);
  });
});

// Start server
const port = process.env.PORT;
httpServer.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION 💥 Shutting down.");
  console.log(err.name, err.message);
  httpServer.close(() => {
    process.exit(1);
  });
});

