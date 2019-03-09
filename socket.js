const io = require('socket.io-client');


const socket = io('http://10.177.7.233', {
  path: '/'
});


socket.on('connect', function(){
    console.log("connected");
});
socket.on('event', function(data){
    consoloe.log(data);
});
socket.on('disconnect', function(){
    console.log('disconnected')
});