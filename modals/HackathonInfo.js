const mongoose=require('mongoose');
let hackathoninfoSchema=new mongoose.Schema({
    hackathonId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'hackathon'
    },
   applied:Array,
   submissions:Array
})
module.exports=mongoose.model('hackathoninfo',hackathoninfoSchema);