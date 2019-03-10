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
    success: true
}

const db = knex({
    client: 'pg',
    connection: {
        host: '127.0.0.1',
        user: "gerontius",
        password: '',
        database: 'silicon'
    }
});


app.get('/', (req, res) => {

    res.send("success");
});


app.post('/registeruser', (req, res) => {
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
            username: username,
            email: email,
            passwordhash: password,
            age: age,
            sex: sex,
            phone: phone,
            medcondition: medcondition,
            ilnesses: ilnesses,
            address: address,
            phoneemergency: phoneemergency,
            bloodgroup: bloodgroup,
            medicineintolerance: medicineintolerance,
            medication: medication,
            special: special
        })
        .catch(err => console.log(err));

    res.json(succObj);
})

app.post('/getuserdetails', (req, res) => {
    const {
        email,
    } = req.body;
    console.log('getuserdetails post email:', email);
    db.select('*').from('users').where({
        email: email
    }).then(user => {
        console.log('user quer', user);
        if (user.length)
            res.json(user[0]);
        else res.status(400).json('user not found')
    })
})


app.post('/test', (req, res) => {
    const {
        email
    } = req.body;

    res.json({
        email: email + " testing"
    });
})


app.ws('/echo', (ws, req) => {
    ws.on('message', msg => {
        ws.send(JSON.stringify(succObj));
        console.log("websocket echo received: ", JSON.parse(msg));

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
        console.log("websocket signinws received: ", JSON.parse(msg));
        let loginDetails = JSON.parse(msg);
        console.log(loginDetails.email, loginDetails.password);

        db.select('*').from('users').where({
            email: "silicon@alchemy.com",
            passwordhash: "qwerty"
        }).then(user => {
            console.log('user quer', user);
            if (user.length)
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

        console.log("websocket ambulance received: ", JSON.parse(msg));
        let loginDetails = JSON.parse(msg);
        console.log(loginDetails.email, loginDetails.password);
        db.select('*').from('drivers').where({
            email: loginDetails.email || '',
            passwordhash: loginDetails.password || ''
        }).then(driver => {
            console.log('driver query in signin', "driver query sucess");
            if (driver.length) {
                let driverObj = {
                    name: driver[0].name,
                    email: driver[0].email,
                    response: 'success'
                }
                ws.send(JSON.stringify(driverObj));

                console.log('sending response', driverObj);
            } else {
                let failObj = {
                    response: 'failure'
                }
                ws.send(JSON.stringify(failObj));
            }
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
        console.log("websocket sos received: ", JSON.parse(msg));
        let sosData = JSON.parse(msg);

        db.select('*').from('users').where({
            email: sosData.email || ''
        }).then(user => {
            if (user.length) {
                userInDistress = user[0];
                console.log("sos signal of: ", userInDistress);
                userInDistressCoords = {
                    latitude: sosData.latitude,
                    longitude: sosData.longitude
                };
            }
        }).catch(error => console.log(error));
    })

    ws.on('close', () => {
        console.log('sigin sos WebSocket was closed')
    })
});

let driverIntervalId;
let activeDrivers = [];
app.ws('/driverReady', (ws, req) => {

    ws.on('open', function open() {
        console.log("client conect");
    });

    ws.on('message', msg => {
        let msgObj = JSON.parse(msg);
        console.log("websocket driverReady received: ", msgObj);
        if (msgObj.status == 'ready') {
            activeDrivers.push(msgObj.email);
            driverIntervalId = setInterval(() => {
                if (userInDistress != null) {
                    let reqLocation = {
                        action: "getCurrentLocation"
                    }
                    console.log("sending getCurrentLocation action to driver");
                    ws.send(JSON.stringify(reqLocation));
                    clearInterval(driverIntervalId);
                }
            }, 500)
        } else if (msgObj.status == 'locationResponse') {
            console.log("got a location response!!");
            let driverObj = {
                email: msgObj.email,
                latitude: msgObj.latitude,
                longitude: msgObj.longitude
            };
            console.log(driverObj);

            let distance = calculateDistance({
                latitude: userInDistressCoords.latitude,
                longitude: userInDistress.longitude
            }, {
                latitude: driverObj.latitude,
                longitude: driverObj.longitude
            });

            let confirmationObj = {
                action:'startNavigation',
                name:userInDistress.username,
                phone:userInDistress.phone,
                latitude:userInDistressCoords.latitude,
                longitude:userInDistressCoords.longitude,  
            }
            console.log("sending confirmation of user:", confirmationObj);
            ws.send(JSON.stringify(confirmationObj));

        }


    })

    ws.on('close', () => {
        console.log('sigin sos WebSocket was closed');
        //delete driver 
    })
})


function calculateDistance(userLoc, driverLoc) {
    let lat1 = userLoc.latitude;
    let lon1 = userLoc.longitude;
    let lat2 = driverLoc.latitude;
    let lon2 = driverLoc.longitude;
    var R = 6371; // Radius of the earth in km
    var dLat = (lat2 - lat1) * Math.PI / 180; // deg2rad below
    var dLon = (lon2 - lon1) * Math.PI / 180;
    var a =
        0.5 - Math.cos(dLat) / 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        (1 - Math.cos(dLon)) / 2;

    return R * 2 * Math.asin(Math.sqrt(a));
}

// console.log(calculateDistance({
//     latitude: 13.134917,
//     longitude: 77.588912
// }, {
//     latitude: 13.129254,
//     longitude: 77.591079
// }))

//Python ws server
let gyroData = [];
let gyroIntervalId;
let turn = 1;
app.ws('/getGyro', (ws, req) => {
    ws.on('message', msg => {
        let messageObj = JSON.parse(msg);
        console.log("websocket getGyro received: ", messageObj);
        if (messageObj.ready == 'true') {

            gyroIntervalId = setInterval(() => {
                let gyroDataObject = {
                    data: gyroData,
                    turn:turn
                };
                if (gyroData.length >= 50) {
                    ws.send(JSON.stringify(gyroDataObject));
                    turn++;
                    gyroData = [];
                }
            }, 100);
        }

    })

    ws.on('close', () => {
        console.log('WebSocket getGyro was closed');
        clearInterval(gyroIntervalId);
    })
})

app.ws('/getGyroPhone', (ws, req) => {

    ws.on('message', msg => {
        console.log("websocket getGyroPhone received: ", JSON.parse(msg));
        let magnitude = JSON.parse(msg).magnitude;
        gyroData.push(magnitude);
    })

    ws.on('close', () => {
        console.log('WebSocket getGyroPhone was closed')
    })

})
let bi = [];
let started=null;
let cleartestgyro;
let count= 0;
app.ws('/getGyroPhoneTest', (ws, req) => {

    ws.on('message', msg => {
        
        let gyroObj = JSON.parse(msg);
        // console.log("getGyroPhoneTest received: ", gyroData);
        let {x,y,z} = gyroObj;
        let magnitude =  Math.sqrt( x*x +y*y + z*z);
        // console.log(magnitude)
        console.log("gyrotest", magnitude);
        gyroData.push(magnitude);
        // let magnitude = JSON.parse(msg).magnitude;
        if(started==null){
            cleartestgyro = setInterval(() =>{
                ws.send('hello');
            },100);
            started = true;
        }
       
    })

    ws.on('close', () => {
        console.log('WebSocket getGyroPhoneTest was closed');
        started=null;
        clearInterval(cleartestgyro);
    })

})

let hospitalActive = false;
app.ws('/signinhospital', (ws, req) => {

    ws.on('message', msg => {
       
        console.log("websocket signinhospital received: ", JSON.parse(msg));
        let loginDetails = JSON.parse(msg);
        
        db.select('*').from('hospital').where({
            email: loginDetails.email,
            password: loginDetails.password
        }).then(hospital => {
            console.log('hospital quer', hospital);
            if (hospital.length){
                let succObj ={
                    'action':'success' 
                }
                ws.send(JSON.stringify(succObj));
                hospitalActive = true;
                setInterval( () =>{
                    if(hospitalActive){
                        if(userInDistress!=null){
                            let obj = {
                                user:userInDistress,
                                action:'distress'
                            }
                            ws.send(JSON.stringify(obj));
                            console.log("sending user data to hospital")
                            hospitalActive = false;
                        }
                           
                    }
                   
                }, 1000);
            }
            else {
                console.log("sending 404");
                ws.send('404');
            }
        }).catch(error => console.log(error));
    })
     
    


    ws.on('close', () => {
        console.log('signinhospital WebSocket was closed');
        hospitalActive=false;
    })
})

app.listen(3006, () => {
    console.log("Hello Silicon Alchemists, REST API cum Websockets Server Running on PORT 3006");
})