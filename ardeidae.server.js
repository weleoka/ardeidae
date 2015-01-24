/*globals */

// Require the modules we need
var http = require('http');
var WebSocketServer = require('websocket').server;

// Load the Ardeidae module components.
var UsrControl = require('ardeidae').usrControl;
var MsgControl = require('ardeidae').msgControl;
var Broadcaster = require('ardeidae').broadcaster;
var LogKeeper = require('ardeidae').logKeeper;
var DbManager = require('ardeidae').dbManager;
var Config = require('ardeidae').config;


/**
 * Read information from config file.
 */
var port = Config.port;
// Check if default is protected or public mode.
var ProtectedServer = Config.ProtectedServer;
// Set the protocol for the server listening on broadcast and system connections.
if ( ProtectedServer ) {
  var broadcastProtocol = Config.protocol.broadcast_protected;
  var systemProtocol = Config.protocol.system_protected;
} else {
  var broadcastProtocol = Config.protocol.broadcast;
  var systemProtocol = Config.protocol.system;
}
var acceptedOrigins = Config.origins;

/**
 *  Start up all things Ardeidae.
 */
var UsrControl = new UsrControl();
var MsgControl = new MsgControl();
var Broadcaster = new Broadcaster();
var LogKeeper = new LogKeeper();
var DbManager = new DbManager(Config.dbDetails);




/**
 * Function to test the origin of incoming connection.
 */
 function originIsAllowed(origin) {
  var i;
  for ( i = 0; i < acceptedOrigins.length; i++) {
    if ( origin === acceptedOrigins[i] ) {
      return true;
    }
  }
  return false;
}



/**
 * Function to test password from user found in DB to arriving password.
 */
var logonAction = function (user, msg) {
  if ( user ) {
    console.log('TESTING TESTING TESTING TESTING TESTING: ' + user[0].password + ' vs ' + msg.password);
    if ( user[0].password === msg.password ) {
      console.log('MATCH FOUND!!!!! YOU ARE NOW LOGGED ON.');// LogedOn = true;
      return true;
    }
  }
  console.log('PROBLEM FINDING USER OR VERIFYING PASSWORD.');
  return false;
};



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
 * Handle the incoming CLI paramenters
 */
 var myArgs = process.argv.slice(2, 3);
 // console.log('myArgs: ', myArgs);

 switch (myArgs[0]) {
   case 'private':
     console.log(myArgs[0], ': Starting server in private/protected mode.');
     var ProtectedServer = true;
     break;
   case 'setup':
     console.log(myArgs[0], ': Creating the database table.');
     DbManager.createTableifNotExists();
     DbManager.executeSQL();
          //var name = 'John';
/*        var params = ['John',
         'john@gmail.com',
         'john',
         '2015-01-16 10:00:23'];
*/
// DbManager.insertSystemPeer(params);
//var userFound = DbManager.findSystemPeer(name);
//console.log('USER FOUND: ' + userFound);
     break;
   default:
     console.log('Starting server without passing any flags, i.e. mode specified in config.js.');
 }



 /**
 *  Create a http server with a callback handling all requests
 */
var httpServer = http.createServer(function(request, response) {
  console.log((new Date()) + ' Received request for ' + request.url);
  response.writeHead(200, {'Content-length': Buffer.byteLength(), 'Content-type': 'text/plain'});
  response.end('Hello world. This is a node.js HTTP server. You can also use websocket.\n');
});

// Setup the http-server to listen to a port
httpServer.listen(port, function() {
  console.log((new Date()) + ' HTTP server is listening on port ' + port);
});



 /**
 *  Create an object for the websocket
 * https://github.com/Worlize/WebSocket-Node/wiki/Documentation
 *
 */
var wsServer = new WebSocketServer({  httpServer: httpServer,  autoAcceptConnections: false });


 /**
 * Accept connection under the broadcast-protocol
 *
 */
