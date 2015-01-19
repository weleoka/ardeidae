/*globals */
var port = 8120;

// Require the modules we need
var http = require('http');
var WebSocketServer = require('websocket').server;

var UsrControl = require('ardeidae').usrControl;
var MsgControl = require('ardeidae').msgControl;
var Broadcaster = require('ardeidae').broadcaster;
var LogKeeper = require('ardeidae').logKeeper;


/**
 * Function to test the origin of incoming connection.
 */
 function originIsAllowed(origin) {
  if (origin === 'http://dbwebb.se'
  	|| origin === 'http://localhost:8080'
  	|| origin === 'http://192.168.1.36:8080'
  	|| origin === 'http://www.student.bth.se') {
    return true;
  }
  return false;
}



/**
 * Check if it's a system message and handle it accordingly.
 */
function is_system_msg(userId, msg) {
  if ( msg.lead === 'init' ) {
     console.log('SYS:init recieved...');
     UsrControl.setNameAtIndex(msg.name, userId);
     return true;
  }
  if ( msg.lead === 'exit' ) {
    return true;
  }
  if ( msg.lead === 'stat' ) {
    console.log('SYS:stat recieved.');
    Broadcaster.broadcastServerSystemInfo(
            UsrControl.getStats()
    );
    return true;
  }
  if ( msg.lead === 'hist' ) {
    console.log('SYS.hist recieved.');
    Broadcaster.broadcastServerSystemInfo(
            UsrControl.getHistory()
    );
    return true;
  }
 }

function isNotInArray(search, arr) {
    var len = arr.length;
    while( len-- ) {
        if ( arr[len] == search ) {
           return false;
        }
    }
    return true;
}


/**
 * Create objects and get started.
 */
 // Create a http server with a callback handling all requests
var httpServer = http.createServer(function(request, response) {
  console.log((new Date()) + ' Received request for ' + request.url);
  response.writeHead(200, {'Content-type': 'text/plain'});
  response.end('Hello world. This is a node.js HTTP server. You can also use websocket.\n');
});

// Setup the http-server to listen to a port
httpServer.listen(port, function() {
  console.log((new Date()) + ' HTTP server is listening on port ' + port);
});

// Create an object for the websocket
// https://github.com/Worlize/WebSocket-Node/wiki/Documentation
var wsServer = new WebSocketServer({  httpServer: httpServer,  autoAcceptConnections: false });

// Start up all things Ardeidae.
var UsrControl = new UsrControl();
var MsgControl = new MsgControl();
var Broadcaster = new Broadcaster();
var LogKeeper = new LogKeeper();



 /**
 * Accept connection under the broadcast-protocol
 *
 */
function acceptConnectionAsBroadcast(request) {
  var connection = request.accept('broadcast-protocol', request.origin);
  // Get history from log before adding the new peer.
  var log = LogKeeper.retrieveRegularMessage(7);
  // Give current connection an ID based on length of user array.
  connection.broadcastId = UsrControl.getArrayLength();
  // Log the connection to broadcast array.
  Broadcaster.addPeer(connection);
  console.log((new Date()) + ' Broadcast connection accepted from ' + request.origin + ' id = ' + connection.broadcastId);
  UsrControl.addNewUser( connection.broadcastId, request.origin );

  // Welcome and send the new user the latest posts.
  connection.sendUTF(
          MsgControl.prepareServerWelcomeMsg('---> Welcome to the Ardeidae server.')
  );
  var j;
  for ( j = 0; j < log.length; j++ ) {
      connection.sendUTF(
              JSON.stringify( log[j] )
      );
  }



/*
 * Callback on message.
 */
  connection.on('message', function(message) {
        var msg,
              peerID = connection.broadcastId,
              peerName = UsrControl.findNameByIndex(peerID),
              peerOrigin = connection.remoteAddress;
        if (message.type === 'utf8') {
            msg = JSON.parse(message.utf8Data);

            // Regular messaging handler
            if ( !msg.reciever ) {
              Broadcaster.broadcastPeerRegularInfo(
                    MsgControl.prepareEcho(
                            peerName, msg.message
                    )
              );
              LogKeeper.saveRegularMessage( peerID, peerName, peerOrigin,  msg.message );
            }
            // Private messaging handler
            if ( msg.reciever ) {
              var reciever = msg.reciever;
              var privateMsg = MsgControl.preparePrivateEcho( peerName, msg.message );
              // If user not in reciever array, push.
              console.log('PEER: ' + peerID + ' Array: ' + reciever);
              if ( isNotInArray(peerID, reciever) ) {
                reciever.push(peerID);
              }
              Broadcaster.broadcastPeerPrivateInfo( privateMsg, reciever );
              LogKeeper.savePrivateMessage( peerID, peerName, peerOrigin,  msg.message, msg.reciever );
            }
        }
        else if (message.type === 'binary') {
            msg = message.binaryData;
            console.log('Received Binary Message of ' + msg.length + ' bytes');
            LogKeeper.saveRegularMessage( peerID, peerName, peerOrigin,  msg );
            connection.sendBytes( msg );
        }
  });

/*
 * Callback when connection closes. // reasonCode, description
 */
  connection.on('close', function() {
    Broadcaster.removePeer(connection.broadcastId);

      // Get userName, prepare departure info message, then broadcast.
    Broadcaster.broadcastServerRegularInfo(
            MsgControl.prepareServerInfoMsg(
                  UsrControl.findNameByIndex(
                          connection.broadcastId
                   )
                  + ' has left the zone.'
            )
    );

    UsrControl.removeByIndex (connection.broadcastId);

     // Get userList and userCount and prepare stats message, then broadcast.
    var userList = UsrControl.getStats();
    var userCount = UsrControl.getUserCount();
    Broadcaster.broadcastServerSystemInfo(
            MsgControl.prepareStatsReport(
                    userList, userCount
            )
    );
  });
  return true;
}



