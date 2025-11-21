const express = require('express');
const bodyparser = require('body-parser');
const { Server } = require('socket.io');

const io = new Server({
  cors: true,
});
const app = express();

app.use(bodyparser.json());

const emailToSocketMapping = new Map();
const socketToEmailMapping = new Map();

io.on('connection', (socket) => {
  console.log('New connection!');
  socket.on('join-room', (data) => {
    const { emailId, roomId } = data;
    console.log('user', emailId, roomId);
    // Store user email → socket ID
    emailToSocketMapping.set(emailId, socket.id);
    socketToEmailMapping.set(socket.id, emailId);
    socket.join(roomId);
    socket.emit('joined-room', roomId);
    socket.broadcast.emit('user-joined', { emailId });

    socket.on('call-user', (data) => {
      const { emailId, offer } = data;
      const formEmail = socketToEmailMapping.get(socket.id);
      const socketId = emailToSocketMapping.get(emailId);
      socket.to(socketId).emit('incomming-call', { from: formEmail, offer });
    });

    socket.on('call-accpeted', (data) => {
      const { emailId, ans } = data;
      const socketId = emailToSocketMapping.get(emailId);
      socket.to(socketId).emit('call-accpeted', { ans });
    });
  });
});

app.listen(8000, () => {
  console.log('Http server listening port 8000');
});

io.listen(8001);
