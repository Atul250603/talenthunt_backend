const mongoose=require('mongoose');
const questionschema=new mongoose.Schema({
    question:String,
    options:Array,
    correct_answer:String
});
module.exports=mongoose.model('question',questionschema);