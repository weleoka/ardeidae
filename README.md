
Messaging Server powered by Node.js and using Websockets.

[Ardeidae homepage](http://www.student.bth.se/~kawe14/javascript/kmom10/webroot/index.php).

This server is by default set up to report to a hub on a set interval. The hub can be seen as a DNS-server for Ardeidae chat-servers so that clients can find them.



## Ardeidae Server versions
v1.3.1 (current)

(Note to author:
version specified in package.json, readme.md, changelog.md, lib/ardedae.js, config.js and git, and homepage.)



## Requirements
Requires node.js.

Also a MySQL database server if you want password protection (and long-term message logging) for server.

Node.js module dependencies:

* [WebSocket-Node](https://github.com/theturtle32/WebSocket-Node)
* [node-mysql](https://github.com/felixge/node-mysql)
* [password-hash-and-salt](https://github.com/florianheinemann/password-hash-and-salt)

Any peer connecting to the server with the custom client requires a web browser with javascript enabled and with support for websockets.



## Overview
This package is the result of much work and is released as is. If anyone takes a look at the code, available on github, and sees any improvements then please let me know. This is my first node.js powered server/app package.



## Installation
I strongly recommend the custom Ardeidae client for testing the server:
$ git clone https://www.github.com/weleoka/ardeidae.client.git

The server depends on some other modules. Websocket and the mysql drivers for node.js. As well as a module for encrypting passwords. These versions tested with Ardeidae January 2015

    $ npm install (to read from package.json OR:)

    $ npm install websocket@1.0.3
    $ npm install mysql@2.5.4
    $ npm install password-hash-and-salt@0.1.2



## Usage
In config file deployment defaults can be specified, as well as important aspects such as SQL credentials, SSL certificates for HTTPS and more.

It is possible to override some config parameters on server deployment by passing command line flags:
(note the application only accepts one argument/flag, as a standalone word without any dashes etc.)


	$ node ardeidae.server.js private

Will start the server in password protected mode. Users will need to be verified against a database userList before being granted the protocol key for communications connections.


	$ node ardeidae.server.js setup

This is will establish the database table for the server to use, if it does not already exist.
The table will have the correct attributes for Ardeidae to work with.

The server will run as a HTTPS server if you have a certificate.


All variables are specified within the config file, that is the place to edit server defaults, as well as paths to SSL certificates, SQL database credentials etc.



## Config-file
* sysLogMode: specifies the logging mode:

	- 0: debug (development) verbose and logfile messages to console.
	- 1: standard (development) verbose to console, logfile to file.
	- 2: logfile only messages (production)
	- 3: No message display or logging (silent mode)

* sysLogFile: path and file to write log to.
* sysLogFileType: takes values 'text' or 'JSON'
* port: specify the port which the http server is listening on.
* serverCallsign: here you are free to call your server whatever you wish.
* serverVersion: Do not change this value; it will have unforseen concequences for the clients.
* SSL certificates, make sure the directory is correct.
* Set the protected mode of the server.
	Please note that the server is by default not using HTTPS/SSL, and protected mode simply means that users require a registered user and password before they can use the server.
* dbDetails: This is important in order for the server to have registered users. Future versions of Ardeidae will use the same credentials for creating effective history logs of messages and storing in DB.
* dbDetailsTable: the table name which the server will create in the SQL database.
* The protocols are the default protocols that the server listens for. If in protected mode the server will generate random protocols which the client needs to have before being allowed to connect.
* Origins is very important. The server will only accept incoming websocket connections if the client is at the specified origins.
* AllowAll (not recommended) this will allow users to connect from any origin.
* Hub contains the details for which hub to connect to.


### Current Features:
General functionality:

* Configurations file.
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
* Reports current stats to ardeidae Hub.


General server specs and options:

* Displays output on host machine terminal about operations.
* Has modes for logging or displaying output on host machine terminal about operations.
* Writes entries to logfile in text or JSON format.


Also about the protected server mode:

* The server has the option of being open or password protected.
* MySQL Database integration to maintain a list of registered users.
* Password encryption support.
* Random protocols generation to prevent unauthorised access.



### Known Issues/Missing Features:
Functionality:

* If HTTP request without relevant GET parameters then serve static HTML file.
* Needs a function to notify peers when user is typing a message.
* Consider the format for saving message log. JSON or Object?
* Needs multiple chattrooms... curently, one instance of the server equals one chattroom.
* Backup message log to database table (currently stored in array), but at intervals - to free up system memory and provide backup during service down time.


Specs and options:

* Capability to write a log to database server.


Security:

* The servers protocols are not generated as they should be. They are simply made using a Math.random() function.
* Needs oversight of filtering applied to email, username and password data. DTAD (Don't Trust Any Data) from clients.


Code, style and performance:

* The server will broadast to all addresses in the peersArray, including the one who sent the message. This is probably a waste of resources, but also a source of comfort as the client knows that their message has reached, and been processed by the server.
* The server reports to the hub on a set interval using a HTTP over TCP connection. A straight UDP system, more like DNS should suffice.


## Contributing
If you'd like to contribute to Ardeidae's development, start by forking the GitHub repo:

https://github.com/weleoka/ardeidae.git

Have a look at the known issues and missing features and take a pick or find something else that needs doing.

The best way to get your changes merged is as follows:

1. Clone your fork
2. Hack away
3. If you are adding significant new functionality, document it in the README
4. Do not change the version number, I will do that on my end
5. Push the repo up to GitHub
6. Send a pull request to [weleoka/ardeidae](https://github.com/weleoka/ardeidae)



## Credits
Ardeidae is an open source project. However, many thanks to the developers of Node, Websocket and MySQL for node and the password-hash-and-salt module for node.



## Licence
Creative Commons Share-Alike v4.0




