const express =require('express')
const app = express();
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const collection=require('./mongo.js')

dotenv.config();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.get('/',(req,res)=>{
    res.render('home')
})
app.get('/signup',(req,res)=>{
    res.render('signup')
})
app.get('/login',(req,res)=>{
    res.render('login')
})
app.get('*',(req,res)=>{
    res.status(404).render("404");
})

app.post('/signup', async(req,res)=>{
    const {username,email,password}=req.body
    try {
        //creating new user by collectiung the data
        const user= new collection({username,email,password})
        await user.save()

        const { accessToken, refreshToken } = user.getSignedToken(res);
        res.status(201).json({ success: true, accessToken });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error. Could not register user.' })
    }
})

app.post('/login',async(req,res)=>{
    const {email,password}=req.body
    try {
        const user= await collection.findOne({email})
        if(!user) return res.status(401).json({success:false,message:'User not found'})

          const isMatch= await user.comparePassword(password);
          if(!isMatch) return res.status(401).json({success:false,message:'Invalid password'})


            const { accessToken, refreshToken } = user.getSignedToken(res);
          res.status(201).json({ success: true, accessToken });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error. Could not log in.' });
    }
})
app.listen(3000, () => {
    console.log(`Server running on port 3000`);
});