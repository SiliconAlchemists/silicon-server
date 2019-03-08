const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const knex = require('knex');

const app = express();

app.use(bodyParser.json());
app.use(cors());

let succObj = {
    success:true
}

const db = knex({
    client: 'pg',
    connection:{
        host:'127.0.0.1',
        user: "gerontius",
        password:'',
        database:'silicon'
    }
});

app.get('/', (req,res) =>{

    res.send("success");
});


app.post('/registeruser', (req,res) =>{
    const {
        username,
        email,
        password,
        age,
        sex,
        phone,
        medcondition,
        ilnesses,
        address,
        phoneemergency,
        bloodgroup,
        medicineintolerance,
        medication,
        special
    } = req.body;
    console.log('registeruser post name:', username);
    // obj ={
    //     username,
    //     email,
    //     password,
    //     age,
    //     sex,
    //     phone,
    //     medcondition,
    //     ilnesses,
    //     address,
    //     phoneemergency,
    //     bloodgroup,
    //     medicineintolerance,
    //     medication,
    //     special
    // }
    db('users').insert({
        username:username,
        email:email,
        passwordhash:password,
        age:age,
        sex:sex,
        phone:phone,
        medcondition:medcondition,
        ilnesses:ilnesses,
        address:address,
        phoneemergency:phoneemergency,
        bloodgroup:bloodgroup,
        medicineintolerance:medicineintolerance,
        medication:medication,
        special:special
    })
    .catch( err => console.log(err));
    
    res.json(succObj);
})

app.post('/getuserdetails', (req,res) =>{
    const {
        email,
    } = req.body;
    console.log('getuserdetails post email:', email);
    db.select('*').from('users').where({email:email}).then(user =>{
        console.log('user quer', user);
        if(user.length)
        res.json(user[0]);
        else res.status(400).json('user not found')
    })
})


app.post('/test', (req,res) =>{
    const {email} =req.body;
    
    res.json({email:email+"boiiiiiiiiiiii"});
})

app.listen(3006, ()=>{ 
    console.log("REST API Server Running on PORT 3006");
})