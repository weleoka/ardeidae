
/**
 * Return current Local time or UTC time-date in readable format..
 */
var getUtcNow = function ( format ) {
  var now = new Date(),  //.getTime(),
        date_time_utc,
        time_local;
  if ( format === 'full' ) {
    date_time_utc = now.toUTCString();
    return date_time_utc;
  }
  if ( format === 'time' ) {
    time_local = now.toTimeString();
    return time_local;
  }
};

/**
 *  HTTP Control handles all Http requests.
 */
function HttpControl (config, mode) {
  this.serverId = 0;
  this.serverDeploymentTime = Date.now();
  this.serverCallsign = config.serverCallsign;
  this.serverVersion = config.serverVersion;
  this.serverMode = mode;
  this.onlineUsers = 0;
  this.historicalUsers = 0;
  this.domain = config.serverDomain;
  this.port = config.port;
}

HttpControl.prototype = {
  getStats: function () {
    var uptime = Math.floor( (Date.now() - this.serverDeploymentTime) / 1000 ); // deployment time in seconds
    var obj = {id: this.serverId,
                    uptime: uptime,
                    name: this.serverCallsign,
                    version: this.serverVersion,
                    privateMode: this.serverMode,
                    onlineUsers: this.onlineUsers,
                    historicalUsers: this.historicalUsers,
                    domain: this.domain,
                    port: this.port };

    return JSON.stringify(obj);
  },

  setHubId: function (hubId) {
    if ( hubId.hasOwnProperty('id') ) {
      this.serverId = hubId.id;
    }
  },

  setOnlineUsers: function (users) {
    this.onlineUsers = users;
  },

  setHistoricalUsers: function (users) {
    this.historicalUsers = users;
  },

  handleHttpRequest: function (request, response, serverStats) {

    var debug = '\n' + getUtcNow ('time') + ': ' + request.headers.origin + ' requested: "' + request.url + '" with request method: ' + request.method;

    var origin = (request.headers.origin || '*');

    if (request.method === 'OPTIONS'){

        response.writeHead( '204', 'No Content', {
          'access-control-allow-origin': origin,
          'access-control-allow-methods': 'GET, POST',
          'access-control-allow-headers': 'content-type, accept',
          'access-control-max-age': 10, // Seconds.
          'content-length': 0
        });
        console.log( debug + ' ...sending server CORS rules to client.' );
        return( response.end() );
    }

    if (request.method === 'GET') {
        var requestBodyBuffer = [];

        request.on( 'data', function( chunk ){
            requestBodyBuffer.push( chunk );
        });

        request.on('end', function() {

            response.writeHead( '200', 'OK', {
              'access-control-allow-origin': origin,
              'content-type': 'text/plain',
              'content-length': serverStats.length
            });

            console.log( debug + ' ...sending server meta data to client.' );
            return( response.end( serverStats ) );
        });
      }
  },

/**
 *  Common object methods
 */
  toString: function () {
    var str = 'toString HTTPControl: \n';
    str += 'deployment time: ' + this.serverDeploymentTime;
    str += '\n server name: ' + this.serverCallsign;
    str += '\n server version: ' + this.serverVersion;
    str += '\n server mode:: ' + this.serverMode;
    str += '\n online users: ' + this.onlineUsers;
    str += '\n historically online: ' + this.historicalUsers;
    return str;
  },

};


module.exports = HttpControl;



/**
 *  HTTPS Server.
 */
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

