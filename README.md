
WebSocket Messaging Server using Node.js and:
https://github.com/Worlize/WebSocket-Node/wiki/Documentation).
=================================================

Versions
---------------
v1.0.0
v1.0.1
v1.1.0 (current)


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




For more complete documentation, see the [Documentation Wiki](Not online as yet).


Installation
------------

I strongly recommend the custom Ardeidae client:
$ git clone https://www.github.com/weleoka/ardeidae.client.git
Then in the ardeidae folder, i.e. in your project root:

    $ npm install ardeidae

The server depends on some other modules. Websocket and the mysql drivers for node.js.

    $ npm install websocket@1.0.3
    $ npm install mysql@2.5.4



Current Features:
-----------------
* Message logging
* Private messaging to single or multiple peers but remaining in public room.
* Filter messages with htmlEntities
* Independent server-side name logging to prevent in session client name-changing.
* Sending a welcome message to all users joining to the room
	- includes recent messages.
* Notifies when each user joins or leaves.
* Keeps track of total users online, and total since service launch.

Also:

* The server has the option of being open or password protected.
* MySQL Database integration to maintain a list of registered users.



Known Issues/Missing Features:
------------------------------
General:
* Needs a function to notify peers when user is typing a message.
* Concider the format for saving message log. JSON or Object?
* Needs multiple chattrooms... curently, one instance of the server equals one chattroom.

* Backup message log to database table (currently stored in array), but at intervals - to free up system memory and provide backup during service down time.

Protected server:
* Very low security on passwords and protocol keys. We need some encryption and key-generation here!
* The connecting peer, if not connecting with a password can't tell if the server is down or running in protected mode. Some sort of user feedback when connecting with public protocol to protected server is needed.



Usage Examples
==============



Server Example
--------------




Client Example
--------------




Resources
---------





Credits
==============

* Ardeidae is a one man project. However, many thanks to the developers of Node, Websocket and MySQL for node.



Licence
==============

Creative Commons Share-Alike v4.0