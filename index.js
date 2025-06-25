const express = require('express');
const app = express();
const http = require('http');
const path = require('path')
const server = http.createServer(app);
const { Server } = require("socket.io");
const io= new Server(server);
let game_count=0
let p1Wins=0;
let p2Wins=0;
let finalWinner="None";

const rooms = {};

app.use(express.static(path.join(__dirname,'client')));

app.get('/healthcheck',(req,res)=>{
    res.send('<h1>RPS App running...</h1>');
});

app.get('/',(req,res)=>{
    res.sendFile(__dirname + '/client/index.html');
});

function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}


io.on('connection',(socket)=>{
    console.log('A user in connected');
    socket.on('disconnect',()=>{
        console.log('A user disconnected');
    });

    socket.on('createGame',()=>{
        const roomUniqueId=makeid(6)
        rooms[roomUniqueId]={};
        socket.join(roomUniqueId);
        socket.emit("newGame",{roomUniqueId: roomUniqueId})
    }); 
    socket.on('joinGame',(data)=>{
        if(rooms[data.roomUniqueId]!=null){
            socket.join(data.roomUniqueId);
            socket.to(data.roomUniqueId).emit("playersConnected",{});
            socket.emit("playersConnected");
        }
    });  
    
    socket.on("p1Choice",(data) => {
        let rpsValue= data.rpsValue;
        rooms[data.roomUniqueId].p1Choice = rpsValue;
        socket.to(data.roomUniqueId).emit("p1Choice",{rpsValue : data.rpsValue});
        if(rooms[data.roomUniqueId].p2Choice!=null){
            delcareWinner(data.roomUniqueId);
        }
    });


    socket.on("p2Choice",(data) => {
        let rpsValue= data.rpsValue;
        rooms[data.roomUniqueId].p2Choice = rpsValue;
        socket.to(data.roomUniqueId).emit("p2Choice",{rpsValue : data.rpsValue});
        if(rooms[data.roomUniqueId].p1Choice!=null){
            delcareWinner(data.roomUniqueId);
        }
    });

});

function delcareWinner(roomUniqueId){
    let p1Choice = rooms[roomUniqueId].p1Choice;
    let p2Choice = rooms[roomUniqueId].p2Choice;
    let winner = null;
    if(p1Choice == p2Choice){
        winner = "d";
    } else if (p1Choice=="Paper"){
        if(p2Choice == "Scissor"){
            p2Wins++;
            winner= "p2";
        } else {
            p1Wins++;
            winner = "p1";
        }
    } else if (p1Choice=="Rock"){
        if(p2Choice == "Paper"){
            p2Wins++;
            winner= "p2";
        } else {
            p1Wins++;
            winner = "p1";
        }
    } else if (p1Choice=="Scissor"){
        if(p2Choice == "Rock"){
            p2Wins++;
            winner= "p2";
        } else {
            p1Wins++;
            winner = "p1";
        }    
    }
    game_count++;
    rooms[roomUniqueId],p1Choice=null;
    rooms[roomUniqueId],p2Choice=null;

    if(game_count==3){
    if(p1Wins==p2Wins)
        finalWinner="d"
    else if(p1Wins>p2Wins)
        finalWinner="1"
    else
        finalWinner="2"
        
    io.sockets.to(roomUniqueId).emit("result",{
        winner : winner, game_count : game_count, finalWinner : finalWinner
    });
        game_count=0;
    }
    else{
        io.sockets.to(roomUniqueId).emit("result",{
            winner : winner, game_count : game_count, finalWinner : finalWinner
        });
    //     io.socket.to(roomUniqueId).emit("nextRound",{roomUniqueId: roomUniqueId})
     }
}


server.listen(3000,()=>{
  console.log('listening on *:3000');  
});


