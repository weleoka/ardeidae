/*globals Exception */

// Require the module dependencies.
var http = require('http');
var WebSocketServer = require('websocket').server;
var password = require('password-hash-and-salt');

// Load the Ardeidae module components.
var HttpControl = require('./lib/ardeidae').httpControl;
var UsrControl = require('./lib/ardeidae').usrControl;
var MsgControl = require('./lib/ardeidae').msgControl;
var Broadcaster = require('./lib/ardeidae').broadcaster;
var LogKeeper = require('./lib/ardeidae').logKeeper;
var DbManager = require('./lib/ardeidae').dbManager;
var Utilities = require('./lib/ardeidae').utilities;
var Config = require('./lib/ardeidae').config;

// Read information from config file... mostly done within functions to limit globals.
var ProtectedServer = Config.ProtectedServer;



/**
 * Function to check if it's a system message and handle it accordingly.
 */
function isSystemMsg(userId, msg) {
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
 *  Function to test password from user found in DB to arriving password.
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
 *  Function to save new user to DB and hash their password.
 */
function saveNewUser (details, callback) {
  DbManager.insertSystemPeer();
  var created = new Date();
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


// DbManager be required by the incoming CLI parameters so start it here.
var DbManager = new DbManager(Config.dbDetails, Config.dbDetailsTable);



/**
 *  Handle the incoming CLI paramenters
 */
 var myArgs = process.argv.slice(2, 3);
 // console.log('myArgs: ', myArgs);
 switch (myArgs[0]) {
   case 'private':
     console.log( '\nArdeidae server ' + '(v' + Config.serverVersion + ') in private/protected mode.\n============================================');
     var ProtectedServer = true;
     break;
   case 'setup':
     console.log(myArgs[0], ': Creating the database table.');
     DbManager.createTableifNotExists();
     DbManager.executeSQL([], function () { process.exit(0); });
     break;
   default:
     console.log( '\nArdeidae server ' + '(v' + Config.serverVersion + ') in default mode.\n====================================');
 }



/**
 *  Start up all things Ardeidae.
 */
var UsrControl = new UsrControl();
var MsgControl = new MsgControl();
var Broadcaster = new Broadcaster(Config.protocol, ProtectedServer);
var LogKeeper = new LogKeeper();
var HttpControl = new HttpControl(Config, ProtectedServer);
// var DbManager = new DbManager(Config.dbDetails); // DbManager is started before handling CLI parameters.



/**
 *  HTTP Server
 */
HttpControl.setOnlineUsers( UsrControl.getUserCount() );
HttpControl.setHistoricalUsers( UsrControl.getArrayLength() );

var serverStats = HttpControl.getBasicStats();
var httpServer = http.createServer(function (request, response) {
  HttpControl.handleHttpRequest( request, response, serverStats );
});

httpServer.listen(Config.port, function() {
  console.log( Utilities.getUtcNow ('full') +
    ': Listening on port ' + Config.port );
});


/**
 *  HTTP make request and send stats to HUB.
 */
var options = {
    host: Config.hub.address,
    port: Config.hub.port,
    path: Config.hub.baseUrl,
    method: Config.hub.method,
    headers: ''
};
setInterval( function() {
  HttpControl.getStats(function (stats) {
    options.headers = {
        'Content-Type': 'application/json',
        'Content-Length': stats.length
    };

    var responseBodyBuffer = [];
    var post_req = http.request(options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            responseBodyBuffer.push( chunk );
            HttpControl.setHubId ( JSON.parse( responseBodyBuffer ) );
        });
    });
    post_req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
    });

    post_req.write(stats);
    post_req.end();
    return;
  });
}, 4000);











 /**
  *  Create an object for the websocket. (Incoming WS requests handled at bottom of this file).
  * https://github.com/Worlize/WebSocket-Node/wiki/Documentation
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
  console.log( Utilities.getUtcNow ('time') + ': BROADCAST connection accepted from ' + request.origin + ' id = ' + connection.broadcastId);
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
              if ( Utilities.isNotInArray(peerID, reciever) ) {
                reciever.push(peerID);
              }
              Broadcaster.broadcastPeerPrivateInfo( privateMsg, reciever );
              LogKeeper.savePrivateMessage( peerID, peerName, peerOrigin,  msg.message, msg.reciever );
            }
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
  console.log( Utilities.getUtcNow ('time') + ': SYSTEM connection accepted from ' + request.origin + ' id = ' + sysConnection.broadcastId);

  sysConnection.on('message', function(message) {
     console.log('Recieved system message: ' + message.utf8Data + '... passing to handler.');
     var msg = JSON.parse(message.utf8Data);
     if ( isSystemMsg( sysConnection.broadcastId, msg ) ) {
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
    console.log( Utilities.getUtcNow ('time')
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
  console.log( Utilities.getUtcNow ('time') + ': LOGIN connection accepted from ' + request.origin + ' id = ' + pswdConnection.broadcastId);

  pswdConnection.on('message', function(message) {
     console.log('Recieved system login message: ' + message.utf8Data + '... passing to handler.');
     var msg = JSON.parse(message.utf8Data);

     if ( ProtectedServer ) {
  // User supplied a password
        if ( msg.lead === 'pswd' ) {
             DbManager.findSystemPeer();
             DbManager.executeSQL(msg.acronym, function (user) {
  // User was found in the DB.
                 if ( user.hasOwnProperty('acronym') ) {
                     logonAction (user, msg, function (checkResult) {
                         pswdConnection.sendUTF (
                             MsgControl.prepareServerLoginMsg ( checkResult, BroadcastProtocol, SystemProtocol )
                         );
                     });
  // User not found in DB.
                 } else {
                    pswdConnection.sendUTF (
                            MsgControl.prepareServerGeneralMsg ('Invalid username.')
                    );
                }
             });
  // User wants to register.
        } else if ( msg.lead === 'rgstr' ) {
            saveNewUser ( msg.newUserDetails, function (results) {
  // Registration success
                if ( results.hasOwnProperty('affectedRows') ) {
                  pswdConnection.sendUTF (
                          MsgControl.prepareServerUserSavedMsg ('User "' + msg.newUserDetails.name + '" registered. Welcome!')
                  );
  // User already excists.
                } else {
                  pswdConnection.sendUTF (
                          MsgControl.prepareServerGeneralMsg ('User "' + msg.newUserDetails.name + '" already exists... use a different username.')
                  );
                }
            });
  // No password supplied for login.
        } else {
            pswdConnection.sendUTF (
                    MsgControl.prepareServerGeneralMsg ('Protected server, need password.')
            );
        }
  // Open server, no password required
     } else {
        pswdConnection.sendUTF (
                MsgControl.prepareServerGeneralMsg ('Open server, no need for password..')
        );
     }
      // pswdConnection.close();
  });

  pswdConnection.on('close', function(reasonCode, description) {
    console.log( Utilities.getUtcNow ('time')
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
  if ( !Utilities.originIsAllowed(request.origin, Config.origins) ) {
    request.reject();
    console.log( Utilities.getUtcNow ('time')  + ': Connection from origin ' + request.origin + ' rejected.');
    return;
  }

  for ( i = 0; i < request.requestedProtocols.length; i++ ) {
    console.log('\nREQUEST RECIEVED, testing protocols: "' + BroadcastProtocol + '" and "' + SystemProtocol + '" on server, Vs. "' + request.requestedProtocols[i] + '" from client.' );
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

