
WebSocket Messaging Server using Node.js and:
https://github.com/Worlize/WebSocket-Node/wiki/Documentation).
=================================================

Versions
---------------
v1.0.0
v1.0.1
v1.1.0
v1.1.1
v1.1.2 (current)


Requirements
---------------

Requires node.js. Requires websocket for node.
Also a MySQL database server if you want password protection for chattroom.

Any peer connecting to the server requires a web browser with javascript enabled and with support for websockets.

For a WebSocket protocol 8 (draft-10) client written in ActionScript 3 see [AS3WebScocket](https://github.com/Worlize/AS3WebSocket) project.


Overview
--------

This package is the result of two weeks work and is released as is. If anyone takes a look at the code, available on github, and sees any improvements then please let me know. This is my first node.js powered server/app package.

The Ardeidae server.



Documentation
=============

There is a server config file where launch defaults can be specified. However, there it is possible to override some parameters on service launch by passing command line flags.

So, the server can be started on the commandline, there are some flags you can pass in.
(note the application only accepts one argument/flag, as a standalone word without any dashes etc.)


	$ node ardeidae.server.js private

Will start the server in password protected mode. Users will need to be verified against a database userList before being granted the protocol key for communications connections.


	$ node ardeidae.server.js setup

This is will establish the database table for the server to use, if it does not already exist.
The table will have the correct attributes for Ardeidae to work with.


The server will run as a HTTPS server if you have a certificate.

For more complete documentation, see the [Documentation Wiki](Not online as yet).


Installation
------------

I strongly recommend the custom Ardeidae client:
$ git clone https://www.github.com/weleoka/ardeidae.client.git

The server depends on some other modules. Websocket and the mysql drivers for node.js. As well as a module for encrypting passwords.

    $ npm install websocket@1.0.3
    $ npm install mysql@2.5.4
    $ npm install password-hash-and-salt@0.1.2



Current Features:
-----------------
General functinality:
* Message logging
* Private messaging to single or multiple peers but remaining in public room.
* Filter messages with htmlEntities
* Independent server-side name logging to prevent in session client name-changing.
* Sending a welcome message to all users joining to the room
	- includes recent messages.
* Notifies when each user joins or leaves.
* Keeps track of total users online, and total since service launch.
* If running in open mode notifies peers trying to connect with password that they don't need it.

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
* The connecting peer, if not connecting with a password can't tell if the server is down or running in protected mode. Some sort of user feedback when connecting with public protocol to protected server is needed.





Credits
==============

Ardeidae is a one man project. However, many thanks to the developers of Node, Websocket and MySQL for node.





Licence
==============

Creative Commons Share-Alike v4.0