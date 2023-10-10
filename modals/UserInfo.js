const mongoose=require('mongoose');
let userinfoSchema=new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user'
    },
    fname:String,
    lname:String,
    email:String,
    currorg:String,
    education:Array,
    workexp:Array,
    skills:Array,
    socials:Array,
    profileImg:String,
    resume:String
})
module.exports=mongoose.model('userinfo',userinfoSchema);