function acceptConnectionAsBroadcast(request) {
  var connection = request.accept(broadcastProtocol, request.origin);
  // Get history from log before adding the new peer.
  var log = LogKeeper.retrieveRegularMessage(7);
  // Give current connection an ID based on length of user array.
  connection.broadcastId = UsrControl.getArrayLength();
  // Log the connection to broadcast array.
  Broadcaster.addPeer(connection);
  console.log((new Date()) + 'BROADCAST connection accepted from ' + request.origin + ' id = ' + connection.broadcastId);
  UsrControl.addNewUser( connection.broadcastId, request.origin );

  // Welcome and send the new user the latest posts.
  connection.sendUTF(
          MsgControl.prepareServerGeneralMsg('---> Welcome to the Ardeidae server.')
  );
  var j;
  for ( j = 0; j < log.length; j++ ) {
      if (log[j]) {
        connection.sendUTF(
                JSON.stringify( log[j] )
        );
      }
  }



/*
 * Callback on message.
 */
  connection.on('message', function(incoming) {
        var msg,
              peerID = connection.broadcastId,
              peerName = UsrControl.findNameByIndex(peerID),  // get name from server.
              peerOrigin = connection.remoteAddress;
        if (incoming.type === 'utf8') {
            msg = JSON.parse(incoming.utf8Data);

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
        else if (incoming.type === 'binary') {
            msg = incoming.binaryData;
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
  var sysConnection = request.accept(systemProtocol, request.origin);
  // Account for the initial user created on the formation of broadcast connection.
  sysConnection.broadcastId = UsrControl.getArrayLength() -1;
   // Log the connection to server broadcasts array.
  Broadcaster.addSystemPeer(sysConnection);
  console.log((new Date()) + ' SYSTEM connection accepted from ' + request.origin + ' id = ' + sysConnection.broadcastId);

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
                      + ' disconnected from SYSTEM. Because: ' + reasonCode
                      + ' Description: ' + description);
    Broadcaster.removeSystemPeer(sysConnection.broadcastId);
  });
  return true;
}



/**
 * Accept connection under the login-protocol
 *
 */
function acceptConnectionAsLogin(request) {
  var pswdConnection = request.accept('login-protocol', request.origin);
  console.log((new Date()) + 'LOGIN connection accepted from ' + request.origin + ' id = ' + pswdConnection.broadcastId);

  // Callback to handle each message from the client
  pswdConnection.on('message', function(message) {
     console.log('Recieved system login message: ' + message.utf8Data + '... passing to handler.');
     var msg = JSON.parse(message.utf8Data);

      if ( msg.lead === 'pswd' ) {
           console.log('SYS:pswd recieved...');

           DbManager.findSystemPeer();
           DbManager.executeSQL(msg.acronym, function(user) {

             if ( user ) {
                 console.log('FOUND USER: ' + user[0].acronym);
             }
             if ( logonAction(user, msg) ) {
                 pswdConnection.sendUTF(
                     MsgControl.prepareServerLoginSuccessMsg(broadcastProtocol, systemProtocol)
                 );
                 pswdConnection.close();
             } else {
                pswdConnection.sendUTF(
                     MsgControl.prepareServerGeneralMsg('Error in username or password.')
                );
                pswdConnection.close();
             }
           });

      }
  });

  // Callback when client closes the connection
  pswdConnection.on('close', function(reasonCode, description) {
    console.log((new Date())
                      + ' Peer ' + pswdConnection.remoteAddress
                      + ' Broadcastid = ' + pswdConnection.broadcastId
                      + ' disconnected from LOGIN. Because: ' + reasonCode
                      + ' Description: ' + description);
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

  if ( ProtectedServer ) {
    // Loop through protocols. Accept by highest order first.
    for ( i = 0; i < request.requestedProtocols.length; i++ ) {
      if ( request.requestedProtocols[i] === 'login-protocol' ) {
          console.log('Checking PASSWORD');
          status = acceptConnectionAsLogin(request);
      } if ( request.requestedProtocols[i] === broadcastProtocol ) {
          console.log('PROTECTED protocol OK, accept BROADCAST connection.');
          status = acceptConnectionAsBroadcast(request);
      } if ( request.requestedProtocols[i] === systemProtocol ) {
          console.log('PROTECTED protocol OK, accept SYSTEM connection.');
          status = acceptConnectionAsSystem(request);
        }
    }
  }
  if ( !ProtectedServer ) {
        // Loop through protocols. Accept by highest order first.
    for ( i = 0; i < request.requestedProtocols.length; i++ ) {
      if ( request.requestedProtocols[i] === 'broadcast-protocol' ) {
        console.log('PUBLIC protocol OK, accept BROADCAST connection.');
        status = acceptConnectionAsBroadcast(request);
      } else if( request.requestedProtocols[i] === 'system-protocol' ) {
        console.log('PUBLIC protocol OK, accept SYSTEM connection.');
        status = acceptConnectionAsSystem(request);
      }
    }
  }

  // Unsupported protocol.
  if (!status && !ProtectedServer) {
    // acceptConnectionAsSystem(request, null);
    console.log('Subprotocol not supported');
    request.reject(404, 'Subprotocol not supported');
  }
  if (!status && ProtectedServer) {
    // acceptConnectionAsSystem(request, null);
    console.log('Subprotocol not supported, or not logged on.');
    request.reject(404, 'Subprotocol not supported or not logged on.');
  }
});