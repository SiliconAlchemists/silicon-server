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

let obj = null;

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
    obj ={
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
    }
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

app.listen(3006, ()=>{ 
    console.log("REST API Server Running on PORT 3006");
})