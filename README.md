
Messaging Server powered by Node.js and [websockets](https://github.com/theturtle32/WebSocket-Node)
=================================================



Ardeidae Server versions
---------------
v1.0.0
v1.0.1
v1.1.0
v1.1.1
v1.1.2
v1.1.3
v1.1.4
v1.2.0
v1.2.1 (current)

(Note to author:
version specified in package.json, readme.md, changelog.md, lib/ardedae.js, config.js and git)



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

For more complete documentation, see the [Documentation Wiki](http://www.student.bth.se/~kawe14/javascript/kmom10/docs/index.php).



Installation
------------

I strongly recommend the custom Ardeidae client for testing the server:
$ git clone https://www.github.com/weleoka/ardeidae.client.git

The server depends on some other modules. Websocket and the mysql drivers for node.js. As well as a module for encrypting passwords. These versions tested with Ardeidae January 2015

    $ npm install websocket@1.0.3
    $ npm install mysql@2.5.4
    $ npm install password-hash-and-salt@0.1.2



Usage
------------

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



Config-file
------------
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


For more complete documentation, see the [Documentation Wiki](http://www.student.bth.se/~kawe14/javascript/kmom10/docs/index.php).



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
* Random protocols generation to prevent unauthorised access.



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
* The servers protocols are not generated as they should be. They are simply made using a Math.random() function... and random is not random when it comes to computers.





Credits
==============

Ardeidae is a one man project. However, many thanks to the developers of Node, Websocket and MySQL for node and the password-hash-and-salt module for node.





Licence
==============

Creative Commons Share-Alike v4.0


Krav k1: Paketera, presentera och produktifiera
-----------
Ditt projektresultat skall paketeras och presenteras på ett fördelaktigt sätt. Vi kallar detta att produktifiera ditt resultat. Gör detta bra så höjer du ditt resultat från ett “vanligt studentjobb” till ett “proffsjobb”.

Detta innebär en me-sida för produkten:

    En presentation av vad din “produkt” gör, vilket problem den löser.
    Instruktioner hur man installerar, konfigurerar och använder “produkten”.
    Källkoden skall finnas på GitHub.

På denna del kan du maximalt få 10 poäng. Ett “vanligt studentjobb” ger 5 poäng, ett “proffsjobb” kan ge upp till 10 poäng.


Krav k2: Ha koll på konkurrenterna och lär av dem
-----------
Ta reda på vilka konkurrenter du har till din produkt. Analysera dem och jämför dem med din produkt. Gör analysen tillgänglig för dina kunder, som en del av din produktpresentation.

Gör du detta bra kan du få som resultat en utvecklingsplan för din produkt, presentera vilka krav och features din produkt stödjer i dagsläget och vilka som kommer i nästa version.

Försök besvara frågan varför just din produkt är — eller kommer att bli — bättre, enklare, flexiblare, enklare att använda/integrera/anpassa än konkurrenternas.

På denna del kan du maximalt få 10 poäng.


Krav k3: Kvalitet och omfattning
-------------
Din produkt har en omfattning som motsvarar mellan 20h till 80h, delvis ställt i relation till det vi gått igenom i kursen och om möjligt kopplat till din egen kunskapsnivå du hade inför kursen.

Vi bedömer hur stor omfattning vi anser produkten har samt gör en bedömning av produktens kvalitet. Detta ger underlaget för poängbedömningen. Ju större omfattning och desto bättre kvalitet desto högre poäng.

Ett enklare projekt får 5 poäng och ett mer omfattande och krävande projekt för 10 poäng.

Ett enklare projekt kan innebära att du tagit något från kursmomentet och gjort viss vidareutveckling.

Ett mer omfattande och krävande projekt innebär att du väsentligt skiljt dig från den koden som finns i kursmomenten.

På denna del kan du maximalt få 10 poäng.


Krav k4, k5, k6: Valbart krav (optionellt)
----------
Om du verkligen anser att du är värd ett högre betyg så måste du visa framfötterna. I detta fallet innebär det att du formulerar de optionella kraven på egen hand eller i samspråk med läraren.

Det handlar främst om den nivå du har på din produkt och vissa “features” kan betraktas omfatta ett eller flera optionella krav.

Det är också möjligt att du har lagt en hel del extra kraft på de vanliga kursmomenten och gjort utöver det som står under rubriken “Extra”. Om du gjort det och kan visa upp dessa på din me-sida så kan de motsvara ett optionellt krav.

Vill du vara säker så måste du ha en dialog med läraren. Fråga i forumet så får du svar där, sedan har du det på svart-och-vitt vad som gäller, så gott det går.

Tänk på att även ett enklare projekt kan ha features som kan lyftas upp som valbara krav.

Alltså, lyft upp det som du anser borde lyftas upp. Beskriv vad du gjort, varför och hur. Var tydlig — bedömning utgår från din beskrivning och därefter tittar vi på din lösning.

På denna del kan du få totalt 30 poäng (10 + 10 + 10),
Redovisning


På din redovisningssida, skriv följande:
-------------
1.1. Länka till din produkt, se krav k1.

1.2. För varje krav du implementerat, dvs k1-k6, skriver du ett textstycke om ca 15 meningar där du beskriver vad du gjort och hur du tänkt.

1.3. Ett allmänt stycke om hur projektet gick att genomföra. Problem/lösningar/strul/enkelt/svårt/snabbt/lång tid, etc. Var projektet lätt eller svårt? Tog det lång tid? Vad var svårt och vad gick lätt? Var det ett bra och rimligt projekt för denna kursen?

1.4. Avsluta med ett nytt stycke med dina tankar om kursen och vad du anser om materialet och handledningen (ca 5-10 meningar). Ge feedback till lärarna och förslå eventuella förbättringsförslag till kommande kurstillfällen. Är du nöjd/missnöjd? Kommer du att rekommendera kursen till dina vänner/kollegor? På en skala 1-10, vilket betyg ger du kursen?

2. Ta en kopia av texten på din redovisningssida och kopiera in den på Its/redovisningen. Glöm inte länka till din me-sida och projektet.

3. Ta en kopia av texten från din redovisningssida och gör ett inlägg i kursforumet och berätta att du är klar.


<h1>KMOM10</h1>

Mitt intresse vad gäller Javascript ligger i inte i första hand i snygga effekter, tool-tips och så vidare, utan snarare inom områden som prestanda, tillförlitlighet och kompatibilitet. Jag tog som projekt det som jag tyckter passar bäst för att visa vad jag kan vad gäller detta, och samtidigt lära mig mer - nämligen ett server-klient paket för chat med websockets.

Jag tycker att det här projektet har gett mig mycket god insikt i hur man implementerar Javascript best-practices, och även säkerhets aspekter för server-klient utväckling. Spännande har också varit att arbeta så mycket med Ajax och websockets.

Hela paketet har vuxit mycket större änn vad jag väntat mig. Jag tycker att principen DRY följs ganska väl i mitt projekt, och server modulen ligger på nästan precis 1000 SLOC, klienten ca. 750 SLOC. Det är ändå såpass mycket källkod att man måste dela upp koden, undvika globala variabler, implementera config-filer, och debug-metodik.



htmlEntities filtret görs endast på servern istället för i klienten också.

När användaren ansluts så skickas direkt en init med användarnamnet som sedan sätts i servern. Detta namn används sedan när meddelanden skickas, och inte det som kommer med i JSON från klienten eftersom att det kan ändras på klientsidan vid tidpunkt efter anslutning... dvs. om jag inte gjort på det här viset skulle man ganska lätt kunna låtsas vara någon annan.




Det svåraste har varit att hantera det faktum att javascript är event-driven. Jag har fått lära mig callback functions, främst där AJAX och MySQL möter javascript. Att Javascript är single-threaded är något jag fått förstå. Det fins lösningar för att simulera ett multi-thread för att på så vis jobba runt den otympliga kod man snabbt kommer in i med callback funktioner, men på den nivån som mitt projekt uppnått så krävs inte det.


