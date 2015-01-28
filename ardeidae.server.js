/*globals Exception */

// Require the module dependencies.
var http = require('http');
var WebSocketServer = require('websocket').server;
var password = require('password-hash-and-salt');

// Load the Ardeidae module components.
var UsrControl = require('ardeidae').usrControl;
var MsgControl = require('ardeidae').msgControl;
var Broadcaster = require('ardeidae').broadcaster;
var LogKeeper = require('ardeidae').logKeeper;
var DbManager = require('ardeidae').dbManager;
var Config = require('ardeidae').config;

// Read information from config file.
var port = Config.port;
var ProtectedServer = Config.ProtectedServer;
var acceptedOrigins = Config.origins;



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
 * Function to test if item can be found in array.
 */
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
 * Return current local time in readable format..
 */
function getUtcNow ( format ) {
  var now = new Date(),
        now_utc;
  if ( format === 'full' ) {
    now_utc = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
    return now_utc;
  }
  if ( format === 'time' ) {
    now_utc = new Date(now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
    return now_utc;
  }
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



/**
 * Function to test password from user found in DB to arriving password.
 */
var logonAction = function (user, msg, callback) {
    password (msg.password).verifyAgainst(user.password, function(error, verified) {
      if (error) {
        throw new Error('Something went wrong in the password check!\n');
      } if (!verified) {
        console.log('INVALID PASSWORD.\n');
        callback(false);
      } if (verified) {
        console.log('PASSWORD CORRECT... sending protocol keys.\n');
        callback(true);
      }
    });
};



/**
 * Function to save new user to DB and hash their password.
 */
function saveNewUser (details, callback) {
  DbManager.insertSystemPeer();
  var created = new Date().getTime();
  if ( details.hasOwnProperty('password') ) {
      password(details.password).hash(function(error, hash) {
          if (error) {
            throw new Error('Something went wrong with hashing password!');
          }
          var params = [ details.name, details.email, hash, created ];
          DbManager.executeSQL(params, function (results) {
              if ( typeof callback === 'function' ) {
                callback(results);
              }
          });
      });
  }
}


// DbManager be required by the incoming CLI parameters so it start here.
var DbManager = new DbManager(Config.dbDetails);



/**
 * Handle the incoming CLI paramenters
 */
 var myArgs = process.argv.slice(2, 3);
 // console.log('myArgs: ', myArgs);
 switch (myArgs[0]) {
   case 'private':
     console.log( '\nArdeidae server in private/protected mode.\n============================================');
     var ProtectedServer = true;
     break;
   case 'setup':
/*      console.log('Saving new user: ');
      var newUserDetails = [];
      newUserDetails.name = 'John';
      newUserDetails.email = 'johnyBuoy@gmail.com';
      newUserDetails.password = 'john';
      newUserDetails.created = '2015-01-26 14:15:23';
      saveNewUser(newUserDetails);*/
     console.log(myArgs[0], ': Creating the database table.');
     DbManager.createTableifNotExists();
     DbManager.executeSQL();
     break;
   default:
     console.log( '\nArdeidae server in default mode.\n====================================');
 }



/**
 *  Start up all things Ardeidae.
 */
var UsrControl = new UsrControl();
var MsgControl = new MsgControl();
var Broadcaster = new Broadcaster(Config.protocol, ProtectedServer);
var LogKeeper = new LogKeeper();
// var DbManager = new DbManager(Config.dbDetails);


 /**
  *  Create a http server with a callback handling all requests
  */
var httpServer = http.createServer(function(request, response) {
  console.log( getUtcNow ('time')  + ': Received request for ' + request.url);
  response.writeHead(200, {'Content-length': Buffer.byteLength(), 'Content-type': 'text/plain'});
  response.end('Hello world. This is a node.js HTTP server. You can also use websocket.\n');
});

// Setup the http-server to listen to a port
httpServer.listen(port, function() {
  console.log( getUtcNow ('full') + ': HTTP server is listening on port ' + port + '\n');
});
/*var https = require('https');
var fs = require('fs');

var options = {
  key: fs.readFileSync(Config.SSLkey),
  cert: fs.readFileSync(Config.SSLcert)
};

https.createServer(options, function (req, res) {
  res.writeHead(200);
  res.end("hello world\n");
}).listen(8000);*/



 /**
  *  Create an object for the websocket
  * https://github.com/Worlize/WebSocket-Node/wiki/Documentation
  *
  */
var wsServer = new WebSocketServer({  httpServer: httpServer,  autoAcceptConnections: false });
// Generate the protocols for websocket and wsSystem
var BroadcastProtocol = Broadcaster.setBroadcastProtocol ();
var SystemProtocol = Broadcaster.setSystemProtocol ();



 /**
 * Broadcast-protocol
 * ====================================================
 */
function acceptConnectionAsBroadcast(request) {
  console.log('Protocol OK, accept BROADCAST connection...');
  var connection = request.accept(BroadcastProtocol, request.origin);
  // Get history from log before adding the new peer.
  var log = LogKeeper.retrieveRegularMessage(7);
  // Give current connection an ID based on length of user array.
  connection.broadcastId = UsrControl.getArrayLength();
  // Log the connection to broadcast array.
  Broadcaster.addPeer(connection);
  console.log( getUtcNow ('time') + ': BROADCAST connection accepted from ' + request.origin + ' id = ' + connection.broadcastId);
  UsrControl.addNewUser( connection.broadcastId, request.origin );

// Say hi, and transmit historical messages to new user.
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

  connection.on('close', function() {
    Broadcaster.removePeer(connection.broadcastId);

    Broadcaster.broadcastServerRegularInfo(
            MsgControl.prepareServerInfoMsg(
                  UsrControl.findNameByIndex(
                          connection.broadcastId
                   )
                  + ' has left the zone.'
            )
    );

    UsrControl.removeByIndex (connection.broadcastId);

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
 * System-protocol
 * ====================================================
 */
function acceptConnectionAsSystem(request) {
  console.log('Protocol OK, accept SYSTEM connection...');
  var sysConnection = request.accept(SystemProtocol, request.origin);
  // Account for the initial user created on the formation of broadcast connection.
  sysConnection.broadcastId = UsrControl.getArrayLength() -1;
   // Log the connection to server broadcasts array.
  Broadcaster.addSystemPeer(sysConnection);
  console.log( getUtcNow ('time') + ': SYSTEM connection accepted from ' + request.origin + ' id = ' + sysConnection.broadcastId);

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

         var userList = UsrControl.getStats();
         var userCount = UsrControl.getUserCount();
         Broadcaster.broadcastServerSystemInfo (
                  MsgControl.prepareStatsReport (
                          userList, userCount
                  )
         );
     }
  });

  sysConnection.on('close', function(reasonCode, description) {
    console.log( getUtcNow ('time')
                      + ': Peer ' + sysConnection.remoteAddress
                      + ' Broadcastid = ' + sysConnection.broadcastId
                      + ' disconnected from SYSTEM. Because: ' + reasonCode
                      + ' Description: ' + description);
    Broadcaster.removeSystemPeer(sysConnection.broadcastId);
  });
  return true;
}



/**
 * Login-protocol
 * ====================================================
 */
function acceptConnectionAsLogin (request) {
  console.log('Protocol OK, accepting LOGON connection...');
  var pswdConnection = request.accept('login-protocol', request.origin);
  console.log( getUtcNow ('time') + ': LOGIN connection accepted from ' + request.origin + ' id = ' + pswdConnection.broadcastId);

  pswdConnection.on('message', function(message) {
     console.log('Recieved system login message: ' + message.utf8Data + '... passing to handler.');
     var msg = JSON.parse(message.utf8Data);
     if ( ProtectedServer ) {
        if ( msg.lead === 'pswd' ) {
             DbManager.findSystemPeer();
             DbManager.executeSQL(msg.acronym, function (user) {
                 if ( user.hasOwnProperty('acronym') ) {
                     logonAction (user, msg, function (checkResult) {
                         pswdConnection.sendUTF (
                             MsgControl.prepareServerLoginMsg ( checkResult, BroadcastProtocol, SystemProtocol )
                         );
                     });
                 } else {
                    pswdConnection.sendUTF (
                            MsgControl.prepareServerGeneralMsg ('Invalid username.')
                    );
                }
             });
        } else if ( msg.lead === 'rgstr' ) {
            saveNewUser ( msg.newUserDetails, function (results) {
                if ( results.hasOwnProperty('affectedRows') ) {
                  pswdConnection.sendUTF (
                          MsgControl.prepareServerGeneralMsg ('User "' + msg.newUserDetails.name + '" registered. Welcome!')
                  );
                } else {
                  pswdConnection.sendUTF (
                          MsgControl.prepareServerGeneralMsg ('User "' + msg.newUserDetails.name + '" already exists... use a different username.')
                  );
                }

            });
        } else {
            pswdConnection.sendUTF (
                    MsgControl.prepareServerGeneralMsg ('Protected server, need password.')
            );
        }
     } else {
        pswdConnection.sendUTF (
                MsgControl.prepareServerGeneralMsg ('Open server, no need for password..')
        );
     }
      // pswdConnection.close();
  });

  pswdConnection.on('close', function(reasonCode, description) {
    console.log( getUtcNow ('time')
                      + ': Peer ' + pswdConnection.remoteAddress
                      + ' Broadcastid = ' + pswdConnection.broadcastId
                      + ' disconnected from LOGIN. Because: ' + reasonCode
                      + ' Description: ' + description);
  });
  return true;
}



/**
 *  Request handling for incoming connections.
 * ====================================================
 */
wsServer.on('request', function(request) {
  var i, status = null;

// Make sure we only accept requests from an allowed origin
  if ( !originIsAllowed(request.origin) ) {
    request.reject();
    console.log( getUtcNow ('time')  + ': Connection from origin ' + request.origin + ' rejected.');
    return;
  }

  for ( i = 0; i < request.requestedProtocols.length; i++ ) {
    console.log('\nREQUEST RECIEVED, testing protocols: "' + BroadcastProtocol + '"" and "' + SystemProtocol + '" on server, Vs. "' + request.requestedProtocols[i] + '" from client.' );
    if ( request.requestedProtocols[i] === 'login-protocol' ) {
        status = acceptConnectionAsLogin(request);
    } if ( request.requestedProtocols[i] === BroadcastProtocol ) {
        status = acceptConnectionAsBroadcast(request);
        BroadcastProtocol = Broadcaster.setBroadcastProtocol ();  // make new unique protocol key.
    } if ( request.requestedProtocols[i] === SystemProtocol ) {
        status = acceptConnectionAsSystem(request);
        SystemProtocol = Broadcaster.setSystemProtocol (); // make new unique protocol key.
      }
  }

  // Unsupported protocol.
  if (!status) {
    console.log('Subprotocol not supported');
    request.reject(404, 'Subprotocol not supported');
  }
});


// The "exit" event is sent before Node exits.
process.on("exit", function() { console.log("Goodbye"); });
// Uncaught exceptions generate events, if any handlers are registered.
// Otherwise, the exception just makes Node print an error and exit.
//process.on("uncaughtException", function(e) { console.log(Exception, e); });

// POSIX signals like SIGINT, SIGHUP and SIGTERM generate events
// process.on("SIGINT", function() { console.log("Ignored Ctrl-C"); });

