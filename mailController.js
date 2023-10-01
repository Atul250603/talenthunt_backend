const nodemailer=require('nodemailer');
const transporter= nodemailer.createTransport({
    host:process.env.EMAIL_HOST,
    port:process.env.EMAIL_PORT,
    secure:false,
    auth:{
        user:process.env.EMAIL_USER,
        pass:process.env.EMAIL_PASS
    }
});
async function mailHelper(email,otp){
    const mailOptions={
        from:process.env.EMAIL_USER,
        to:email,
        subject:"TalentX Email Verification",
        text:`The OTP for Email Verification is : ${otp} `
    }
    const info=await transporter.sendMail(mailOptions);
    return info;
}
module.exports=mailHelper;