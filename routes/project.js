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
const recommendProjects = require('../projectRecommendation.js');
router.post('/postproject',fetchuser,async(req,res)=>{
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
        const project=new Project(finaldata);
        const resp=await project.save();
        if(resp){
            res.status(200).json({success:"Successfully Listed The Project",project:{projectTitle:resp.projectTitle,description:resp.description,projectId:resp._id,skills:resp.skills}});
        }
        else{
            throw "Error In Listing The Project";
        }
    }
    catch(error){
        res.status(501).json({error:error})
    }
})
router.post('/myprojects',fetchuser,async(req,res)=>{
    try{
        let user=req.user;
        let uid=user._id;
        const userdoc=await User.findOne({_id:uid});
        if(!userdoc){
            throw "Error In Finding The User";
        }
        const projects=await Project.find({userId:uid});
        if(!projects){
            throw "Error In Finding The Projects";
        }
        res.status(200).json({success:"Lisitng Your Projects",projects});
    }
    catch(error){
        res.status(501).json({error:error})
    }
})
router.post('/myproject/:id',fetchuser,async(req,res)=>{
    try{
        let user=req.user;
        let uid=user._id;
        const userdoc=await User.findOne({_id:uid});
        if(!userdoc){
            throw "Error In Finding The User";
        }
        let project=await Project.findOne({_id:req.params.id});
        if(!project){
                throw "Error In Finding The Project";
        }
        res.status(200).json({success:"Lisitng Your Project",project});
    }
    catch(error){
        res.status(501).json({error:error})
    }
})
router.post('/accepted/:id',fetchuser,async(req,res)=>{
    try{
        let user=req.user;
        let uid=user._id;
        const userdoc=await User.findOne({_id:uid});
        if(!userdoc){
            throw "Error In Finding The User";
        }
        let project=await Project.findOne({_id:req.params.id,userId:uid});
        if(!project){
            throw "Error In Finding The Project";
        }
        let projectinfo=await ProjectInfo.findOne({projectId:req.params.id});
        let userinfoarr=new Array();
        if(!projectinfo){
            res.status(200).json({success:"No Accepted Requests Yet",accepted:userinfoarr});
        }
        else{
            let accepted=projectinfo.accepted;
            for(let i=0;i<accepted.length;i++){
                let userinfo=await UserInfo.findOne({userId:accepted[i]});
                if(userinfo){
                    userinfoarr.push(userinfo);
                }
            }
            res.status(200).json({success:"Successfully Listed The Accepted Requests",accepted:userinfoarr});
        }   
    }
    catch(error){
        res.status(501).json({error:error})
    }
})
router.post('/pending/:id',fetchuser,async(req,res)=>{
    try{
        let user=req.user;
        let uid=user._id;
        const userdoc=await User.findOne({_id:uid});
        if(!userdoc){
            throw "Error In Finding The User";
        }
        let project=await Project.findOne({_id:req.params.id,userId:uid});
        if(!project){
            throw "Error In Finding The Project";
        }
        let projectinfo=await ProjectInfo.findOne({projectId:req.params.id});
        let userinfoarr=new Array();
        if(!projectinfo){
            res.status(200).json({success:"Successfully Listed The Pending Requests",pending:userinfoarr});
        }
        else{
            let pending=projectinfo.pending;
            for(let i=0;i<pending.length;i++){
                let userinfo=await UserInfo.findOne({userId:pending[i]});
                if(userinfo){
                    userinfoarr.push(userinfo);
                }
            }
            res.status(200).json({success:"Successfully Listed The Pending Requests",pending:userinfoarr});
        }
        
    }
    catch(error){
        res.status(501).json({error:error})
    }
})
router.post('/allprojects',fetchuser,async(req,res)=>{
    try{
        let user=req.user;
        let uid=user._id;
        const userdoc=await User.findOne({_id:uid});
        if(!userdoc){
            throw "Error In Finding The User";
        }
        const userinfo=await UserInfo.findOne({userId:uid});
        if(!userinfo){
            throw "Error In Finding The User";
        }
        let projects=await Project.find({userId:{$ne:uid}});
        if(!projects){
            throw "Error In Finding The Project";
        }
        else{
            for(let i=0;i<projects.length;i++){
                let idx5=-1;
                if(projects[i].sameOrg){
                    let orgofcreator=await UserInfo.findOne({userId:projects[i].userId});
                    let orgofapplicant=await UserInfo.findOne({userId:uid});
                    if(orgofcreator && orgofapplicant && (orgofapplicant.currorg!==orgofcreator.currorg)){
                        idx5=i;
                    }
                    else if(!orgofcreator || !orgofapplicant){
                        throw "Error In Finding The Project";
                    }
                }
                if(idx5>=0){
                    projects.splice(i,1);
                    i--;
                }
                let project=await ProjectInfo.findOne({projectId:projects[i]._id});
                if(project){
                    let idx1=project.accepted.indexOf(uid);
                    let idx2=project.rejected.indexOf(uid);
                    let idx3=project.pending.indexOf(uid);
                    let idx4=project.rejectedByCreator.indexOf(uid);
                    
                    if(idx1>=0 || idx2>=0 || idx3>=0 || idx4>=0){
                        projects.splice(i,1);
                        i--;
                    }
                }
            }
        }
        let recommendations;
        if(projects.length>0){
           recommendations=recommendProjects(projects,userinfo);
        }
        res.status(200).json({success:"Successfully Listing All The Projects",projects:recommendations});
    }
    catch(error){
        res.status(501).json({error:error});
    }
})
router.post('/applyproject/:id',fetchuser,async(req,res)=>{
    try{
        let user=req.user;
        let uid=user._id;
        const userdoc=await User.findOne({_id:uid});
        if(!userdoc){
            throw "Error In Finding The User";
        }
        const project=await Project.find({_id:req.params.id,userId:{$ne:uid}});
        if(!project){
            throw "Error In Finding The Project";
        }
        const projectinfo=await ProjectInfo.findOne({projectId:req.params.id});
        let data={};
        
        if(projectinfo){
            let pending=[...projectinfo.pending,uid];  
            data=await ProjectInfo.updateOne({_id:projectinfo._id},{$set:{pending}});
        }
        else{
            data=new ProjectInfo({
                projectId:req.params.id,
                pending:[uid],
                rejected:[],
                accepted:[],
                rejectedByCreator:[]
            });
            data=await data.save(); 
        }
        res.status(200).json({success:"Successfully Applied",project:data});
    }
    catch(error){
        res.status(501).json({error:error});
    }
})
router.post('/rejectproject/:id',fetchuser,async(req,res)=>{
    try{
        let user=req.user;
        let uid=user._id;
        const userdoc=await User.findOne({_id:uid});
        if(!userdoc){
            throw "Error In Finding The User";
        }
        const project=await Project.find({_id:req.params.id,userId:{$ne:uid}});
        if(!project){
            throw "Error In Finding The Project";
        }
        const projectinfo=await ProjectInfo.findOne({projectId:req.params.id});
        let data={};
        
        if(projectinfo){
            let rejected=[...projectinfo.rejected,uid];  
            data=await ProjectInfo.updateOne({_id:projectinfo._id},{$set:{rejected}});
        }
        else{
            data=new ProjectInfo({
                projectId:req.params.id,
                accepted:[],
                rejected:[uid],
                rejectedByCreator:[]
            });
            data=await data.save(); 
        }
        res.status(200).json({success:"Successfully Rejected",project:data});
    }
    catch(error){
        res.status(501).json({error:error});
    }
})
router.post('/acceptuser/:id/u/:userid',fetchuser,async(req,res)=>{
    try{
        let user=req.user;
        let uid=user._id;
        const userdoc=await User.findOne({_id:uid});
        if(!userdoc){
            throw "Error In Finding The User";
        }
        const project=await Project.find({_id:req.params.id,userId:uid});
        if(!project){
            throw "Error In Finding The Project";
        }
        const projectinfo=await ProjectInfo.findOne({projectId:req.params.id});
        if(!projectinfo){
            throw "Error In Finding The Project Information";
        }
        let idx=projectinfo.pending.indexOf(req.params.userid);
        if(idx>=0){
            projectinfo.pending.splice(idx,1);
            projectinfo.accepted.push(req.params.userid);
            const updatedprojectinfo=await ProjectInfo.updateOne({_id:projectinfo._id},{$set:{pending:projectinfo.pending,accepted:projectinfo.accepted}});
            if(!updatedprojectinfo){
                throw "Error In Accepting The Request";
            }
        }
        res.status(200).json({success:"Successfully Accepted The Request"});
    }
    catch(error){
        res.status(501).json({error:error});
    }
})
router.post('/rejectuser/:id/u/:userid',fetchuser,async(req,res)=>{
    try{
        let user=req.user;
        let uid=user._id;
        const userdoc=await User.findOne({_id:uid});
        if(!userdoc){
            throw "Error In Finding The User";
        }
        const project=await Project.find({_id:req.params.id,userId:uid});
        if(!project){
            throw "Error In Finding The Project";
        }
        const projectinfo=await ProjectInfo.findOne({projectId:req.params.id});
        if(!projectinfo){
            throw "Error In Finding The Project Information";
        }
        let idx=projectinfo.pending.indexOf(req.params.userid);
        if(idx>=0){
            projectinfo.pending.splice(idx,1);
            projectinfo.rejectedByCreator.push(req.params.userid);
            const updatedprojectinfo=await ProjectInfo.updateOne({_id:projectinfo._id},{$set:{pending:projectinfo.pending,rejectedByCreator:projectinfo.rejectedByCreator}});
            if(!updatedprojectinfo){
                throw "Error In Rejecting The Request";
            }
        }
        res.status(200).json({success:"Successfully Rejected The Request"});
    }
    catch(error){
        res.status(501).json({error:error});
    }
})
router.post('/getprofile/:id/p/:projid',fetchuser,async(req,res)=>{
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
        let project=await Project.findOne({_id:req.params.projid,userId:uid});
        if(!project){
            project=await Project.findOne({_id:req.params.projid});
            if(project){
                let projectinfo=await ProjectInfo.findOne({projectId:project._id,accepted:{$in:[uid]}});
                if(!projectinfo){
                    throw "Error In Finding The Project";
                }
            }
            else{
                throw "Error In Finding The Project";
            }
        }
        const info=await UserInfo.findOne({userId:req.params.id});
        res.status(200).json({success:"Displaying The Profile Information",user_info:info});
    }
    catch(error){
        res.status(501).json({error:error})
    }
})
router.post('/appliedProject',fetchuser,async(req,res)=>{
    try{
        let user=req.user;
        let uid=user._id;
        const doc=await User.findOne({_id:uid});
        if(!doc){
           throw "No Information About User Exists";
        }
        const project1=await ProjectInfo.find({pending:{$in:[uid]}}).populate('projectId');
        const project2=await ProjectInfo.find({rejectedByCreator:{$in:[uid]}}).populate('projectId');
        const project3=await ProjectInfo.find({accepted:{$in:[uid]}}).populate('projectId');
        const projects=[];
        project1.forEach((element)=>{
            let project={
                projectId:element.projectId._id,
                projectTitle:element.projectId.projectTitle,
                creator:element.projectId.creator,
                user:element.projectId.userId,
                pending:true
            }
            projects.push(project);
        })
        project2.forEach((element)=>{
            let project={
                projectId:element.projectId._id,
                projectTitle:element.projectId.projectTitle,
                creator:element.projectId.creator,
                user:element.projectId.userId,
                rejected:true
            }
            projects.push(project);
        })
        project3.forEach((element)=>{
            let project={
                projectId:element.projectId._id,
                projectTitle:element.projectId.projectTitle,
                creator:element.projectId.creator,
                user:element.projectId.userId,
                accepted:true
            }
            projects.push(project);
        })
        res.status(200).json({success:"Successfully Fetched The Applied Projects",projects:projects});
    }
    catch(error){
        res.status(501).json({error:error})
    }
})
module.exports=router;