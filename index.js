require('dotenv').config()
const express=require('express');
const app=express();
const connectToMongo=require('./db');
const cors=require('cors');
const socket=require('socket.io');
const readAndImportJSON=require('./loadquestionscript.js');
const port=process.env.PORT||5000;
const { PeerServer } = require("peer");
const peerServer = PeerServer({ port: 9000, path: "/myapp" });
app.use(express.json());
app.use(cors());
connectToMongo();
readAndImportJSON();
app.use('/auth',require('./routes/auth.js'));
app.use('/user',require('./routes/user.js'));
app.use('/project',require('./routes/project.js'));
app.use('/hackathon',require('./routes/hackathon.js'));
app.use('/job',require('./routes/job.js'));
app.use('/message',require('./routes/message.js'));
const server=app.listen(port,()=>{
    console.log(`Server is running on port ${port}`);
})
const io=socket(server,{
    cors:{
        origin:'http://localhost:3000',
        credentials:true
    }
})
let onlineUsers=new Map();
let sockettopeer=new Map();
let sockettoroom=new Map();
io.on('connection',(socket)=>{
    let chatsocket=socket;
    const myid=socket.id;
    socket.on('adduser',(id)=>{
        onlineUsers.set(id,socket.id);
    })
    socket.on('share-peer',async({peerId,roomId})=>{
      sockettopeer.set(myid,peerId);
      sockettoroom.set(myid,roomId);
      await socket.join(roomId);
      socket.to(roomId).emit('remote-peer',{peerId:peerId,from:myid});
    })
    socket.on('share-my-peerid',({to,peerId})=>{
      socket.to(to).emit('remote-peer-history',{peerId,from:myid});
    })
    socket.on('send-msg',({room,message})=>{
        socket.to(room).emit('msg-received',{message});
    })
    socket.on('disconnecting',()=>{
       let id=sockettopeer.get(myid);
       let room=sockettoroom.get(myid);
       onlineUsers.delete(id);
       sockettopeer.delete(myid);
       sockettoroom.delete(myid);
       io.in(room).emit("user-disconnected",{id:myid,peerId:id});
    })
    socket.on("sendmsg",(data)=>{
        const sendusersocket=onlineUsers.get(data.to);
        if(sendusersocket){
            socket.to(sendusersocket).emit("msgrcv",data.message);
        }
    })
})