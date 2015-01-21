
/**
 * Message object
 */
/*function Message(userId, message) {
  var aaa = UsrControl.findNameByIndex(userId),
        bbb = UsrControl.findOriginByIndex(userId);
  this.time = Date.now();
  this.userId = userId;
  this.userName = aaa !== undefined ? aaa : 'server';
  // this.userName = UserList[userId].name || 'server';
  this.userName = bbb !== undefined ? bbb : 'server';
  // this.origin = UserList[userId].origin;
  this.message = message;
}*/


/**
 * Message Controller object
 */
function MessageController () {
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

  prepareServerLoginSuccessMsg: function (msg) {
    var obj = {  lead: 'success',
                      message: 'Successfull login.',
                      broadcast_protocol: 'broadcast-protocol',
                      system_protocol: 'system-protocol'};
    var portable = JSON.stringify(obj);
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