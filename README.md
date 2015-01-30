
Messaging Server powered by Node.js and [websockets](https://github.com/theturtle32/WebSocket-Node)
=================================================

Ardeidae Server versions
---------------
v1.0.0
v1.0.1
v1.1.0
v1.1.1
v1.1.2
v1.1.3 (current)



Requirements
---------------

Requires node.js.

Also a MySQL database server if you want password protection (and long-term message logging) for server.

Node.js module dependencies:
* [WebSocket-Node](https://github.com/theturtle32/WebSocket-Node)
* [node-mysql](https://github.com/felixge/node-mysql)
* [password-hash-and-salt](https://github.com/florianheinemann/password-hash-and-salt)

Any peer connecting to the server with the custom client requires a web browser with javascript enabled and with support for websockets.



Overview
--------

This package is the result of 15 days work and is released as is. If anyone takes a look at the code, available on github, and sees any improvements then please let me know. This is my first node.js powered server/app package.

The Ardeidae server.



Documentation
=============

There is a server config file where deployment defaults can be specified, as well as important aspects such as SQL credentials, SSL certificates for HTTPS and more.


It is possible to override some config parameters on server deployment by passing command line flags:

So, the server can be started on the commandline, there are some flags you can pass in.
(note the application only accepts one argument/flag, as a standalone word without any dashes etc.)


	$ node ardeidae.server.js private

Will start the server in password protected mode. Users will need to be verified against a database userList before being granted the protocol key for communications connections.


	$ node ardeidae.server.js setup

This is will establish the database table for the server to use, if it does not already exist.
The table will have the correct attributes for Ardeidae to work with.

The server will run as a HTTPS server if you have a certificate.


All variables are specified within the config file, that is the place to edit server defaults, as well as paths to SSL certificates, SQL database credentials etc.

For more complete documentation, see the [Documentation Wiki (not yet online)](Not online as yet).


Installation
------------

I strongly recommend the custom Ardeidae client for testing the server:
$ git clone https://www.github.com/weleoka/ardeidae.client.git

The server depends on some other modules. Websocket and the mysql drivers for node.js. As well as a module for encrypting passwords. These versions tested with Ardeidae January 2015

    $ npm install websocket@1.0.3
    $ npm install mysql@2.5.4
    $ npm install password-hash-and-salt@0.1.2



Current Features:
-----------------
General functinality:
* Server config file.
* Message logging.
* Private messaging to single or multiple peers but remaining in public room.
* Filter messages with htmlEntities.
* Independent server-side name logging to prevent in session client name-changing.
* Sending a welcome message to all users joining to the room.
	- includes recent messages.
* Notifies when each user joins or leaves.
* Keeps track of total users online, and total since server deployment.
* If running in open mode notifies peers trying to connect with password that they don't need it.
* Responds to HTTP request (Ajax-CORS) with JSON containing current server meta data.
	Meta data supplied by server is:
	- What mode the server is running in.
	- Number of online peers.
	- Server uptime.
	- Total logins since deployment.

General server specs and options:
* Displays output on host machine terminal about operations.

Also about the protected server mode:
* The server has the option of being open or password protected.
* MySQL Database integration to maintain a list of registered users.
* Password encryption support.
* Random protocol name generation to prevent unauthorised access.



Known Issues/Missing Features:
------------------------------
General functionality:
* Needs a function to notify peers when user is typing a message.
* Consider the format for saving message log. JSON or Object?
* Needs multiple chattrooms... curently, one instance of the server equals one chattroom.
* Backup message log to database table (currently stored in array), but at intervals - to free up system memory and provide backup during service down time.
* Stop users sending blank messages.

General server specs and options:
* Needs a mode switching capability for verbose mode & debug mode.

Also about the protected server mode:
* issues waiting...





Credits
==============

Ardeidae is a one man project. However, many thanks to the developers of Node, Websocket and MySQL for node and the password-hash-and-salt module for node.





Licence
==============

Creative Commons Share-Alike v4.0