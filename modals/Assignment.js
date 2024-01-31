const mongoose=require('mongoose');
let assignmentSchema=new mongoose.Schema({
    jobId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'job'
    },
    assignmentname:String,
    assignmentdate:Date,
    assignmentduration:Number,
    assignmentmark:Number,
    negativemarking:Boolean,
    questions:Array,
    solutions:Array
})
module.exports=mongoose.model('assignment',assignmentSchema);