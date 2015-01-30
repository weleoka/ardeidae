
function getUtcNow () {
  var now = new Date();
  var now_utc = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
  return now_utc;
}

/**
 *  HTTP Control handles all Http requests.
 */
function HttpControl (callsign, mode) {
  this.serverDeploymentTime = Date.now();
  this.serverCallsign = callsign;
  this.serverMode = mode;
  this.onlineUsers = 0;
  this.historicalUsers = 0;
}

HttpControl.prototype = {
  getStats: function () {
    var uptime = Math.floor( (Date.now() - this.serverDeploymentTime) / 1000 ); // deployment time in seconds
    var obj = {uptime: uptime,
                    name: this.serverCallsign,
                    privateMode: this.serverMode,
                    onlineUsers: this.onlineUsers,
                    historicalUsers: this.historicalUsers };
    var portable = JSON.stringify(obj);
    return portable;
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

    if (request.method === 'POST'){
        var requestBodyBuffer = [];

        request.on( 'data', function( chunk ){
            requestBodyBuffer.push( chunk );
        });

        request.on('end', function() {
         //   var requestBody = requestBodyBuffer.join( '' );

        // Create a response body to echo back the incoming request.
            // var responseBody = serverStats;

            response.writeHead( '200', 'OK', {
              'access-control-allow-origin': origin,
              'content-type': 'text/plain',
              'content-length': serverStats.length
            });

        //    console.log('CORS Data recieved is: ' + requestBody);
            console.log( debug + ' ...sending server meta data to client.' );
            return( response.end( serverStats ) );
        });
      }
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
