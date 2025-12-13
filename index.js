require('dotenv').config()
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const { ExpressPeerServer } = require("peer");

const connectToMongo = require('./db');
const readAndImportJSON = require('./loadquestionscript.js');

const app = express();
const port = process.env.PORT || 5000;

/* middleware */
app.use(express.json());
app.use(cors());

/* db + scripts */
connectToMongo();
readAndImportJSON();

/* routes */
app.use('/auth', require('./routes/auth.js'));
app.use('/user', require('./routes/user.js'));
app.use('/project', require('./routes/project.js'));
app.use('/hackathon', require('./routes/hackathon.js'));
app.use('/job', require('./routes/job.js'));
app.use('/message', require('./routes/message.js'));

/* ✅ CREATE HTTP SERVER */
const server = http.createServer(app);

/* ✅ PEER SERVER */
app.use('/myapp', ExpressPeerServer(server, { debug: true }));

/* ✅ SOCKET.IO */
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"], // important for Render
});

/* socket logic */
let onlineUsers = new Map();
let sockettopeer = new Map();
let sockettoroom = new Map();

io.on('connection', (socket) => {
  const myid = socket.id;

  socket.on('adduser', (id) => {
    onlineUsers.set(id, socket.id);
  });

  socket.on('share-peer', async ({ peerId, roomId }) => {
    sockettopeer.set(myid, peerId);
    sockettoroom.set(myid, roomId);
    await socket.join(roomId);
    socket.to(roomId).emit('remote-peer', { peerId, from: myid });
  });

  socket.on('share-my-peerid', ({ to, peerId }) => {
    socket.to(to).emit('remote-peer-history', { peerId, from: myid });
  });

  socket.on('send-msg', ({ room, message }) => {
    socket.to(room).emit('msg-received', { message });
  });

  socket.on('disconnecting', () => {
    const peerId = sockettopeer.get(myid);
    const room = sockettoroom.get(myid);

    sockettopeer.delete(myid);
    sockettoroom.delete(myid);

    if (room) {
      socket.to(room).emit("user-disconnected", {
        id: myid,
        peerId
      });
    }
  });

  socket.on("sendmsg", (data) => {
    const sendusersocket = onlineUsers.get(data.to);
    if (sendusersocket) {
      socket.to(sendusersocket).emit("msgrcv", data.message);
    }
  });
});

/* ✅ START SERVER LAST */
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
