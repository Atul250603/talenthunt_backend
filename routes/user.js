const express=require('express');
const router=express.Router();
const User=require('../modals/User.js');
const UserInfo=require('../modals/UserInfo.js');
const mailHelper=require('../mailController.js');
const bcryptjs=require('bcryptjs');
const jwt=require('jsonwebtoken');
const secret=process.env.SECRET;
const fetchuser=require('../middleware');
router.post('/editprofile',fetchuser,async(req,res)=>{
    try{ 
        let data=req.body;
        let user=req.user;
        let uid=user._id;
        let doc=await UserInfo.findOneAndUpdate({userId:uid},data);
        if(!doc){
          doc=new UserInfo({
            ...data,
            userId:uid
          });
          doc=await doc.save();
          if(!doc){
            throw "Error In Updating The User Profile";
          }
        }
        const userdoc=await User.findOne({_id:uid});
        if(!userdoc){
            throw "Error In Finding The User";
        }
        if(!userdoc.profileCompleted){
            const newuserdoc=await User.findOneAndUpdate({_id:uid},{profileCompleted:true});
            if(!newuserdoc){
                throw "Error In Updating The User Status";
            }
            userdoc=newuserdoc;
        }
        res.status(200).json({success:"Successfully Updated The Profile Information",user:{email:userdoc.email,type:userdoc.type,profileCompleted:userdoc.profileCompleted},user_info:doc})
    }
    catch(error){
        res.status(501).json({error:error})
    }
})
router.post('/getprofile',fetchuser,async(req,res)=>{
    try{ 
        let user=req.user;
        let uid=user._id;
        const doc=await UserInfo.findOne({userId:uid});
        if(!doc){
           throw "No Information About User Exists";
        }
        res.status(200).json({success:"Displaying The Profile Information",user_info:doc});
    }
    catch(error){
        res.status(501).json({error:error})
    }
})
module.exports=router;