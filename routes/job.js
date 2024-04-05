const express=require('express');
const router=express.Router();
const User=require('../modals/User.js');
const UserInfo=require('../modals/UserInfo.js');
const JobInfo=require('../modals/JobInfo.js');
const Job=require('../modals/Jobs.js');
const fetchuser=require('../middleware');
const Questions=require('../modals/Question.js');
const Assignment=require('../modals/Assignment.js');
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
        const job=await Job.findOne({_id:req.params.id});
        if(!job){
            throw "Error In Finding The Job";
        }
        const jobinfo=await JobInfo.findOne({jobId:req.params.id}).populate('jobId');
        if(!jobinfo){
            
            if(String(job.userId)!==String(uid)){
                throw "You Are Not The Creator Of This Job";
            }
            res.status(200).json({success:"Successfully Listed The Job",job:{jobId:job}});
        }
        else{
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
            let userinfo=await UserInfo.findOne({userId:jobinfo.nonshortlisted[i]});
            if(!userinfo){
                throw "Error In Finding The Participant";
            }
            nonshortlisted.push({
                userInfo:userinfo
            })
        }
        
        res.status(200).json({success:"Successfully Listed The Job",job:{...jobinfo._doc,nonshortlisted,shortlisted,pending}});
    }
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
             if(job[i].appdeadline.getTime()>=currDate.getTime()){
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
            let updatejobinfo=await JobInfo.updateOne({jobId:jobId},{$set:{shortlisted,nonshortlisted}});
            if(!updatejobinfo){
                throw 'Error In Unshortlisting The Candidate';
            }
            
            for(let i=0;i<jobinfo.assignments.length;i++){
                let assignment=await Assignment.updateOne({_id:jobinfo.assignments[i].assignmentId},{$pull:{solutions:{userId:req.params.id}}});
                if(!assignment){
                    throw "Error In Unshortlisting The Candidate";
                }
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
router.post('/questions',fetchuser,async(req,res)=>{
    try{
        let user=req.user;
        let uid=user._id;
        const doc=await User.findOne({_id:uid});
        if(!doc){
           throw "No Information About User Exists";
        }
        const doc1=await Job.findOne({userId:uid});
        if(!doc1){
            throw "Not Authorized To View Questionnaire";
        }
        const questions=await Questions.find({});
        if(!questions || !questions.length){
            throw "Error In Listing The Questions";
        }
        res.status(200).json({success:"Successfully Listed All The Questions",questions});
    }
    catch(error){
        res.status(501).json({error:error});
    }
})
router.post('/createassignment/:id',fetchuser,async(req,res)=>{
    try{
        let user=req.user;
        let uid=user._id;
        const doc=await User.findOne({_id:uid});
        if(!doc){
           throw "No Information About User Exists";
        }
        const doc1=await Job.findOne({_id:req.params.id,userId:uid});
        if(!doc1){
            throw "No Information About Job Exists";
        }
        let assignment=new Assignment(req.body);
        assignment=await assignment.save();
        if(!assignment){
            throw "Error In Creating The Assignment";
        }
        assignment={assignmentId:String(assignment._id),assignmentname:assignment.assignmentname,date:assignment.assignmentdate,duration:assignment.assignmentduration}
        const doc2=await JobInfo.updateOne({jobId:req.params.id},{$push:{assignments:assignment}});
        if(!doc2){
            throw "Error In Creating The Assignment"
        }
        res.status(200).json({success:"Successfully Created The Assignment"})
    }
    catch(error){
        res.status(501).json({error:error});
    }
})
router.post('/applied',fetchuser,async(req,res)=>{
    try{
        let user=req.user;
        let uid=user._id;
        const userdoc=await User.findOne({_id:uid});
        if(!userdoc){
            throw "Error In Finding The User";
        }
        const jobinfo=await JobInfo.find({applied:{$in:[uid]}}).populate('jobId');
        if(!jobinfo){
            throw "You haven't Applied For Jobs";
        }
        res.status(200).json({success:"Successfully Listed Applied Jobs",jobs:jobinfo});
    }
    catch(error){
        res.status(501).json({error:error});
    }
})
router.post('/applied/:id',fetchuser,async(req,res)=>{
    try{
        let user=req.user;
        let uid=user._id;
        const userdoc=await User.findOne({_id:uid});
        if(!userdoc){
            throw "Error In Finding The User";
        }
        let jobinfo=await JobInfo.find({jobId:req.params.id,applied:{$in:[uid]}}).populate('jobId');
        if(!jobinfo){
            throw "You haven't Applied For Jobs";
        }
        let isshortlisted=0; //pending
        let assignment=[];
        let interview=[];
        if(jobinfo[0].shortlisted && jobinfo[0].shortlisted.length>0 && jobinfo[0].shortlisted.indexOf(String(uid))!==-1){
            isshortlisted=1;
            assignment=jobinfo[0].assignments;
            let interviewval=jobinfo[0].interviews.find((element)=>String(element.interviewee.userInfo.userId)===String(uid))
            if(interviewval){
                interview=jobinfo[0].interviews;
            }
        }
        else if(jobinfo[0].nonshortlisted && jobinfo[0].nonshortlisted.length>0 && jobinfo[0].nonshortlisted.indexOf(uid)!==-1){
            isshortlisted=2;
        }
        res.json({success:"Successfully Listed The Job",job:{jobId:jobinfo[0].jobId,isshortlisted,assignment,interview}});
    }
    catch(error){
        res.status(501).json({error:error});
    }
})
router.post('/applied/:id/assignments/:id1',fetchuser,async(req,res)=>{
    try{
        let user=req.user;
        let uid=user._id;
        const userdoc=await User.findOne({_id:uid});
        if(!userdoc){
            throw "Error In Finding The User";
        }
        const jobinfo=await JobInfo.findOne({jobId:req.params.id,shortlisted:{$in:[uid]},assignments:{$elemMatch:{assignmentId:req.params.id1}}});
        if(!jobinfo){
            throw "You haven't Applied For Job";
        }
        const assignment=await Assignment.findOne({_id:req.params.id1});
        if(!assignment){
            throw "Error In Fetching The Assignment"
        }
        const encoded=btoa(JSON.stringify(assignment));
        res.json({success:"Successfully Listed The Assignment",assignment:encoded})
    }
    catch(error){
        res.status(501).json({error:error});
    }
})
router.post('/applied/:id/assignments/:id1/submission',fetchuser,async(req,res)=>{
    try{
        let user=req.user;
        let uid=user._id;
        const userdoc=await User.findOne({_id:uid});
        if(!userdoc){
            throw "Error In Finding The User";
        }
        const jobinfo=await JobInfo.findOne({jobId:req.params.id,shortlisted:{$in:[uid]},assignments:{$elemMatch:{assignmentId:req.params.id1}}});
        if(!jobinfo){
            throw "You haven't Applied For Job";
        }
        let solution={...req.body,userId:uid};
        const assignment=await Assignment.updateOne({_id:req.params.id1},{$push:{solutions:solution}});
        if(!assignment){
            throw "Error In Submitting The Assignment"
        }
        res.json({success:"Successfully Submitted The Assignment"})
    }
    catch(error){
        res.status(501).json({error:error});
    }
})
router.post('/:id/myassignments',fetchuser,async(req,res)=>{
    try{
        let user=req.user;
        let uid=user._id;
        const userdoc=await User.findOne({_id:uid});
        if(!userdoc){
            throw "Error In Finding The User";
        }
        const jobinfo=await Job.findOne({_id:req.params.id,userId:uid});
        if(!jobinfo){
            throw "You Haven't Created This Job";
        }
        const assignments=await JobInfo.findOne({jobId:req.params.id});
        if(!assignments){
            throw "Error In Fetching The Assignments";
        }
        res.json({success:"Successfully Fetched The Assignments",assignments:assignments.assignments});
    }
    catch(error){
        res.status(501).json({error:error});
    }
})
router.post('/:id/myinterviews',fetchuser,async(req,res)=>{
    try{
        let user=req.user;
        let uid=user._id;
        const userdoc=await User.findOne({_id:uid});
        if(!userdoc){
            throw "Error In Finding The User";
        }
        const jobinfo=await Job.findOne({_id:req.params.id,userId:uid});
        if(!jobinfo){
            throw "You Haven't Created This Job";
        }
        const interviews=await JobInfo.findOne({jobId:req.params.id});
        if(!interviews){
            throw "Error In Fetching The Interviews";
        }
        res.json({success:"Successfully Fetched The Interviews",interviews:interviews.interviews});
    }
    catch(error){
        res.status(501).json({error:error});
    }
})
router.post('/:id/myinterview/:interviewid',fetchuser,async(req,res)=>{
    try{
        let user=req.user;
        let uid=user._id;
        const userdoc=await User.findOne({_id:uid});
        if(!userdoc){
            throw "Error In Finding The User";
        }
        const jobinfo=await Job.findOne({_id:req.params.id,userId:uid});
        if(!jobinfo){
            throw "You Haven't Created This Job";
        }
        let interviews=await JobInfo.findOne({jobId:req.params.id});
        if(!interviews){
            throw "Error In Fetching The Interviews";
        }
        const interview=interviews.interviews.find((element)=>element.roomId===req.params.interviewid);
        res.json({success:"Successfully Fetched The Interviews",interview:interview});
    }
    catch(error){
        res.status(501).json({error:error});
    }
})
router.post('/:id/myassignments/:id1',fetchuser,async(req,res)=>{
    try{
        let user=req.user;
        let uid=user._id;
        const userdoc=await User.findOne({_id:uid});
        if(!userdoc){
            throw "Error In Finding The User";
        }
        const job=await Job.findOne({_id:req.params.id,userId:uid});
        if(!job){
            throw "You Haven't Created This Job";
        }
        const jobinfo=await JobInfo.findOne({jobId:req.params.id,assignments:{$elemMatch:{assignmentId:req.params.id1}}})
        if(!jobinfo){
            throw "No Such Assignment Exists";
        }
        let assignments=await Assignment.findOne({_id:req.params.id1});
        if(!assignments){
            throw "Error In Fetching The Assignments";
        }
        for(let i=0;i<assignments.solutions.length;i++){
            let userinfo=await UserInfo.findOne({userId:assignments.solutions[i].userId});
            if(!userinfo){
                throw "Error In Fetching The User Information";
            }
            assignments.solutions[i].userId={userId:userinfo.userId,fname:userinfo.fname,lname:userinfo.lname,profileImg:userinfo.profileImg};
        }
        res.json({success:"Successfully Fetched The Assignments",assignments:assignments});
    }
    catch(error){
        res.status(501).json({error:error});
    }
})

router.post('/scheduleinterview/:id',fetchuser,async(req,res)=>{
    try{
        let user=req.user;
        let uid=user._id;
        const doc=await User.findOne({_id:uid});
        if(!doc){
           throw "No Information About User Exists";
        }
        const doc1=await Job.findOne({_id:req.params.id,userId:uid});
        if(!doc1){
            throw "No Information About Job Exists";
        }
        const data=req.body;
        const doc2=await JobInfo.updateOne({jobId:req.params.id},{$push:{interviews:data}});
        if(!doc2){
            throw "Error In Scheduling The Interview"
        }
        res.status(200).json({success:"Successfully Scheduled The Interview"})
    }
    catch(error){
        res.status(501).json({error:error});
    }
})
module.exports=router;