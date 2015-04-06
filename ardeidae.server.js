#!/usr/bin/env node
/*globals Exception */

// Require the module dependencies.
var osFunctions = require('os');
var fs = require('fs');
var http = require('http');
var WebSocketServer = require('websocket').server;
var password = require('password-hash-and-salt');

// Load the Ardeidae module components.
var HttpControl = require('./lib/ardeidae').httpControl;
var UsrControl = require('./lib/ardeidae').usrControl;
var MsgControl = require('./lib/ardeidae').msgControl;
var Broadcaster = require('./lib/ardeidae').broadcaster;
var SysLog = require('./lib/ardeidae').sysLog;
var LogKeeper = require('./lib/ardeidae').logKeeper;
var DbManager = require('./lib/ardeidae').dbManager;
var Utilities = require('./lib/ardeidae').utilities;
var Config = require('./lib/ardeidae').config;

// Read information from config file... mostly done directly where needed.
var ProtectedServer = Config.ProtectedServer;



/**
 * Function to check if it's a system message and handle it accordingly.
 */
function isSystemMsg(userId, msg) {
  if ( msg.lead === 'init' ) {
     UsrControl.setNameAtIndex(msg.name, userId);
     return true;
  }
  if ( msg.lead === 'exit' ) {
    return true;
  }
  if ( msg.lead === 'stat' ) {
    Broadcaster.broadcastServerSystemInfo(
            UsrControl.getStats()
    );
    return true;
  }
  if ( msg.lead === 'hist' ) {
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
            SysLog.file('Error in hashing password.', 'ERR')
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

// All other modules need to be passed the sysLog object.
var SysLog = new SysLog(Config, Utilities, fs);
// DbManager is required by the incoming CLI parameters so start it here.
var DbManager = new DbManager(SysLog, Config.dbDetails, Config.dbDetailsTable);



/**
 *  Handle the incoming CLI paramenters
 */
 var myArgs = process.argv.slice(2, 3);
 // console.log('myArgs: ', myArgs);
 switch (myArgs[0]) {
   case 'private':
     SysLog.console( '\nArdeidae (v' + Config.serverVersion + ') in private/protected mode.\n============================================');
     SysLog.file( 'Ardeidae (v' + Config.serverVersion + ') started on ' + osFunctions.hostname() + ', port ' + Config.port + '(private mode)');
     var ProtectedServer = true;
     break;
   case 'setup':
     SysLog.console('Creating the database table.');
     DbManager.createTableifNotExists();
     DbManager.executeSQL([], function () { process.exit(0); });
     break;
   default:
     SysLog.console( '\nArdeidae (v' + Config.serverVersion + ') in default mode.\n====================================');
     SysLog.file( 'Ardeidae (v' + Config.serverVersion + ') started on ' + osFunctions.hostname() + ', port ' + Config.port + '(open mode)');
 }



/**
 *  Start up all things Ardeidae.
 */
var UsrControl = new UsrControl(SysLog);
var MsgControl = new MsgControl(SysLog);
var Broadcaster = new Broadcaster(SysLog, Config.protocol, ProtectedServer);
var LogKeeper = new LogKeeper(SysLog);
var HttpControl = new HttpControl(SysLog, Config, ProtectedServer);
// var DbManager = new DbManager(Config.dbDetails); // DbManager is started before handling CLI parameters.



/**
 *  HTTP Connection setup.
 * ===============================================
 */
var httpServer = http.createServer(function (request, response) {
  HttpControl.handleHttpRequest( request, response );
});

httpServer.listen(Config.port, function() {
  SysLog.console( 'Listening on port ' + Config.port + ' domain: ' + osFunctions.hostname() );
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
var roo = 0;
var stopMsgRepeat = function (message) {
  var msg = message || 0;
  if ( roo === msg ) { return msg; }
  if ( roo !== msg ) {
    SysLog.console(msg);
    SysLog.file(msg);
    return msg;
  }
};

var reportToHub = function() {
  HttpControl.getStats(function (stats) {
    options.headers = {
        'Content-Type': 'application/json',
        'Content-Length': stats.length
    };

    var post_req = http.request(options, function(res) {
        var responseBodyBuffer = [];
        var recievedData;

        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            roo = stopMsgRepeat('Connected to HUB.');
            responseBodyBuffer.push( chunk );
            try {
                recievedData =  JSON.parse( responseBodyBuffer[0] );
            } catch (err) {
                SysLog.file('fault_in_json: ' + err);
            }
            HttpControl.setHubId ( recievedData );
        });
    });

    post_req.on('error', function(e) {
       roo = stopMsgRepeat('No connection to HUB: ' + e.message);
    });

    post_req.write(stats);
    post_req.end();
    return;
  });
};
setInterval( reportToHub, Config.hub.reportingInterval );



/**
  *  Create an object for the websocket. (Incoming WS requests routed at bottom of this file).
  *   https://github.com/Worlize/WebSocket-Node/wiki/Documentation
 * ===============================================
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
  var connection = request.accept(BroadcastProtocol, request.origin);
  // Get history from log before adding the new peer.
  var log = LogKeeper.retrieveRegularMessage(7);
  // Give current connection an ID based on length of user array.
  connection.broadcastId = UsrControl.getArrayLength();
  // Log the connection to broadcast array.
  Broadcaster.addPeer(connection);
  SysLog.file( 'BROADCAST connection accepted from ' + request.origin + ' id = ' + connection.broadcastId);
  HttpControl.onlineUsers++;
  HttpControl.historicalUsers++;
  UsrControl.addNewUser( connection.broadcastId, request.origin );

// Say hi, and transmit recent messages to new user.
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

    // Empty message. Return on function, discarding message.
            if ( msg.message.length === 0 ) {
              return;
            }

    // Public message, no specific recievers specified.
            if ( !msg.reciever ) {
              Broadcaster.broadcastPeerRegularInfo(
                    MsgControl.prepareEcho(
                            peerName, msg.message
                    )
              );
              LogKeeper.saveRegularMessage( peerID, peerName, peerOrigin,  msg.message );
            }

    // Private messaging, specific recievers.
            if ( msg.reciever ) {
              var reciever = msg.reciever;
              var privateMsg = MsgControl.preparePrivateEcho( peerName, msg.message );
    // If sender not in private reciever array, push.
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
    HttpControl.onlineUsers--;
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
  SysLog.console('Protocol OK, accept SYSTEM connection...');
  var sysConnection = request.accept(SystemProtocol, request.origin);
  // Account for the initial user created on the formation of broadcast connection.
  sysConnection.broadcastId = UsrControl.getArrayLength() -1;
   // Log the connection to server broadcasts array.
  Broadcaster.addSystemPeer(sysConnection);
  SysLog.file( 'SYSTEM connection accepted from ' + request.origin + ' id = ' + sysConnection.broadcastId);

  sysConnection.on('message', function(message) {
     SysLog.console('Recieved system message: ' + message.utf8Data + '... passing to handler.');
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
    SysLog.file( 'Peer ' + sysConnection.remoteAddress
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
  SysLog.console('Protocol OK, accepting LOGON connection...');
  var pswdConnection = request.accept('login-protocol', request.origin);
  SysLog.file( 'LOGIN connection accepted from ' + request.origin + ' id = ' + pswdConnection.broadcastId);

  pswdConnection.on('message', function(message) {
     SysLog.console('Recieved system login message: ' + message.utf8Data + '... passing to handler.');
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
    SysLog.file( 'Peer ' + pswdConnection.remoteAddress
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
    SysLog.console( 'Connection from origin ' + request.origin + ' rejected.');
    return;
  }

  for ( i = 0; i < request.requestedProtocols.length; i++ ) {
    SysLog.console('\nREQUEST RECIEVED, testing protocols: "' + BroadcastProtocol + '" and "' + SystemProtocol + '" on server, Vs. "' + request.requestedProtocols[i] + '" from client.' );
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
    SysLog.console('Subprotocol not supported');
    request.reject(404, 'Subprotocol not supported');
  }
});


// The "exit" event is sent before Node exits.
process.on("exit", function() { SysLog.file('Server shut down'); });
// Uncaught exceptions generate events, if any handlers are registered.
// Otherwise, the exception just makes Node print an error and exit.
//process.on("uncaughtException", function(e) { console.log(Exception, e); });

// POSIX signals like SIGINT, SIGHUP and SIGTERM generate events
// process.on("SIGINT", function() { console.log("Ignored Ctrl-C"); });

