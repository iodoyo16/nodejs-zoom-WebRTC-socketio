import http from "http";
//import WebSocket from "ws";
import {instrument} from "@socket.io/admin-ui";
import {Server} from "socket.io";
import express from "express";
import { WSASYSCALLFAILURE } from "constants";

const dotenv=require("dotenv");
dotenv.config();

const app=express();


app.set('view engine', "pug");
app.set('views',__dirname+'/views');
app.use("/public",express.static(__dirname +"/public"));
app.get("/",(_,res)=>res.render("home"));
// basic express는 http 방식, ws protocol로 implement

const server=http.createServer(app);
// app.listen은 실제 server에 대한 접근은 불가 -> createServer로는 server 반환하여 가능
// const wss=new WebSocket.Server({server});
// http server를 반드시 생성해야 하는건 아님. 둘중하나만 이용한다면 하나만 사용해도 무방
// 현재 코드처럼 하면 같은 port에 두 PROTOCOL 지정가능

const io=new Server(server,{
    cors: {
        origin: ["https://admin.socket.io"],
        credentials:true,
    },
});
instrument(io,{
    auth:false
});
function publicRooms(){
    const {
        sockets: {
            adapter: {sids,rooms},
        },
    }=io;
    const publicRoom=[];
    rooms.forEach((_,key)=>{
        if(sids.get(key)===undefined){
            publicRoom.push(key);
        }
    });
    return publicRoom;
}

function countRoomSize(roomName){
    return io.sockets.adapter.rooms.get(roomName)?.size//undefined 일때도 있으므로
}

function handleListen(){
    console.log(`Listening to localhost: ${process.env.PORT}`);
}


io.on("connection",(socket)=>{
    socket.onAny((event)=>{
        console.log(`Socket Event : ${event} has occured`);
    });
    socket.on("join_room",(roomName)=>{
        socket.join(roomName);
        socket.to(roomName).emit("welcome");
    });
    socket.on("offer",(offer,roomName)=>{
        socket.to(roomName).emit("offer",offer);
    });
    socket.on("answer",(answer,roomName)=>{
        socket.to(roomName).emit("answer",answer);
    });
    socket.on("ice",(ice,roomName)=>{
        socket.to(roomName).emit("ice",ice);
    })
})

///socket io chat server
// io.on("connection",(socket)=>{
//     socket.onAny((event)=>{
//         //console.log(io.sockets.adapter);
//         console.log(`Socket Event: ${event}`)
//     })

//     socket.on("enter_room",(roomName,nickname,done)=>{
//         socket.join(roomName);
//         socket["nickname"]=nickname;
//         done();
//         socket.to(roomName).emit("welcome",socket.nickname,countRoomSize(roomName));
//         io.sockets.emit("room_change",publicRooms());
//     });

//     socket.on("disconnecting",()=>{
//         socket.rooms.forEach((room)=>
//             socket.to(room).emit("bye",socket.nickname,countRoomSize(room)-1)
//         );
//     })
//     socket.on("disconnect",()=>{
//         io.sockets.emit("room_change",publicRooms());
//     })
//     socket.on("new_message",(msg, roomName,done)=>{
//         socket.to(roomName).emit("new_message",`${socket.nickname}: ${msg}`);
//         done();
//     })
// });


// const sockets = [];

// wss.on("connection",(socket)=>{
//     sockets.push(socket);
//     socket["nickname"]="Anonymous";
//     console.log("Connected to Browser");
//     socket.on("close",()=>console.log("Disconnected from the Browser"));
//     socket.on("message",(message)=>{
//         const parsedMessage=JSON.parse(message);
//         switch(parsedMessage.type){
//             case "new_message":
//                 sockets.forEach((aSocket)=>{
//                     aSocket.send(`${socket.nickname}: ${parsedMessage.payload}`);
//                 });
//                 break;
//             case "nickname":
//                 socket["nickname"]=parsedMessage.payload;
//                 break;
//         }
//     });
// });

server.listen(process.env.PORT,handleListen);