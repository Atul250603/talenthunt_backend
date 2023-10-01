const express=require('express');
const router=express.Router();
const User=require('../modals/User');
const mailHelper=require('../mailController');
const bcryptjs=require('bcryptjs');
const jwt=require('jsonwebtoken');
const secret=process.env.SECRET;
router.post('/emailverify',async(req,res)=>{
    try{
        let {email,otp}=req.body;
        let user=await User.findOne({email:email});
        if(!user || user==='undefined' || user===null){
            const info=await mailHelper(email,otp);
            if(info && info.messageId){
                res.status(200).json({success:"Email Sent Successfully"});
            }
            else{
                res.status(200).json({Error:"Failed To Send The Mail"});
            }
        }
        else{
            res.status(200).json({error:"Email Already Registered"});
        }
    }
    catch(error){
        res.status(500).json({error:"Some Error Occured"});
    }
})
router.post('/signup',async(req,res)=>{
    try{
        let {email,password,type}=req.body;
        let user=await User.findOne({email});
        if(!user || user==='undefined' || user===null){
            let salt=bcryptjs.genSaltSync(10);
            let hash=bcryptjs.hashSync(password,salt);
            let newUser=new User({
                email,
                password:hash,
                type
            });
            let savedUser=await newUser.save();
            if(!savedUser || savedUser==='undefined' || savedUser===null){
                res.status(500).json({error:"Error In Registering The User"});
            }
            res.status(200).json({success:'User Registered Successfully',user:savedUser});
        }
        else{
            res.status(200).json({error:"Email Already Registered"});
        }
    }
    catch(error){
        res.status(500).json({error:"Some Error Occured"});
    }
})
router.post('/login',async(req,res)=>{
    try{
        let {email,password}=req.body;
        let user=await User.find({email});
        if(user && user!==undefined && user.length>0){
            let data=user[0];
            if(!bcryptjs.compareSync(password, data.password)){
                res.status(200).json({error:"Incorrect Password"});
            }
            let token = jwt.sign({ user:data }, secret);
            if(token){
                res.status(200).json({success:"Login Successful",token:token});
            }
        }
        else{
            res.status(200).json({error:"No Such User Exists"});
        }
    }
    catch(error){
        res.status(500).json({error:"Some Error Occured"});
    }
})
module.exports=router;