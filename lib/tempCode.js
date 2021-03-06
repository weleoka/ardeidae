console.log('%s is %s', rocker.name, rocker.age);



 var childProcess = require('child_process'),
     ls;

 ls = childProcess.exec('ls -l', function (error, stdout, stderr) {
   if (error) {
     console.log(error.stack);
     console.log('Error code: '+error.code);
     console.log('Signal received: '+error.signal);
   }
   console.log('Child Process STDOUT: '+stdout);
   console.log('Child Process STDERR: '+stderr);
 });

 ls.on('exit', function (code) {
   console.log('Child process exited with exit code '+code);
 });



 /**
  *  HTTP Server.
  */
function handleHttpRequest(request, response) {
  console.log( getUtcNow ('time')  + ': Received request for ' + request.url);
  response.writeHead(200, {'Content-type': 'text/plain'});
  response.end('Hello world. This is a node.js HTTP server. You can also use websocket.\n');

      if (request.method == 'POST') {
        var body = '';
        request.on('data', function (data) {
            body += data;
        });
        request.on('end', function () {

            var POST = JSON.parse(body);
            // POST is the post data

        });
    }
}

// Include our HTTP module.
var http = require( "http" );


// Create an HTTP server so that we can listen for, and respond to
// incoming HTTP requests. This requires a callback that can be used
// to handle each incoming request.
var server = http.createServer(
function( request, response ){


// When dealing with CORS (Cross-Origin Resource Sharing)
// requests, the client should pass-through its origin (the
// requesting domain). We should either echo that or use *
// if the origin was not passed.
var origin = (request.headers.origin || "*");


// Check to see if this is a security check by the browser to
// test the availability of the API for the client. If the
// method is OPTIONS, the browser is check to see to see what
// HTTP methods (and properties) have been granted to the
// client.
if (request.method.toUpperCase() === "OPTIONS"){


// Echo back the Origin (calling domain) so that the
// client is granted access to make subsequent requests
// to the API.
response.writeHead(
"204",
"No Content",
{
"access-control-allow-origin": origin,
"access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
"access-control-allow-headers": "content-type, accept",
"access-control-max-age": 10, // Seconds.
"content-length": 0
}
);

// End the response - we're not sending back any content.
return( response.end() );


}


// -------------------------------------------------- //
// -------------------------------------------------- //


// If we've gotten this far then the incoming request is for
// our API. For this demo, we'll simply be grabbing the
// request body and echoing it back to the client.


// Create a variable to hold our incoming body. It may be
// sent in chunks, so we'll need to build it up and then
// use it once the request has been closed.
var requestBodyBuffer = [];

// Now, bind the data chunks of the request. Since we are
// in an event-loop (JavaScript), we can be confident that
// none of these events have fired yet (??I think??).
request.on( "data", function( chunk ){
// Build up our buffer. This chunk of data has
// already been decoded and turned into a string.
    requestBodyBuffer.push( chunk );
});


// Once all of the request data has been posted to the
// server, the request triggers an End event. At this point,
// we'll know that our body buffer is full.
request.on("end", function(){
// Flatten our body buffer to get the request content.
    var requestBody = requestBodyBuffer.join( "" );

// Create a response body to echo back the incoming request.
    var responseBody = ( "Thank You For The Cross-Domain AJAX Request:\n\n" +
        "Method: " + request.method + "\n\n" + requestBody );

// Send the headers back. Notice that even though we
// had our OPTIONS request at the top, we still need to
// echo back the ORIGIN in order for the request to
// be processed on the client.
    response.writeHead( "200", "OK", {
    "access-control-allow-origin": origin,
    "content-type": "text/plain",
    "content-length": responseBody.length
    });

// Close out the response.
    return( response.end( responseBody ) );
});
