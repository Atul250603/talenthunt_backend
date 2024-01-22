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
        let pending=[];
        let applied=jobinfo.applied.filter((val)=>jobinfo.shortlisted.indexOf(val)===-1 && jobinfo.nonshortlisted.indexOf(val)===-1);
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
            pending.push({
                userInfo:userinfo
            })
        }
        for(let i=0;i<jobinfo.nonshortlisted.length;i++){
            let userinfo=await UserInfo.findOne({userId:applied[i]});
            if(!userinfo){
                throw "Error In Finding The Participant";
            }
            nonshortlisted.push({
                userInfo:userinfo
            })
        }
        
        res.status(200).json({success:"Successfully Listed The Job",job:{...jobinfo._doc,nonshortlisted,shortlisted,pending}});
    }
    catch(error){
        res.status(501).json({error:error});
    }
})
router.post('/getalljobs',fetchuser,async(req,res)=>{
    try{
        let user=req.user;
        let uid=user._id;
        const userdoc=await User.findOne({_id:uid});
        if(!userdoc){
            throw "Error In Finding The User";
        }
        const currDate=new Date();
        const job=await Job.find({});
        if(!job){
            throw "No Job Is Live";
        }
        const jobs=[];
        for(let i=0;i<job.length;i++){
             if(job[i].appdeadline.toLocaleDateString()>=currDate.toLocaleDateString()){
                 const jobinfo=await JobInfo.findOne({jobId:job[i]._id,applied:{$in:[uid]}});
                 if(!jobinfo){
                     jobs.push(job[i]);
                    }
                }
            };
        res.status(200).json({success:"Successfully Listed All The Jobs",jobs:jobs});
    }
    catch(error){
        res.status(501).json({error:error});
    }
})
router.post('/shortlist/:jobId/:id',fetchuser,async(req,res)=>{
    try{
        let user=req.user;
        let uid=user._id;
        let {jobId,id}=req.params;
        const userdoc=await User.findOne({_id:uid});
        if(!userdoc){
            throw "Error In Finding The User";
        }
        const job=await Job.findOne({_id:jobId,userId:uid});
        if(!job){
            throw 'No Such Job Exists';
        }
        let jobinfo=await JobInfo.findOne({jobId:jobId,applied:{$in:[id]},nonshortlisted:{$nin:[id]},shortlisted:{$nin:[id]}});
        if(!jobinfo){
            throw 'Error In Shortlisting The Candidate';
        }
        let shortlisted=[...jobinfo.shortlisted,id];
        jobinfo=await JobInfo.updateOne({jobId:jobId},{$set:{shortlisted}});
        if(!jobinfo){
            throw 'Error In Shortlisting The Candidate';
        }
        res.status(200).json({success:"Successfully Shortlisted The Candidate"});
    }
    catch(error){
        res.status(501).json({error:error})
    }
})
router.post('/unshortlist/:jobId/:id',fetchuser,async(req,res)=>{
    try{
        let source=req.body.source;
        let user=req.user;
        let uid=user._id;
        let {jobId,id}=req.params;
        const userdoc=await User.findOne({_id:uid});
        if(!userdoc){
            throw "Error In Finding The User";
        }
        const job=await Job.findOne({_id:jobId,userId:uid});
        if(!job){
            throw 'No Such Job Exists';
        }
        if(source===0){
            let jobinfo=await JobInfo.findOne({jobId:jobId,applied:{$in:[id]},nonshortlisted:{$nin:[id]},shortlisted:{$nin:[id]}});
            if(!jobinfo){
                throw 'Error In Unshortlisting The Candidate';
            }
            let nonshortlisted=[...jobinfo.nonshortlisted,id];
            jobinfo=await JobInfo.updateOne({jobId:jobId},{$set:{nonshortlisted}});
            if(!jobinfo){
                throw 'Error In Unshortlisting The Candidate';
            }
            res.status(200).json({success:"Successfully Unshortlisted The Candidate"});
        }
        else if(source===1){
            let jobinfo=await JobInfo.findOne({jobId:jobId,applied:{$in:[id]},nonshortlisted:{$nin:[id]},shortlisted:{$in:[id]}});
            if(!jobinfo){
                throw 'Error In Unshortlisting The Candidate';
            }
            let shortlisted=[...jobinfo.shortlisted];
            let idx=shortlisted.indexOf(id);
            if(idx==-1){
                throw 'Error In Unshortlisting The Candidate';
            }
            shortlisted.splice(idx,1);
            let nonshortlisted=[...jobinfo.nonshortlisted,id];
            jobinfo=await JobInfo.updateOne({jobId:jobId},{$set:{shortlisted,nonshortlisted}});
            if(!jobinfo){
                throw 'Error In Unshortlisting The Candidate';
            }
            res.status(200).json({success:"Successfully Unshortlisted The Candidate"});
        }
        else{
            throw 'Some Error Occured';
        }
    }
    catch(error){
        res.status(501).json({error:error});
    }
})
router.post('/getprofile/:id/:jobId',fetchuser,async(req,res)=>{
    try{ 
        let user=req.user;
        let uid=user._id;
        const doc=await User.findOne({_id:uid});
        if(!doc){
           throw "No Information About User Exists";
        }
        const doc1=await User.findOne({_id:req.params.id});
        if(!doc1){
           throw "No Information About User Exists";
        }
        if(!doc1.profileCompleted){
            throw "User Profile Not Completed";
        }
        let job=await Job.findOne({_id:req.params.jobId,userId:uid});
        if(!job){
            throw "Error In Finding The Job";
        }
        const info=await UserInfo.findOne({userId:req.params.id});
        res.status(200).json({success:"Displaying The Profile Information",user_info:info});
    }
    catch(error){
        res.status(501).json({error:error})
    }
})
module.exports=router;