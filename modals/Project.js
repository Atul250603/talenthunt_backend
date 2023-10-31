const mongoose=require('mongoose');
let projectSchema=new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user'
    },
    projectTitle:String,
    description:String,
    skills:Array,
    creator:String,
    sameOrg:{
        type:Boolean,
        default:false
    }
})
module.exports=mongoose.model('project',projectSchema);