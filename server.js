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


app.ws('/echo', (ws, req) => {
    ws.on('message', msg => {
         ws.send(JSON.stringify(succObj));
        console.log("websocket echo received: " , JSON.parse(msg) );

    })

    ws.on('close', () => {
        console.log('WebSocket was closed')
    })
})


// app.ws('/registerws', (ws, req) => {
//     ws.on('message', msg => {
//          ws.send(JSON.stringify(succObj));
//         console.log("websocket registerws received: " , JSON.parse(msg) );

//     })

//     ws.on('close', () => {
//         console.log('WebSocket was closed')
//     })
// })

app.ws('/signinwsuser', (ws, req) => {

    ws.on('open', function open() {
        console.log("client conect");
      });

    ws.on('message', msg => {
        //  ws.send(JSON.stringify(succObj));
        console.log("websocket signinws received: " , JSON.parse(msg) );
        let loginDetails =  JSON.parse(msg);
        console.log(loginDetails.email, loginDetails.password);

        db.select('*').from('users').where({email:"silicon@alchemy.com", passwordhash:"qwerty"}).then(user =>{
            console.log('user quer', user);
            if(user.length)
            ws.send(JSON.stringify(user[0]));
            else {
                console.log("sending 404");
                ws.send('404');
            }
        }).catch(error => console.log(error));
    })

    ws.on('close', () => {
        console.log('sigin WebSocket was closed');
    })
})

app.ws('/signinwsambulance', (ws, req) => {

    ws.on('open', function open() {
        console.log("client conect");
      });

    ws.on('message', msg => {

        console.log("websocket ambulance received: " , JSON.parse(msg) );
        let loginDetails =  JSON.parse(msg);
        console.log(loginDetails.email, loginDetails.password);
        db.select('*').from('drivers').where({email:loginDetails.email ||'', passwordhash:loginDetails.password || ''}).then(driver =>{
            console.log('driver quer', "driver query sucess");
            if(driver.length){
                ws.send(JSON.stringify(driver[0]));
                console.log('sending response');
            }
                
            else ws.send('404');
        }).catch(error => console.log(error));

    })

    ws.on('close', () => {
        console.log('sigin ambulance WebSocket was closed')
    })
})

let userInDistress = null;
let userInDistressCoords = null;
app.ws('/sos', (ws, req) => {

    ws.on('open', function open() {
        console.log("client conect");
      });

    ws.on('message', msg => {
        console.log("websocket sos received: " , JSON.parse(msg) );
        let sosData =  JSON.parse(msg);
        
        db.select('*').from('users').where({email:sosData.email || ''}).then(user =>{
            if(user.length){
                userInDistress = user[0];
                console.log("sos signal of: " , userInDistress);
                userInDistressCoords = {
                    latitude:sosData.latitude,
                    longitude:sosData.longitude
                };
            }
        }).catch(error => console.log(error));
    })

    ws.on('close', () => {
        console.log('sigin sos WebSocket was closed')
    })
});

let driverIntervalId;
let activeDrivers= [];
let drivers =[];
app.ws('/driverReady', (ws, req) => {

    ws.on('open', function open() {
        console.log("client conect");
      });

    ws.on('message', msg => {
        let msgObj =JSON.parse(msg);
        console.log("websocket driverReady received: " ,msgObj  );
        if(msgObj.status == 'ready'){
            activeDrivers.push(msgObj.email);
            driverIntervalId= setInterval( () =>{
                if(userInDistress.email){
                    let reqLocation ={
                        action:"getCurrentLocation",
                    }
                    ws.send(JSON.stringify(reqLocation));
                    clearInterval(driverIntervalId);
                }
            },1000)
        } else if(msgObj.status == 'locationResponse'){
            let driverObj = {
                email: msgObj.email,
                latitude: msgObj.latitude,
                longitude:msgObj.longitude
            };
            drivers.push(driverObj);
        }
        
    })

    ws.on('close', () => {
        console.log('sigin sos WebSocket was closed');
        //delete driver 
    })
})

//Python ws server
let gyroData=[];
let gyroIntervalId;
app.ws('/getGyro', (ws, req) => {
    
    ws.on('message', msg => {
        let messageObj = JSON.parse(msg) ;
        console.log("websocket getGyro received: " , messageObj);
        if(messageObj.ready == 'true' ) {
            
            gyroIntervalId = setInterval( () =>{
                let gyroDataObject = {data:gyroData};
                if(gyroData.length>=50 ){
                    ws.send(JSON.stringify(gyroDataObject));
                    gyroData= [];
                }
                //delete this
                gyroData.push(Math.random());
                   
            },100);
        }
        
    })

    ws.on('close', () => {
        console.log('WebSocket getGyro was closed');
        clearInterval(gyroIntervalId);
    })
})

app.ws('/getGyroPhone', (ws, req) => {
    
    ws.on('message', msg => {
        console.log("websocket getGyroPhone received: " , JSON.parse(msg) );
        let magnitude = JSON.parse(msg).magnitude;
        gyroData.push(magnitude);
    })

    ws.on('close', () => {
        console.log('WebSocket getGyroPhone was closed')
    })

})


app.listen(3006, ()=>{ 
    console.log("Hello Silicon Alchemists, REST API cum Websockets Server Running on PORT 3006");
})