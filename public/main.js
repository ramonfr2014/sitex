var wsclient = null;
var myConnection;
var dataChannel = null;
var shouldSendIceCandy = true;
var localVideo = document.getElementById("localVideo");
var remoteVideo = document.getElementById("remoteVideo");
var myStream;

document.getElementById("send").addEventListener("click", function(){
    sendDcMessage();
});
document.addEventListener('keypress', function(e) {if(e.code === "Enter"){sendDcMessage();}});

var constraints = {
    "audio": false,
    "video": true
};

navigator.mediaDevices.getUserMedia(constraints)
     .then(function(stream) {
        localVideo.srcObject = stream;
        myStream = stream;
        startWsClient();

     })
     .catch(function(err) {
         alert("Error when accessing your camera: " + err);
     });

// startWsClient();

function startWsClient(){

    wsclient = new WebSocket('ws://localhost:9090');

    wsclient.onopen = function (p1) { startRtc(true); };

    wsclient.onmessage = function (message) {
        // console.log(message);
        try {
            var message = JSON.parse(message.data);

            switch (message.type) {

                case "checkin":
                    if (message.doesRoomExist)
                        sendOffer();
                    break;

                case "offer":
                    handleOffer(message);
                    break;

                case "answer":
                    handleAnswer(message);
                    break;

                case "icecandy":
                    console.log("got icecandy");
                    myConnection.addIceCandidate(new RTCIceCandidate(message.candidate));
                    break;

                case "warning":
                    shouldSendIceCandy = false;
                    alert(message.message);
                    break;
            }

        }

        catch (e) {console.log(e);}
    };
}

function sendOffer() {

    myConnection.createOffer(
        function (offer) {
            myConnection.setLocalDescription(new RTCSessionDescription(offer));
            send({type:"offer", sdp:offer, room:room});
        },
        function (e) {alert("Offer error: " + e);}
    );
}

function handleOffer(message) {

    console.log("handle offer");
    myConnection.setRemoteDescription(message.sdp);

    myConnection.createAnswer(
        function (answer) {
            myConnection.setLocalDescription(new RTCSessionDescription(answer));
            send({type:"answer", sdp:answer, room:room});
        },
        function (error) {alert("Answer error: " + error);}
    );
}

function handleAnswer(message) {
    console.log("handle answer");
    myConnection.setRemoteDescription(new RTCSessionDescription(message.sdp));
}

function startRtc(shouldCheckin) {

    var configuration = {"iceServers": [{ "urls": "stun:stun.1.google.com:19302" }]};
    myConnection = new RTCPeerConnection(configuration);

    myConnection.onicecandidate = function (event) {
        if (event.candidate && shouldSendIceCandy) {
            send({
                type: "icecandy",
                room:room,
                candidate: event.candidate
            });
        }
    };

    myConnection.oniceconnectionstatechange = function() {
        console.log(myConnection.iceConnectionState);
        if (myConnection.iceConnectionState == "disconnected") {
            closeCon();
        }

        if (myConnection.iceConnectionState == "connected") {
            openDataChannel();
        }

    };

    myConnection.onaddstream = function(event) {
        remoteVideo.srcObject = event.stream;
    };

    myConnection.addStream(myStream);

    if(shouldCheckin)
        send({type:"checkin", room:room});

    openDataChannel();

}

function openDataChannel() {

    var dataChannelOptions = {
        reliable: true
    };

    dataChannel = myConnection.createDataChannel(room, dataChannelOptions);

    dataChannel.onerror = (error) => {
        console.log("Data Channel Error:", error);
    };

    dataChannel.onmessage = (event) => {
        console.log("Got Data Channel Message: " + event.data);
    };

    dataChannel.onopen = () => {
        console.log("DC open");
    };

    dataChannel.onclose = () => {
        console.log("The Data Channel is Closed");
    };

    myConnection.ondatachannel = function(event) {
        var channel = event.channel;
﻿           channel.onopen = function(event) {
            console.log("DC open");
        },
        channel.onmessage = function(event) {
            console.log("Dc message: " + event.data);
        }
    };

}

function sendDcMessage(){
    var msg = document.getElementById("chat").value;

    if(msg.length > 0) {
        if (dataChannel != null) {
            dataChannel.send(msg);
        }
    }

    document.getElementById("chat").value = "";
}

function closeCon(){
    // dataChannel.close();
    // dataChannel = null;
    // myConnection.close();
    // myConnection.onicecandidate = null;
    startRtc(false);
}

function send(message){
    wsclient.send(JSON.stringify(message));
}
