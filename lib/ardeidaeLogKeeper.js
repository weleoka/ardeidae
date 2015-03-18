/*globals */
'use strict';


/**
 * Message object
 */
function Message(userId, name, origin, message) {
  this.time = Date.now();
  this.userId = userId || 'error';
  this.name = name || 'undefined';
  this.origin = origin || 'undefined';
  this.message = message || 'error';
}

/**
 * Private Message object
 */
function PMessage(SysLog, userId, name, origin, message, recievers) {
  this.SysLog = SysLog;
  this.time = Date.now();
  this.userId = userId || 'error';
  this.name = name || 'undefined';
  this.origin = origin || 'undefined';
  this.message = message || 'error';
  this.recievers = recievers || 'error';
}

/**
 * LogKeeper handles all messages and stores for later retrival.
 */
function LogKeeper (SysLog) {
  this.SysLog = SysLog;
  this.messageLog = [];            // Log for users messages
  this.messagePrivateLog = []; // Log for private users messages
  this.serverMessageLog = [];  // Log for server messages.
}
LogKeeper.prototype = {
  getMessages: function () {
    return this.messageLog;
  },

  saveRegularMessage: function (id, name, origin, msg) {
    this.messageLog.push(new Message(id, name, origin, msg));
  },

  savePrivateMessage: function (id, name, origin, msg, recievers) {
    this.messagePrivateLog.push(new PMessage(id, name, origin, msg, recievers));
  },

  saveSystemMessage: function (id, name, origin, msg) {
    this.serverMessageLog.push(new Message(id, name, origin, msg));
  },

  retrieveRegularMessage: function (count) {
    var log = this.messageLog,
          arr = [],
          j;
    for ( j = log.length - count; j < log.length; j++ ) {
      if ( log[j] ) {
        arr[j] = log[j];
      }
    }
    return arr;
  },
};


module.exports = LogKeeper;
