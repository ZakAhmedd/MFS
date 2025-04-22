const mongoose = require("mongoose");
const dotenv = require("dotenv");
const http = require('http');
const socketIo = require('socket.io');
const app = require('./app');
const socket = require('./socket')

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

const httpServer = http.createServer(app);

// Init Socket.IO
socket.init(httpServer);

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

