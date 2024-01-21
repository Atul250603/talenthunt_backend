const express=require('express');
const router=express.Router();
const User=require('../modals/User.js');
const UserInfo=require('../modals/UserInfo.js');
const JobInfo=require('../modals/JobInfo.js');
const Job=require('../modals/Jobs.js');
const fetchuser=require('../middleware');
router.post('/createjob',fetchuser,async(req,res)=>{
    try{
        let data=req.body;
        let user=req.user;
        let uid=user._id;
        const userdoc=await User.findOne({_id:uid});
        if(!userdoc){
            throw "Error In Finding The User";
        }
        let finaldata={
            ...data,userId:uid
        }
        const job=new Job(finaldata);
        const resp=await job.save();
        if(resp){
            res.status(200).json({success:"Successfully Listed The Job",job:resp});
        }
        else{
            throw "Error In Listing The Job";
        }
    }
    catch(error){
        res.status(501).json({error:error})
    }
});
router.post('/getjobs',fetchuser,async(req,res)=>{
    try{
        let user=req.user;
        let uid=user._id;
        const userdoc=await User.findOne({_id:uid});
        if(!userdoc){
            throw "Error In Finding The User";
        }
        const resp=await Job.find({userId:uid});
        if(resp && resp.length>0){
            res.status(200).json({success:"Successfully Listed The Jobs",jobs:resp});
        }
        else{
            throw "Error In Listing The Jobs";
        }

    }
    catch(error){
        res.status(501).json({error:error});
    }
})
router.post('/applyjob/:id',fetchuser,async(req,res)=>{
    try{
        let user=req.user;
        let uid=user._id;
        const userdoc=await User.findOne({_id:uid});
        if(!userdoc){
            throw "Error In Finding The User";
        }
        const jobinfo=await JobInfo.findOne({jobId:req.params.id});
        if(!jobinfo){
            const job=await Job.findOne({_id:req.params.id});
            if(!job){
                throw "Error In Finding The Job";
            }
            const data=new JobInfo({
                jobId:req.params.id,
                applied:[uid]
            })
            const resp=await data.save();
            if(!resp){
                throw "Error In Applying For The Job";
            }
            res.status(200).json({success:"Successfully Applied For The Job"});
        }
        else{
            const applied=[...jobinfo.applied,uid];
            const updatejobinfo=await JobInfo.updateOne({jobId:req.params.id},{$set:{applied:applied}});
            if(!updatejobinfo){
                throw "Error In Applying For The Job";
            }
            res.status(200).json({success:"Successfully Applied For The Job"});
        }
    }
    catch(error){
        res.status(501).json({error:error});
    }
})
router.post('/myjob/:id',fetchuser,async(req,res)=>{
    try{
        let user=req.user;
        let uid=user._id;
        const userdoc=await User.findOne({_id:uid});
        if(!userdoc){
            throw "Error In Finding The User";
        }
        const jobinfo=await JobInfo.findOne({jobId:req.params.id}).populate('jobId');
        if(!jobinfo){
            throw "No One Has Applied To The Job Yet";
        }
        if(String(jobinfo.jobId.userId)!==String(uid)){
            throw "You Are Not The Creator Of This Job";
        }
        let nonshortlisted=[];
        let shortlisted=[];
        let applied=jobinfo.applied.filter((val)=>jobinfo.shortlisted.indexOf(val)===-1);
        for(let i=0;i<jobinfo.shortlisted.length;i++){
            let userinfo=await UserInfo.findOne({userId:jobinfo.shortlisted[i]});
            if(!userinfo){
                throw "Error In Finding The Participant";
            }
            shortlisted.push({
                userInfo:userinfo
            })
        }
        for(let i=0;i<applied.length;i++){
            let userinfo=await UserInfo.findOne({userId:applied[i]});
            if(!userinfo){
                throw "Error In Finding The Participant";
            }
            nonshortlisted.push({
                userInfo:userinfo
            })
        }
        res.status(200).json({success:"Successfully Listed The Job",job:{...jobinfo._doc,nonshortlisted,shortlisted}});
    }
    catch(error){
        res.status(501).json({error:error});
    }
})
module.exports=router;