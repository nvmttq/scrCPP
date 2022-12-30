const socket = io("http://localhost:3000");
const roomId = location.pathname.substring (1)
const localStream = new MediaStream()
const  remoteStream = new MediaStream()

const btnCamera = document.getElementById("btn-camera-local")


const peer = new Peer()
var peerMediaConnect;
peer.on("open", peerId => {
    socket.emit("new-user", ({roomId, peerId}))
})

socket.on("another-user", async remotePeerId => {
    try {
        const [videoTracks, audioTracks] = await getLocalTracks({video: true, audio: true});
        localStream.addTrack(videoTracks)
        localStream.addTrack(audioTracks)
        showStream("local")
    }
    catch(e) {
        console.log(e)
    }
    const call = peer.call(remotePeerId,localStream)
    peerMediaConnect = call.peerConnection;
    call.on("stream", stream => {
        remoteStream.addTrack(stream.getVideoTracks()[0])
        remoteStream.addTrack(stream.getAudioTracks()[0])
        showStream("remote")
    })

})

peer.on("call", async call => {
    try {
        const [videoTracks, audioTracks] = await getLocalTracks({video: true, audio: true});
        localStream.addTrack(videoTracks)
        localStream.addTrack(audioTracks)
        showStream("local")
    }
    catch(e) {
        console.log(e)
    }
    call.answer(localStream)
    peerMediaConnect = call.peerConnection;
    call.on("stream", stream => {
        remoteStream.addTrack(stream.getVideoTracks()[0])
        remoteStream.addTrack(stream.getAudioTracks()[0])
        showStream("remote")
    })
})

function getLocalTracks(contrains) {
    return new Promise((resolve,reject) => {
        navigator.mediaDevices.getUserMedia(contrains)
        .then(stream => {
            if(contrains.video && contrains.audio) {
                resolve([stream.getVideoTracks()[0],stream.getAudioTracks()[0]])
            }
            else if(contrains.video) {
                resolve([stream.getVideoTracks()[0]])
            }
            else if(contrains.audio){
                resolve([stream.getAudioTracks()[0]])
            }
        }).catch(e => reject(e))
    })
}

function showStream(type) {
    const video = type === "local" ?
        document.getElementById("local") :
        document.getElementById("remote")
    video.srcObject = type === "local" ? localStream : remoteStream
    video.addEventListener("loadedmetadata", () => {
        video.play()
    })
}

function stoptrack ({stream, kind = "both"}) {
    const tracks = kind === "both" ?
        localStream.getTracks() : 
        localStream.getTracks().filter(track => track.kind === kind);
    
    tracks.forEach(track => {
        console.log(track)
        setTimeout(() => {
            track.stop();
            localStream.removeTrack(track)
        },1000)
    })
}

function replaceTrackBeginSended({track,kind}) {
    if(!peerMediaConnect) {
        return;
    }
    const rtpSenders = peerMediaConnect.getSenders();
    const filterRtpSenders = rtpSenders.filter(rtpSender => {
        rtpSender.track.kind === kind
    })
    if(filterRtpSenders.length === 0) {
        return;
    }
    const rtpSender = filterRtpSenders[0]
    rtpSender.replaceTrack(track)

}

async function buttonHandle(event) {
    const element = event.target;
    const kind = element.dataset.kind
    console.log(kind)
    if(element.dataset.state === "active") {
        stoptrack({localStream, kind})
        console.log(stoptrack({localStream, kind}))
        element.dataset.state = "stop"
    }
    else {
        try{
            const [track] = await getLocalTracks({[kind]:true});
            localStream.addTrack(track)
            replaceTrackBeginSended({track,kind})
        } catch(e) {
            console.log(e)
        } finally {
           element.dataset.state = "acitve"
        }
    }
}
function a(event) {
    buttonHandle(event)
}