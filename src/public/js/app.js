const socket=io(); 
const welcome =document.getElementById("welcome");
const enterform=welcome.querySelector("form");
const roomInput=welcome.querySelector("#roomname");
const nicknameInput=welcome.querySelector("#nickname");
const room =document.getElementById("room");

room.hidden=true;
let roomName="";
enterform.addEventListener("submit",handleRoomSubmit);

function handleRoomSubmit(event){
    event.preventDefault();
    roomName=roomInput.value;
    socket.emit("enter_room", roomName,nicknameInput.value,showRoom);
    roomInput.value="";
}
function handleMsgSubmit(event){
    event.preventDefault();
    const input=room.querySelector("#message input");
    const msg=input.value;
    socket.emit("new_message",msg,roomName,()=>{
        addMessage(`You: ${msg}`);
    });
    input.value="";
}
function showRoom(){
    welcome.hidden=true;
    room.hidden=false;
    const h3=document.querySelector('h3');
    h3.innerText=`Room ${roomName}`;
    const msgForm=room.querySelector("#message");
    msgForm.addEventListener("submit",handleMsgSubmit);
}
function addMessage(msg){
    const ul=room.querySelector("ul");
    const li=document.createElement("li");
    li.innerText=msg;
    ul.appendChild(li);
}
function showPublicRooms(rooms){
    const roomList=welcome.querySelector("ul");
    roomList.innerHTML="";
    rooms.forEach((room)=>{
        const li = document.createElement("li");
        li.innerText=room;
        roomList.append(li);
    });
}

socket.on("welcome",(nickname,userCount)=>{
    const h3=document.querySelector('h3');
    h3.innerText=`Room ${roomName} : ${userCount}`;
    addMessage(`${nickname} joined`);
});
socket.on("bye",(nickname,userCount)=>{
    const h3=document.querySelector('h3');
    h3.innerText=`Room ${roomName} : ${userCount}`;
    addMessage(`${nickname} left`);
});
socket.on("new_message",addMessage);
socket.on("room_change",showPublicRooms);
// const socket=new WebSocket(`ws://${window.location.host}`);
// const messageList =document.querySelector("ul");
// const messageForm =document.querySelector("#message");
// const nicknameForm =document.querySelector("#nickname");

// function constructMessage(type, payload){
//     const msg={type, payload};
//     return JSON.stringify(msg);
// }
// socket.addEventListener("open",()=>{
//     console.log("Connection Established");
// });

// socket.addEventListener("message",(message)=>{
//     const li = document.createElement("li");
//     li.innerText=message.data;
//     messageList.append(li);
// });

// socket.addEventListener("close",()=>{
//     console.log("Disconnected from server");
// });

// function handleSubmitNickname(event){
//     event.preventDefault();
//     const input = nicknameForm.querySelector("input");
//     socket.send(constructMessage("nickname",input.value));
// }

// function handleSubmitMessage(event){
//     event.preventDefault();
//     const input = messageForm.querySelector("input");
//     socket.send(constructMessage("new_message",input.value));
//     input.value="";
// }
// messageForm.addEventListener("submit",handleSubmitMessage);
// nicknameForm.addEventListener("submit",handleSubmitNickname);