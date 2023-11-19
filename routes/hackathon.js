const express=require('express');
const router=express.Router();
const User=require('../modals/User.js');
const UserInfo=require('../modals/UserInfo.js');
const HackInfo=require('../modals/HackathonInfo.js');
const Hackathon=require('../modals/Hackathon.js');
const fetchuser=require('../middleware');
router.post('/createhackathon',fetchuser,async(req,res)=>{
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
        const hackathon=new Hackathon(finaldata);
        const resp=await hackathon.save();
        if(resp){
            res.status(200).json({success:"Successfully Created The Hackathon",hackathon:resp});
        }
        else{
            throw "Error In Listing The Hackathon";
        }
    }
    catch(error){
        res.status(501).json({error:error})
    }
})
router.post('/gethackathon',fetchuser,async(req,res)=>{
    try{
        let user=req.user;
        let uid=user._id;
        const userdoc=await User.findOne({_id:uid});
        if(!userdoc){
            throw "Error In Finding The User";
        }
        const resp=await Hackathon.find({userId:uid});
        if(resp && resp.length>0){
            res.status(200).json({success:"Successfully Listed The Hackathons",hackathons:resp});
        }
        else{
            throw "Error In Listing The Hackathons";
        }
    }
    catch(error){
        res.status(501).json({error:error})
    }
})
router.post('/getallhackathons',fetchuser,async(req,res)=>{
    try{
        let user=req.user;
        let uid=user._id;
        const userdoc=await User.findOne({_id:uid});
        if(!userdoc){
            throw "Error In Finding The User";
        }
        const currDate=new Date();
        const hackathon=await Hackathon.find({});
        if(!hackathon){
            throw "No Hackathon Is Live";
        }
        const hackathons=[];
        for(let i=0;i<hackathon.length;i++){
             if(hackathon[i].regStartDate.toLocaleDateString()===currDate.toLocaleDateString() && hackathon[i].regEndDate.toLocaleDateString()>currDate.toLocaleDateString()){
                 const hackathoninfo=await HackInfo.findOne({hackathonId:hackathon[i]._id,applied:{$in:[uid]}});
                 if(!hackathoninfo){
                     hackathons.push(hackathon[i]);
                    }
                }
            };
        res.status(200).json({success:"Successfully Listed All The Hackathons",hackathons:hackathons});
    }
    catch(error){
        res.status(501).json({error:error});
    }
})
router.post('/applyhackathon/:id',fetchuser,async(req,res)=>{
    try{
        let user=req.user;
        let uid=user._id;
        const userdoc=await User.findOne({_id:uid});
        if(!userdoc){
            throw "Error In Finding The User";
        }
        const hackathoninfo=await HackInfo.findOne({projectId:req.params.id});
        if(!hackathoninfo){
            const hackathon=await Hackathon.findOne({_id:req.params.id});
            if(!hackathon){
                throw "Error In Finding The Hackathon";
            }
            const data=new HackInfo({
                hackathonId:req.params.id,
                applied:[uid]
            })
            const resp=await data.save();
            if(!resp){
                throw "Error In Applying For The Hackathon";
            }
            res.status(200).json({success:"Successfully Applied For The Hackathon"});
        }
        else{
            const applied=[...hackathoninfo.applied,uid];
            const updatehackinfo=await HackInfo.updateOne({projectId:req.params.id},{$set:{applied:applied}});
            if(!updatehackinfo){
                throw "Error In Applying For The Hackathon";
            }
            res.status(200).json({success:"Successfully Applied For The Hackathon"});
        }
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
        const hackinfo=await HackInfo.find({applied:{$in:[uid]}}).populate('hackathonId');
        if(!hackinfo){
            throw "You haven't Applied For Hackathons";
        }
        res.status(200).json({success:"Successfully Listed Applied Hackathons",hackathons:hackinfo});
    }
    catch(error){
        res.status(501).json({error:error});
    }
})
router.post('/getHackathon/:id',fetchuser,async(req,res)=>{
    try{
        let user=req.user;
        let uid=user._id;
        const userdoc=await User.findOne({_id:uid});
        if(!userdoc){
            throw "Error In Finding The User";
        }
        const hackinfo=await HackInfo.findOne({hackathonId:req.params.id,applied:{$in:[uid]}}).populate('hackathonId');
        if(!hackinfo){
            throw "Error In Finding The Hackathon";
        }
        const newhackinfo=await HackInfo.findOne({hackathonId:req.params.id,applied:{$in:[uid]},submissions:{$elemMatch:{userId:uid}}});
        if(newhackinfo){
            let link=null;
            let prize=null;
            for(let i=0;i<newhackinfo.submissions.length;i++){
                if(newhackinfo.submissions[i].userId===uid){
                    link=newhackinfo.submissions[i].link;
                    if(newhackinfo.submissions[i].prize){
                        prize=newhackinfo.submissions[i].prize;
                    }
                }
            }
            if(!link){
                throw "Error In Fetching The Hackathon Details";
            }
            res.status(200).json({success:"Successfully Listed The Hackathon",hackathon:{...hackinfo._doc,submissionStatus:true,link:link,prize:prize}});
        }
        else{
            
            res.status(200).json({success:"Successfully Listed The Hackathon",hackathon:{...hackinfo._doc,submissionStatus:false}});
        }
    }
    catch(error){
        res.status(501).json({error:error});
    }
})
router.post('/submitSolution/:id',fetchuser,async(req,res)=>{
    try{
        let user=req.user;
        let uid=user._id;
        let {link}=req.body;
        const userdoc=await User.findOne({_id:uid});
        if(!userdoc){
            throw "Error In Finding The User";
        }
        const hackinfo=await HackInfo.findOne({hackathonId:req.params.id,applied:{$in:[uid]}});
        if(!hackinfo){
            throw "Error In Finding The Hackathon";
        }
        let submissions=[...hackinfo.submissions,{userId:uid,link:link}];
        let newhackinfo=await HackInfo.updateOne({hackathonId:req.params.id},{$set:{submissions:submissions}});
        if(!newhackinfo){
            throw "Error In Submitting The Solution";
        }
        res.status(200).json({success:"Successfully Submitted The Solution"});
    }
    catch(error){
        res.status(501).json({error:error});
    }
})
router.post('/myhackathon/:id',fetchuser,async(req,res)=>{
    try{
        let user=req.user;
        let uid=user._id;
        const userdoc=await User.findOne({_id:uid});
        if(!userdoc){
            throw "Error In Finding The User";
        }
        const hackinfo=await HackInfo.findOne({hackathonId:req.params.id}).populate('hackathonId');
        if(!hackinfo){
            throw "Error In Finding The Hackathon";
        }
        if(String(hackinfo.hackathonId.userId)!==String(uid)){
            throw "You Are Not The Creator Of This Hackathon";
        }
        let submissions=[];
        for(let i=0;i<hackinfo.submissions.length;i++){
            let userinfo=await UserInfo.findOne({userId:hackinfo.submissions[i].userId});
            if(!userinfo){
                throw "Error In Finding The Participant";
            }
            submissions.push({
                ...hackinfo.submissions[i],
                userInfo:userinfo
            })
        }
        res.status(200).json({success:"Successfully Listed The Hackathon",hackathon:{...hackinfo._doc,submissions:submissions}});
    }
    catch(error){
        res.status(501).json({error:error});
    }
})
router.post('/handoverprize/:id',fetchuser,async(req,res)=>{
    try{
        let user=req.user;
        let uid=user._id;
        const userdoc=await User.findOne({_id:uid});
        if(!userdoc){
            throw "Error In Finding The User";
        }
        const hackinfo=await HackInfo.findOne({hackathonId:req.params.id,submissions:{$elemMatch:{userId:req.body.userId}}});
        if(!hackinfo){
            throw "Error In Finding The Hackathon";
        }
        let submissions=[...hackinfo.submissions];
        for(let i=0;i<hackinfo.submissions.length;i++){
            if(String(hackinfo.submissions[i].userId)===String(req.body.userId)){
                submissions[i]={
                    ...hackinfo.submissions[i],
                    prize:req.body.prize
                }
            }
        }
        if(!submissions){
            throw "Error In Handing Over The Prize";
        }
        const newhackinfo=await HackInfo.updateOne({hackathonId:req.params.id},{$set:{submissions:submissions}});
        if(!newhackinfo){
            throw "Error In Handing Over The Prize";
        }
        res.status(200).json({success:"Successfully Handed Over The Prize"});
    }
    catch(error){
        res.status(501).json({error:error});
    }
})
module.exports=router;