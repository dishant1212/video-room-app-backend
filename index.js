// server.js
const express = require('express');
const bodyparser = require('body-parser');
const http = require('http');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 8000;

const app = express();
app.use(bodyparser.json());

// create http server and attach express
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'https://your-production-domain.com'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const emailToSocketMapping = new Map();
const socketToEmailMapping = new Map();

io.on('connection', (socket) => {
  console.log('New socket connected:', socket.id);

  socket.on('join-room', (data) => {
    const { emailId, roomId } = data;
    emailToSocketMapping.set(emailId, socket.id);
    socketToEmailMapping.set(socket.id, emailId);
    socket.join(roomId);
    socket.emit('joined-room', roomId);
    socket.broadcast.emit('user-joined', { emailId });

    socket.on('call-user', (data) => {
      const { emailId, offer } = data;
      const fromEmail = socketToEmailMapping.get(socket.id);
      const socketId = emailToSocketMapping.get(emailId);
      if (socketId)
        socket.to(socketId).emit('incomming-call', { from: fromEmail, offer });
    });

    socket.on('call-accpeted', (data) => {
      const { emailId, ans } = data;
      const socketId = emailToSocketMapping.get(emailId);
      if (socketId) socket.to(socketId).emit('call-accpeted', { ans });
    });
  });

  socket.on('disconnect', () => {
    const email = socketToEmailMapping.get(socket.id);
    emailToSocketMapping.delete(email);
    socketToEmailMapping.delete(socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
