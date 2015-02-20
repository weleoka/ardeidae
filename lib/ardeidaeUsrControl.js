/**
 * User object
 */
function User(id, origin) {
  this.time = Date.now();
  this.id = id;
  this.origin = origin || 'remote user';
  this.name = 'no-name';
}


/**
 * User Controller object
 */
function UserController() {
  this.UserList = [];
  this.activeUsers = 0;
}
UserController.prototype = {
  usersToArray: function () {
      var i, arr = [];
      for( i = 0; i < this.UserList.length; i++ ) {
        if (this.UserList[i]) {
          arr.push( this.UserList[i] );
        }
      }
      return arr;
  },

  printUserListArray: function () {
    console.log('No. of Online users: ' + this.activeUsers + ', Length of UserList array: ' + this.UserList.length);
    var i;
    for ( i = 0; i < this.UserList.length; i++ ) {
      if ( this.UserList[i] ) {
        console.log('ID: ' + this.UserList[i].id + ', at index: ' + i  + ', from: ' + this.UserList[i].origin + ', created: ' + this.UserList[i].time + ', name: ' + this.UserList[i].name);
      }
    }
  },

  getStats: function () {
    var i, userEntity, arr= [];
    for( i = 0; i < this.UserList.length; i++ ) {
      if ( this.UserList[i] ) {
        if ( this.UserList[i] !== null ) {
          userEntity = {  id:       this.UserList[i].id,
                                 name:  this.UserList[i].name };
          arr.push(userEntity);
        }
      }
    }
    return arr;
  },

  getHistory: function () {
    return 'No data available';
  },

  getArrayLength: function () {
    return this.UserList.length;
  },

  getUserCount: function () {
    return this.activeUsers;
  },

  userCountUp: function () {
    this.activeUsers++;
  },

  userCountDown: function () {
    this.activeUsers--;
  },

  addNewUser: function (ID, remoteAddress) {
    this.userCountUp();
    var newUserId = ID;
    var nowTime = new Date().toTimeString();
    console.log(nowTime + ': Creating new user with id: ' + newUserId + ' From origin: ' + remoteAddress);
    this.UserList.push( new User(newUserId, remoteAddress) );
  },

  removeByIndex: function (index) {
      this.UserList[index] = null;
      this.userCountDown();
  },

  findIndexByName: function (name) {
    var i;
    for( i = 0; i < this.UserList.length; i++ ) {
        if ( this.UserList[i].name === name ) {
          return i;
        }
    }
  },

  findNameByIndex: function (index) {
    if (this.UserList[index]) {
        return this.UserList[index].name;
    }
    return null;
  },

  findOriginByIndex: function (index) {
        if (this.UserList[index]) {
        return this.UserList[index].origin;
    }
    return null;
  },

  findIndexByRemoteAddress: function (address) {
    var i;
    for( i = 0; i < this.UserList.length; i++ ) {
      console.log('Searching db for remote addresses, found: ' + this.UserList[i].origin + ' at index: ' + i);
        if ( this.UserList[i].origin === address ) {
          return i;
        }
    }
  },

  setNameAtIndex: function (name, index) {
    if (this.UserList[index]) {
      console.log('writing new name: "' + name + '" to user on online list at index: ' + index);
      this.UserList[index].name = name;
    }
  }
};

module.exports = UserController;


