require('dotenv').config()
const express=require('express');
const app=express();
const connectToMongo=require('./db');
const cors=require('cors');
const socket=require('socket.io');
const port=process.env.PORT;
app.use(express.json());
app.use(cors());
connectToMongo();
app.use('/auth',require('./routes/auth.js'));
app.use('/user',require('./routes/user.js'));
app.use('/project',require('./routes/project.js'));
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
io.on('connection',(socket)=>{
    let chatsocket=socket;
    socket.on('adduser',(id)=>{
        onlineUsers.set(id,socket.id);
    })
    socket.on("sendmsg",(data)=>{
        const sendusersocket=onlineUsers.get(data.to);
        if(sendusersocket){
            socket.to(sendusersocket).emit("msgrcv",data.message);
        }
    })
})