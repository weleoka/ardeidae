
/**
 * The broadcasting object, keeps two arrays for system and regular messages.
 */
function Broadcaster () {
  this.broadcastTo = [];                  // List of users to be broadcasted to
  this.serverInfoBroadcastTo = [];   // List of enteties recieving server messages.
}

Broadcaster.prototype = {
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
    console.log('Server SYSTEM to ' + clients + ' clients: ' + msg);
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
    console.log( 'Server INFO to ' + clients + ' clients: ' + msg );
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
    console.log( 'Client REGULAR to ' + clients + ' clients: ' + msg );
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
    console.log( 'Client PRIVATE to ' + clients + ' clients: ' + msg );
  },

};



module.exports = Broadcaster;
