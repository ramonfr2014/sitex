var wsclient = new WebSocket('ws://localhost:9090');
var myConnection;
var dataChannel;
var shouldSendIceCandy = true;

wsclient.onopen = function (p1) { start(true); };

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

function start(shouldCheckin) {

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

    openDataChannel();

    myConnection.oniceconnectionstatechange = function() {
        console.log(myConnection.iceConnectionState);
        if (myConnection.iceConnectionState == "disconnected") {
            closeCon();
        }
    };

    if(shouldCheckin)
        send({type:"checkin", room:room});

}

function openDataChannel() {

    const dataChannelOptions = {
        reliable: false
    };

    dataChannel = myConnection.createDataChannel("chat", dataChannelOptions);

    dataChannel.onerror = (error) => {
        console.log("Data Channel Error:", error);
    };

    dataChannel.onmessage = (event) => {

        console.log("Got Data Channel Message");
    };

    dataChannel.onopen = () => {

        console.log("DC open");
        dataChannel.send("hi");

    };

    dataChannel.onclose = () => {
        console.log("The Data Channel is Closed");
    };
}

function closeCon(){
    start(false);
}

function send(message){
    wsclient.send(JSON.stringify(message));
}
