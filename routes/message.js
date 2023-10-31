const express=require('express');
const router=express.Router();
const User=require('../modals/User.js');
const Project=require('../modals/Project.js');
const UserInfo=require('../modals/UserInfo.js');
const mailHelper=require('../mailController.js');
const bcryptjs=require('bcryptjs');
const jwt=require('jsonwebtoken');
const secret=process.env.SECRET;
const fetchuser=require('../middleware');
const { Model } = require('mongoose');
const ProjectInfo = require('../modals/ProjectInfo.js');
const Message=require('../modals/Message.js');
router.post('/send',fetchuser,async(req,res)=>{
    try{
        let {projectId,to,message}=req.body;
        let user=req.user;
        let from=user._id;
        const userdoc=await User.findOne({_id:from});
        if(!userdoc){
            throw "Error In Finding The User";
        }
        const receiver=await User.findOne({_id:to});
        if(!receiver){
            throw "Error In Finding The Receiver";
        }
        let project=await Project.findOne({_id:projectId,userId:from});
        if(!project){
            project=await Project.findOne({_id:projectId});
            if(project){
                let projectinfo=await ProjectInfo.findOne({projectId:project._id,accepted:{$in:[from]}});
                if(!projectinfo){
                    throw "Error In Finding The Project";
                }
            }
            else{
                throw "Error In Finding The Project";
            }
        }
        else{
            const projectinfo=await ProjectInfo.findOne({projectId:projectId});
            let idx=projectinfo.accepted.indexOf(to);
            if(idx<0){
                throw "Creator Haven't Accepted Your Request Yet";
            }
        }
        const messageinfo=await Message.findOne({chatUsers:{$all:[from,to]}});
        if(!messageinfo){
            let newmessage=new Message({
                chatUsers:[from,to],
                messages:[{
                    sender:from,
                    message:message
                }]
            })
            let msg=await newmessage.save();
            if(!msg){
                throw "Error In Sending The Message";
            }
            res.status(200).json({success:"Successfully Sent The Message",messages:msg});
        }
        else{
            let newmsg={
                sender:from,
                message:message
            }
            let messages=[...messageinfo.messages,newmsg];
            const messageinfo1=await Message.updateOne({chatUsers:{$all:[from,to]}},{$set:{messages:messages}});
            if(!messageinfo1){
                throw "Error In Sending The Message";
            }
            res.status(200).json({success:"Successfully Sent The Message",messages:messageinfo1});
        }
    }
    catch(error){
        res.status(501).json({error:error});
    }
});
router.post('/allmsg',fetchuser,async(req,res)=>{
    try{
        let {projectId,to}=req.body;
        let user=req.user;
        let from=user._id;
        const userdoc=await User.findOne({_id:from});
        if(!userdoc){
            throw "Error In Finding The User";
        }
        const receiver=await User.findOne({_id:to});
        if(!receiver){
            throw "Error In Finding The Receiver";
        }
        let project=await Project.findOne({_id:projectId});
        if(!project || (!project.userId.equals(from) && !project.userId.equals(to))){
            throw "Error In Finding The Project";
        }
        const projectinfo=await ProjectInfo.findOne({projectId:projectId});
        if(!projectinfo){
            throw "Error In Finding The Project";
        }
        let idx=projectinfo.accepted.indexOf(to);
        let idx1=projectinfo.accepted.indexOf(from);
        if(idx<0 && idx1<0){
            throw "Creator Haven't Accepted Your Request Yet";
        }
        let messageinfo=await Message.findOne({chatUsers:{$all:[from,to]}});
        if(!messageinfo){
            res.status(200).json({success:"Successfully Fetched The Messages",messages:{messages:[],uid:from}});
        }
        else{
            messageinfo=messageinfo.messages.map((element)=>{
                return {
                    myself:(element.sender===from)?true:false,
                    message:element.message
                }
            })
            res.status(200).json({success:"Successfully Fetched The Messages",messages:{messages:[...messageinfo],uid:from}});
        }
    }
    catch(error){
        res.status(501).json({error:error});
    }
})
module.exports=router;