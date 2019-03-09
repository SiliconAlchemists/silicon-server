const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const knex = require('knex');
const enableWs = require('express-ws');


const app = express();
enableWs(app);

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
    
    res.json({email:email+" testing"});
})


// app.ws('/echo', (ws, req) => {
//     ws.on('message', msg => {
//          ws.send(JSON.stringify(succObj));
//         console.log("websocket echo received: " , JSON.parse(msg) );

//     })

//     ws.on('close', () => {
//         console.log('WebSocket was closed')
//     })
// })


// app.ws('/registerws', (ws, req) => {
//     ws.on('message', msg => {
//          ws.send(JSON.stringify(succObj));
//         console.log("websocket registerws received: " , JSON.parse(msg) );

//     })

//     ws.on('close', () => {
//         console.log('WebSocket was closed')
//     })
// })

app.ws('/signinws', (ws, req) => {

    ws.on('open', function open() {
        console.log("client conect");
      });

    ws.on('message', msg => {
        //  ws.send(JSON.stringify(succObj));
        console.log("websocket signinws received: " , JSON.parse(msg) );
        let loginDetails =  JSON.parse(msg);
        console.log(loginDetails.email, loginDetails.password);

        db.select('*').from('users').where({email:loginDetails.email}).then(user =>{
            console.log('user quer', user);
            if(user.length)
            ws.send(JSON.stringify(user[0]));
            else ws.send('user not found');
        }).catch(error => console.log(error));
    })

    ws.on('close', () => {
        console.log('sigin WebSocket was closed')
    })
})



app.listen(3006, ()=>{ 
    console.log("REST API Server Running on PORT 3006");
})