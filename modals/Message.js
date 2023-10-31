const mongoose=require('mongoose');
let messageSchema=new mongoose.Schema({
    chatUsers:{
        type:Array
    },
    messages:Array
})
module.exports=mongoose.model('message',messageSchema);