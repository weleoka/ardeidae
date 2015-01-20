 var mysql = require('mysql');
  /**
   * Create MYSQL connection.
   */
connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'enter112',
    database: 'kawe14',
    debug: 'false'
  });

connection.connect(function(err) {
    if (err) {
      console.error('error connecting to MySQL: ' + err.stack);
      return;
    }
    console.log('connected to MySQL as id ' + connection.threadId);
    useOk(connection);
  });

  /*connection.end(function(err) {
    if (err) {
      console.error('error terminating connection to MySQL: ' + err.stack);
      return;
    }
    console.log('connection to MySQL teminated.');
  });*/

/*
clientConnected = function(client)
{
	client.query('CREATE TABLE test', function(err, results) {
		if (err && err.number != Client.ERROR_DB_CREATE_EXISTS) {
			console.log("ERROR: " + err.message);
			throw err;
		}
		console.log("database created OR already exists.");
		dbCreated(client);
	});
};



dbCreated = function(client)
{
	client.query('USE test', function(err, results) {
		if (err) {
			console.log("ERROR: " + err.message);
			throw err;
		}
		useOk(client);
	});
};

*/

useOk = function(client)
{
	client.query(
		'CREATE TABLE IF NOT EXISTS table1'+
		'(id INT(11) AUTO_INCREMENT, '+
		'title VARCHAR(255), '+
		'text TEXT, '+
		'created DATETIME, '+
		'PRIMARY KEY (id));',
                      function(err, results) {
			if (err && err.number != Client.ERROR_TABLE_EXISTS_ERROR) {
				console.log("ERROR: " + err.message);
				throw err;
			}
			console.log("table ready");
			tableReady(client);
		}
	);
};



tableReady = function(client)
{
    client.query(
        'INSERT INTO table1'+
        ' SET title = ?'+
        ', text = ?'+
        ', created = ?',
        ['super cool',
         'this is a nice text',
         '2010-08-16 10:00:23'],
        function(err, results) {
            if (err) {
                console.log("ERROR: " + err.message);
                throw err;
            }
            console.dir(results);
            console.log("Inserted "+results.affectedRows+" row.");
            console.log("The unique id was " + results.insertId);
            tableHasData(client);
        }
    );
};



tableHasData = function(client)
{
    client.query(
        'SELECT * FROM table1',
        function selectCb(err, results, fields) {
            if (err) {
                console.log("ERROR: " + err.message);
                throw err;
            }
            console.log("Got "+results.length+" Rows:");
            console.log(results);
            //console.log("The meta data about the columns:");
            //console.log(fields);
            client.end();
        });
};