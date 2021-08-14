//video
//mute , unmute, turn on,off camera (switch camera)
const socket=io();
const myFace=document.getElementById("myFace");
const muteBtn =document.getElementById("mute");
const cameraBtn =document.getElementById("camera");
const camerasSelect=document.getElementById("cameras");

//  join Form
const welcome =document.getElementById("welcome");
const call =document.getElementById("call");

call.hidden=true;

let myStream;
let muted=false;
let cameraOff=false;
let roomName;
let myPeerConnection;
let myDataChannel;

const welcomeForm=welcome.querySelector("form");

async function initCall(){
    const h3=call.querySelector("h3");
    h3.innerText=roomName;
    welcome.hidden=true;
    call.hidden=false;
    await getMedia();
    makeConnection();
}
async function handleWelcomeSubmit(event){
    event.preventDefault();
    const input =welcomeForm.querySelector("input");
    roomName = input.value;
    await initCall();
    socket.emit("join_room",input.value); 
    input.value="";
}
welcomeForm.addEventListener("submit",handleWelcomeSubmit);


//     call

async function getCameras(){
    try{
        const devices=await navigator.mediaDevices.enumerateDevices();
        const cameras=devices.filter((device)=>device.kind==="videoinput");
        const currentCamera=myStream.getVideoTracks()[0];
        cameras.forEach((camera)=>{
            const option=document.createElement("option");
            option.value=camera.deviceId;
            option.innerText=camera.label;
            if(currentCamera.label===camera.label){
                option.selected=true;
            }
            camerasSelect.appendChild(option);
        })
    }catch(err){
        console.log(err);
    }
}
async function getMedia(deviceId){
    const initialConstrains={
        audio: true, 
        video: {facingMode: "user"},
    };
    const customConstrains={
        audio:true,
        video:{deviceId:{ exact: deviceId}},
    };
    try{
        myStream=await navigator.mediaDevices.getUserMedia(
            deviceId? customConstrains : initialConstrains
        );
        myFace.srcObject=myStream;
        if(!deviceId)
            await getCameras();
    }catch(err){
        console.log(err);
    }
}

function handleMuteClick(){
    myStream.getAudioTracks()
    .forEach((track)=>track.enabled=!track.enabled);
    if(!muted){
        muteBtn.innerText="Unmute";
        muted=true;
    }
    else{
        muteBtn.innerText="Mute";
        muted=false;
    }
}
function  handleCameraClick(){
    myStream.getVideoTracks()
    .forEach((track)=>track.enabled=!track.enabled);
    if(cameraOff){
        cameraBtn.innerText="Camera Off";
        cameraOff=false;
    }
    else{
        cameraBtn.innerText="Camera On";
        cameraOff=true;
    }
}
async function handleCameraChange(){
  await getMedia(camerasSelect.value);
  if(myPeerConnection){
      const videoTrack=myStream.getVideoTracks()[0];
      const videoSender=myPeerConnection
      .getSenders()
      .find((sender)=>sender.track.kind==="video");
    videoSender.replaceTrack(videoTrack);
  }
}
muteBtn.addEventListener("click",handleMuteClick);
cameraBtn.addEventListener("click",handleCameraClick);
camerasSelect.addEventListener("input",handleCameraChange);

// socket

socket.on("welcome",async ()=> {
    myDataChannel=myPeerConnection.createDataChannel("chat");
    myDataChannel.addEventListener("message",console.log);
    console.log("made data channel");   // peer 중 하나만 data channel을 만들필요가 없다.
    const offer = await myPeerConnection.createOffer()  //  welcome 신호를 받는 browser가 offer를 생성
    myPeerConnection.setLocalDescription(offer);
    console.log("sent the offer");
    socket.emit("offer",offer,roomName);
});

socket.on("offer",async (offer)=>{
    myPeerConnection.addEventListener("datachannel",(event)=>{
        myDataChannel=event.channel;
        myDataChannel.addEventListener("message",console.log);
    });
    myPeerConnection.setRemoteDescription(offer);   
    // offer를 받은 browser가 offer를 제공한 browser의 local desciprion을 remote로 set
    const answer = await myPeerConnection.createAnswer();
    myPeerConnection.setLocalDescription(answer);
    // offer받은 s브라우저가 local description을 set
    socket.emit("answer",answer,roomName)  ;
} );

socket.on("answer",answer=>{
    console.log("received answer");
    myPeerConnection.setRemoteDescription(answer);
});
socket.on("ice",(ice) => {
    console.log("received candidate");
    myPeerConnection.addIceCandidate(ice);
});
//      RTC

function makeConnection(){
    myPeerConnection =new RTCPeerConnection({
        iceServers: [
            {
                urls: [
                    "stun:stun.l.google.com:19302",
                    "stun:stun1.l.google.com:19302",
                    "stun:stun2.l.google.com:19302",
                    "stun:stun3.l.google.com:19302",
                    "stun:stun4.l.google.com:19302",
                ]
            }
        ]
    });
    myPeerConnection.addEventListener("icecandidate",handleIce);
    myPeerConnection.addEventListener("addstream",handleAddStream);
    myStream.getTracks()
    .forEach((track)=>{
        myPeerConnection.addTrack(track,myStream)
    });
 }
 
 function handleIce(data){
    console.log("send candidate");
    socket.emit("ice",data.candidate, roomName);
 }
 function handleAddStream(data){
     const peerFace=document.getElementById("peerFace");
     peerFace.srcObject=data.stream;
 }