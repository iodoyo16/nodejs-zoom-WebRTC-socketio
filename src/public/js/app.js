//video
//mute , unmute, turn on,off camera (switch camera)

const socket=io();
const myFace=document.getElementById("myFace");
const muteBtn =document.getElementById("mute");
const cameraBtn =document.getElementById("camera");
const camerasSelect=document.getElementById("cameras");

let myStream;
let muted=false;
let cameraOff=false;

async function getCameras(){
    try{
        const devices=await navigator.mediaDevices.enumerateDevices();
        const cameras=devices.filter(device=>device.kind==="videoinput");
        cameras.forEach((camera)=>{
            const option=document.createElement("option");
            option.value=camera.deviceId;
            option.innerText=camera.label;
            camerasSelect.appendChild(option);
        })
    }catch(err){
        console.log(err);
    }
}
async function getMedia(){
    try{
        myStream=await navigator.mediaDevices.getUserMedia(
            {
                audio:true,     //constrains: 얻고싶은 요소
                video:true,
            }
        );
        myFace.srcObject=myStream;
        await getCameras();
    }catch(err){
        console.log(err);
    }
}

getMedia()
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
muteBtn.addEventListener("click",handleMuteClick);
cameraBtn.addEventListener("click",handleCameraClick);