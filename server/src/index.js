require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const { Server } = require('socket.io');

const setupSocketHandlers = require('./socket');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST'],
}));

app.use(helmet());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  setupSocketHandlers(io, socket);
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});