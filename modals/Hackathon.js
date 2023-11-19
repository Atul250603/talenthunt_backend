const mongoose=require('mongoose');
let hackathonSchema=new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user'
    },
    hackathonTitle:String,
    description:String,
    rules:Array,
    prizes:Array,
    regStartDate:Date,
    regEndDate:Date,
    hackStartDate:Date,
    hackEndDate:Date,
    organizer:String,
    sameOrg:{
        type:Boolean,
        default:false
    }
})
module.exports=mongoose.model('hackathon',hackathonSchema);