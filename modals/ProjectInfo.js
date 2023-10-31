const mongoose=require('mongoose');
let projectinfoSchema=new mongoose.Schema({
    projectId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'project'
    },
    rejected:Array,
    accepted:Array,
    pending:Array,
    rejectedByCreator:Array
})
module.exports=mongoose.model('projectinfo',projectinfoSchema);