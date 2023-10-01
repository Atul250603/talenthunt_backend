const mongoose=require('mongoose');
let userSchema=new mongoose.Schema({
    email:String,
    password:String,
    type:String
})
module.exports=mongoose.model('user',userSchema);