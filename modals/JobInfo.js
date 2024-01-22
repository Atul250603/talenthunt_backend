const mongoose=require('mongoose');
let jobinfoSchema=new mongoose.Schema({
    jobId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'job'
    },
   applied:Array,
   nonshortlisted:Array,
   shortlisted:Array,
   assignments:Array,
   interviews:Array
})
module.exports=mongoose.model('jobinfo',jobinfoSchema);