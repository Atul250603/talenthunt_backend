const mongoose=require('mongoose');
let jobSchema=new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user'
    },
    jobTitle:String,
    description:String,
    organizer:String,
    salary:String,
    location:String
})
module.exports=mongoose.model('job',jobSchema);