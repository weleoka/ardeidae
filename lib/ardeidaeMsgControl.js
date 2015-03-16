/*globals BroadcastProtocol, SystemProtocol */

/**
 * Message Controller object
 */
function MessageController (SysLog) {
  this.SysLog = SysLog;
  this.MessageLog = [];            // Log for users messages
  this.ServerMessageLog = [];
}
MessageController.prototype = {
  htmlEntities: function (message) {
    return String(message).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  },

  prepareEcho: function (senderName, msg) {
    var obj = {name: senderName,
                    message: this.htmlEntities( msg ),
                  };
    var portable = JSON.stringify(obj);
    return portable;
  },

  preparePrivateEcho: function (senderName, msg) {
    var obj = {name: senderName,
                    message: this.htmlEntities( msg ),
                    attributes: "private" };
    var portable = JSON.stringify(obj);
    return portable;
  },

  prepareStatsReport: function (userArray, userCount) {
    var obj = {
      lead: "stat",
      activeUsers: userCount,
      info: userArray,
    };
    var portable = JSON.stringify( obj );
    return portable;
  },

  prepareServerInfoMsg: function (msg) {
    var obj = {name: ' ',
                    message: msg,
                  };
    var portable = JSON.stringify(obj);
    return portable;
  },

  prepareServerGeneralMsg: function (msg) {
    var obj = { message: msg };
    var portable = JSON.stringify(obj);
    return portable;
  },

  prepareServerUserSavedMsg: function (msg) {
    var obj = { lead: 'userSaved',
                      message: msg };
    var portable = JSON.stringify(obj);
    return portable;
  },

  prepareServerLoginMsg: function ( result, BCproto, SYSproto ) {
    var obj,
          portable;
    if ( result ) {
      obj = {  lead: 'success',
                   message: 'Successfull login.',
                   broadcast_protocol: BCproto,
                   system_protocol: SYSproto,
      };
      console.log('Successfull login, sending msg with PROTOCOLS: ' + BCproto + ' and ' + SYSproto + '\n');
      portable = JSON.stringify(obj);
      return portable;
    }
      obj = { message: 'Invalid password.' };
      portable = JSON.stringify(obj);
      return portable;
  },

  prepareHistoryEcho: function (timestamp, msg) {
    var obj = {time: timestamp,
                    message: msg,
                  };
    var portable = JSON.stringify(obj);
    return portable;
  },

};

module.exports = MessageController;



