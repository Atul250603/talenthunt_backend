const mongoose=require('mongoose');
const mongoURI=process.env.MONGOURI;
const connectToMongo=async()=>{
    if(await mongoose.connect(mongoURI))
        console.log("Connected to the DB Successfully")
    else 
        console.log("Failed to connect to the database")
}
module.exports=connectToMongo;