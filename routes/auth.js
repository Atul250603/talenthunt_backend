const express=require('express');
const router=express.Router();
const User=require('../modals/User');
const mailHelper=require('../mailController');
const bcryptjs=require('bcryptjs');
const jwt=require('jsonwebtoken');
const secret=process.env.SECRET;
const fetchuser=require('../middleware');
router.post('/emailverify',async(req,res)=>{
    try{
        let {email,otp}=req.body;
        let user=await User.findOne({email:email});
        if(user){
            throw 'Email Already Registered';
        }
            const info=await mailHelper(email,otp);
            if(!info || !info.messageId){
                throw 'Failed To Send The Mail';
                
            }
            res.status(200).json({success:"Email Sent Successfully"});
    }
    catch(error){
        res.status(500).json({error:error});
    }
})
router.post('/signup',async(req,res)=>{
    try{
        let {email,password,type}=req.body;
        let user=await User.findOne({email});
        if(user){
            throw 'Email Already Registered';
        }
        
            let salt=bcryptjs.genSaltSync(10);
            let hash=bcryptjs.hashSync(password,salt);
            let newUser=new User({
                email,
                password:hash,
                type
            });
            let savedUser=await newUser.save();
            if(!savedUser || savedUser==='undefined' || savedUser===null){
                throw 'Error In Registering The User';
            }
            res.status(200).json({success:'User Registered Successfully',user:savedUser})
    }
    catch(error){
        res.status(500).json({error:error});
    }
})
router.post('/login',async(req,res)=>{
    try{
        let {email,password}=req.body;
        let user=await User.find({email});
        if(!user){
            throw 'No Such User Exists';
        }
            let data=user[0];
            if(!bcryptjs.compareSync(password, data.password)){
               throw 'Incorrect Password';
            }
            let token = jwt.sign({ user:{
                email:data.email,
                password:data.password,
                _id:data._id,
                type:data.type
            } }, secret);
            if(!token){
                throw 'Error In Loggig In';
            }
            res.status(200).json({success:"Login Successful",token:token,user:{_id:data._id,email:data.email,type:data.type,profileCompleted:data.profileCompleted}});
    }
    catch(error){
        res.status(500).json({error:error});
    }
})
module.exports=router;