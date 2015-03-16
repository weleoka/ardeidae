
/**
 * The broadcasting object, keeps two peer arrays for system and regular messages.
 */
function Broadcaster ( SysLog, protocols, protectedMode ) {
  this.SysLog = SysLog;
  this.broadcastTo = [];                  // List of users to be broadcasted to
  this.serverInfoBroadcastTo = [];   // List of enteties recieving server messages.
  this.protocols = protocols;
  this.protectedMode = protectedMode;
}

Broadcaster.prototype = {
/**
 * Generate protocols names for the server depending on mode.
 */
  generateProtocol: function () {
    var text = "",
          possible = "abcdefghijklmnopqrstuvwxyz0123456789",
          i;
    for ( i = 0; i < this.protocols.protected_key_length; i++ ) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  },

/**
 *  System protocol broadcaster.prototype methods.
 */
  setSystemProtocol: function () {
    if ( this.protectedMode ) {
      return this.generateProtocol();
    }
      return this.protocols.system;
  },
  addSystemPeer: function (connection) {
    this.serverInfoBroadcastTo.push(connection);
  },

  removeSystemPeer: function (peerID) {
    this.serverInfoBroadcastTo[peerID] = null;
  },

   // BROADCAST from SERVER SYSTEM to CLIENT SYSTEM.
  broadcastServerSystemInfo: function (msg) {
    var i, clients = 0;
    for ( i = 0; i < this.serverInfoBroadcastTo.length; i++ ) {
      if ( this.serverInfoBroadcastTo[i] ) {
        clients++;
        this.serverInfoBroadcastTo[i].sendUTF( msg );
      }
    }
    console.log('\nServer SYSTEM to ' + clients + ' clients: ' + msg);
  },

   // BROADCAST from SERVER SYSTEM to CLIENT UI.
  broadcastServerRegularInfo: function (msg) {
    var i, clients = 0;
    for ( i = 0; i < this.broadcastTo.length; i++ ) {
      if ( this.broadcastTo[i] ) {
        clients++;
        this.broadcastTo[i].sendUTF( msg );
      }
    }
    console.log( '\nServer INFO to ' + clients + ' clients: ' + msg );
  },

/**
 *  Regular broadcast protocol broadcaster.prototype methods.
 */
  setBroadcastProtocol: function () {
    if ( this.protectedMode ) {
      return this.generateProtocol();
    }
      return this.protocols.broadcast;
  },

  addPeer: function (connection) {
    this.broadcastTo.push(connection);
  },

  removePeer: function (peerID) {
    this.broadcastTo[peerID] = null;
  },

   // BROADCAST from CLIENT to all PEERS UI.
  broadcastPeerRegularInfo: function (msg) {
    var i, clients = 0;
    for ( i = 0; i < this.broadcastTo.length; i++ ) {
      if ( this.broadcastTo[i] ) {
        clients++;
        this.broadcastTo[i].sendUTF(msg);
      }
    }
    console.log( '\nClient REGULAR to ' + clients + ' clients: ' + msg );
  },

   // BROADCAST from CLIENT to select CLIENT(s) UI.
  broadcastPeerPrivateInfo: function (msg, list) {
    var i,
          clients = 0;
    for ( i = 0; i < list.length; i++ ) {
      if ( this.broadcastTo[ list[i] ] ) {
        clients++;
        this.broadcastTo[ list[i] ].sendUTF(msg);
      }
    }
    console.log( '\nClient PRIVATE to ' + clients + ' clients: ' + msg );
  },

/**
 *  Common object methods
 */
  toString: function () {
    var str = '',
          i;
    for ( i = 0; i < this.broadcastTo.length; i++ ) {
      str+= this.broadcastTo[i];
    }
    for ( i = 0; i < this.serverInfoBroadcastTo.length; i++ ) {
      str+= this.serverInfoBroadcastTo[i];
    }
    str += JSON.stringify(this.protocols);
    str += ', protected mode: ' + this.protectedMode;
    return str;
  },

};

module.exports = Broadcaster;
