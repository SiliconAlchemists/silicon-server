const WebSocket = require('ws');
 
const wss = new WebSocket.Server({ port: 8080 });
let count =0;

console.log('websocket server running on port 8080');

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
    ++count;
    ws.send("hello request #" +count);
  });
 
  ws.send('something');
});