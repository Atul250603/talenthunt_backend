const mongoose=require('mongoose');
let userSchema=new mongoose.Schema({
    email:String,
    password:String,
    type:String,
    profileCompleted:{
        type:Boolean,
        default:false
    }
})
module.exports=mongoose.model('user',userSchema);