/**
 * Accept connection under the system-protocol
 *
 */
function acceptConnectionAsSystem(request) {
  var sysConnection = request.accept('system-protocol', request.origin);
  // Account for the initial user created on the formation of broadcast connection.
  sysConnection.broadcastId = UsrControl.getArrayLength() -1;
   // Log the connection to server broadcasts array.
  Broadcaster.addSystemPeer(sysConnection);
  console.log((new Date()) + ' system connection accepted from ' + request.origin + ' id = ' + sysConnection.broadcastId);

  // Callback to handle each message from the client
  sysConnection.on('message', function(message) {
     console.log('Recieved system message: ' + message.utf8Data + '... passing to handler.');
     var msg = JSON.parse(message.utf8Data);
     if ( is_system_msg( sysConnection.broadcastId, msg ) ) {
        // Get name from message, prepare info message and broadcast.
       var contents = msg.name + ' has entered the zone.';
       Broadcaster.broadcastServerRegularInfo (
               MsgControl.prepareServerInfoMsg (
                       contents
               )
       );
       // Save to log <-- Think about JSON parsing
       // LogKeeper.saveRegularMessage('server', 'server', 'server', contents);

        // Get userList and userCount and prepare stats message, then transmit.
       var userList = UsrControl.getStats();
       var userCount = UsrControl.getUserCount();
       Broadcaster.broadcastServerSystemInfo (
                MsgControl.prepareStatsReport (
                        userList, userCount
                )
       );
     }
  });

  // Callback when client closes the connection
  sysConnection.on('close', function(reasonCode, description) {
    console.log((new Date())
                      + ' Peer ' + sysConnection.remoteAddress
                      + ' Broadcastid = ' + sysConnection.broadcastId
                      + ' disconnected. Because: ' + reasonCode
                      + ' Description: ' + description);
    Broadcaster.removeSystemPeer(sysConnection.broadcastId);
  });
  return true;
}



/**
 *  Request handling route to different accept scenarios.
 *
 */
wsServer.on('request', function(request) {
  var i, status = null;

  if (!originIsAllowed(request.origin)) {
    // Make sure we only accept requests from an allowed origin
    request.reject();
    console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
    return;
  }

  // Loop through protocols. Accept by highest order first.
  for ( i = 0; i < request.requestedProtocols.length; i++ ) {
    if( request.requestedProtocols[i] === 'broadcast-protocol' ) {
      status = acceptConnectionAsBroadcast(request);
    } else if( request.requestedProtocols[i] === 'system-protocol' ) {
      status = acceptConnectionAsSystem(request);
    }
  }

  // Unsupported protocol.
  if(!status) {
    // acceptConnectionAsSystem(request, null);
    console.log('Subprotocol not supported');
    request.reject(404, 'Subprotocol not supported');
  }
});