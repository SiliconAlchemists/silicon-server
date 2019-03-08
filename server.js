const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const knex = require('knex');

const app = express();

app.use(bodyParser.json());
app.use(cors());

app.get('/', (req,res) =>{
    res.send("success");
});

app.post('/register', (req,res) =>{
    const {email,name,password} = req.body;
    console.log(email,name,password);
    let obj ={
        email:email,
        name:name,
        password:password
    }
    res.json(obj);
})

app.listen(3005, ()=>{ 
    console.log("app running on 3005");
})