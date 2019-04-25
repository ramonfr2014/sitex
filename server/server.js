console.log("Running!");

var WebSocketServer = require('ws').Server;

var server = new WebSocketServer({port: 9090});

var rooms = {};

server.on('connection', function(connection) {
    connection.on('message', function(message){
        handleMessage(message, connection);
    });

    connection.on("close", function() {

        var room;

        for (room in rooms) {

            if (rooms[room].p1 == connection) {
                rooms[room].p1 = null;
                console.log("rooms+"+room+"].p1 left");
            }

            else if (rooms[room].p2 == connection) {
                rooms[room].p2 = null;
                console.log("rooms+"+room+"].p2 left");
            }

            if (rooms[room].p1 == null && rooms[room].p2 == null) {
                delete (rooms[room]);
                console.log(room + " deleted");
            }

        }

    });
});

function handleMessage(message, connection) {

    try {

        message = JSON.parse(message);

        switch (message.type) {

            case "checkin":
                var doesRoomExist = checkin(message, connection);
                if(connection.readyState !== 2)
                    send({type:"checkin",doesRoomExist:doesRoomExist}, connection);
                break;

            case "offer":
                sendOfferOrAnswer(message, connection);
                break;

            case "answer":
                sendOfferOrAnswer(message, connection);
                break;

            case "icecandy":
                sendOfferOrAnswer(message, connection);
                break;
        }


    }

    catch (e) {console.log(e);}
}

function checkin(message, connection){

    var doesRoomExist = (message.room in rooms);

    if (!doesRoomExist) {
        rooms[message.room] = {};
        rooms[message.room].p1 = connection;
        rooms[message.room].p2 = null;
        console.log(message.room + " created");
    }

    else {

        if (rooms[message.room].p1 == null) {
            rooms[message.room].p1 = connection;
        }

        else if (rooms[message.room].p2 == null) {
            rooms[message.room].p2 = connection;
        }

        else {
            send({type:"warning", message:"This room is full, try again later."}, connection);
            connection.close();
        }
    }

    return doesRoomExist;

}

function sendOfferOrAnswer(message, connection) {

    if (!(message.room in rooms))
        return;

    if (rooms[message.room].p1 != null && rooms[message.room].p1 !== connection)
        send(message, rooms[message.room].p1);

    else if (rooms[message.room].p2 != null && rooms[message.room].p2 !== connection)
        send(message, rooms[message.room].p2);

}

function send(message, connection) {
    connection.send(JSON.stringify(message));
}