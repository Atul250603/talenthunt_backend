const jwt=require('jsonwebtoken');
const { reset } = require('nodemon');
const JWT_SECRET=process.env.SECRET;
const fetchuser=(req,res,next)=>{
    const token=req.header('authToken');
    if(!token){
        res.status(401).json({error:"Authentication Failed"});
    }
    try {
        const data=jwt.verify(token,JWT_SECRET);
        req.user=data.user;
        next();
    } catch (error) {
        res.status(401).json({error:"Some Error In Authenticating You"});
    }
}
module.exports=fetchuser;