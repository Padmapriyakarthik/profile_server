const baseurl="https://profileclient.herokuapp.com/";
const express=require('express');
const app=express();
app.use(express.json());

require('dotenv').config();

const cors=require('cors');
app.use(cors());

const mongodb=require('mongodb');
const bcrypt=require('bcrypt');

const mongoClient=mongodb.MongoClient;
const objectId=mongodb.ObjectID;

const JWT = require("jsonwebtoken");
const JWT_SECRET = "1234";



const dbUrl=process.env.DB_URL || "mongodb://127.0.0.1:27017";
const port=process.env.PORT || 4000;

// register user
app.post("/register", async (req,res)=>{
    
    const client = await mongoClient.connect(dbUrl);
    if(client){
        try {
            let {email}=req.body;
            const db = client.db("Profile");
                const documentFind = await db.collection("users").findOne({email:req.body.email});
                if(documentFind){
                    res.status(400).json({
                        message:"User already Exists"
                    })
                }else{
                    let salt=await bcrypt.genSalt(10);//key to encrypt password
                    let hash=await bcrypt.hash(req.body.password,salt);
                    req.body.password=hash;
                    let document=await db.collection("users").insertOne(req.body);
                    
                    if(document){ 
                        let token=await JWT.sign({email},JWT_SECRET)
                        res.status(200).json({message:"Login Success",token,email});
                    }
                }
            client.close();
        } catch (error) {
            console.log(error);
            client.close();
        }
    }else{
        res.sendStatus(500);
    }
})


app.post("/login",async(req,res)=>{
    const client=await mongoClient.connect(dbUrl);
    if(client)
    {   const {email}=req.body;
        try{
            let db=client.db("Profile");
            let data=await db.collection("users").findOne({email:req.body.email});
            if(data)
            {
                let isvalid =await bcrypt.compare(req.body.password,data.password);   
                if(isvalid)
                {
                    
                    let token=await JWT.sign({email},JWT_SECRET)
                    res.status(200).json({message:"Login Success",token,email});
                }
                else{
                    res.status(400).json({message:"Login Unsuccesful"})
                }
            }
            else{
                res.status(400).json({message:"User Does Not Exists "});// 401 unauthorized
            }
            client.close();
        }
        catch(error){
            console.log(error);
            client.close();
        }
    }else{

        res.sendStatus(500);
    }
})

app.get('/getinfo',authenticate,async(req,res)=>{
    const client=await mongoClient.connect(dbUrl);
    if(client)
    {   const {email}=req.body;
        try{
            let db=client.db("Profile");
            let data=await db.collection("users").findOne({email:req.body.email});
            if(data)
            {    
                console.log(data);
                res.status(200).json({data});   
            }
            else{
                res.status(400).json({message:"User Does Not Exists "});// 401 unauthorized
            }
            client.close();
        }
        catch(error){
            console.log(error);
            client.close();
        }
    }else{

        res.sendStatus(500);
    }
})

app.post('/updateinfo',authenticate,async(req,res)=>{
    const client=await mongoClient.connect(dbUrl);
    if(client)
    {   const {email}=req.body;
        try{
            let db=client.db("Profile");
            let isdata=await db.collection("users").findOne({email:req.body.email});
            if(isdata)
            {    
               //let data = db.collection("users").updateOne({email:req.body.email},{ $set: {gender:req.body.gender,dob:req.body.dob,mobile:req.body.mobile } });
               const users= document=await db.collection("users").findOneAndUpdate({email},{ $set: {gender:req.body.gender,dob:req.body.dob,mobile:req.body.mobile}});
                const data=users.value
               res.status(200).json({data});   
            }
            else{
                res.status(400).json({message:"User Does Not Exists "});// 401 unauthorized
            }
            client.close();
        }
        catch(error){
            console.log(error);
            client.close();
        }
    }else{

        res.sendStatus(500);
    }
})
app.listen(port,()=>{console.log("App Started")});

async function authenticate(req,res,next){

    console.log(req.headers.authorization);
        if(req.headers.authorization!==undefined)
        {
            JWT.verify(req.headers.authorization,
                JWT_SECRET,
                (err,decode)=>{
                    if(decode!==undefined){
                        console.log(decode);
                        req.body.email=decode.email;
                        next();
                    }else{
                        res.status(401).json({message:"invalid token"});
                    }
                });
        }else{
            res.status(401).json({message:"No token"})
        }
}