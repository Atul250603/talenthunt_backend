require('dotenv').config()
const express=require('express');
const app=express();
const connectToMongo=require('./db');
const cors=require('cors');
const port=process.env.PORT;
app.use(express.json());
app.use(cors());
connectToMongo();
app.use('/auth',require('./routes/auth.js'))
app.listen(port,()=>{
    console.log(`Server is running on port ${port}`);
})