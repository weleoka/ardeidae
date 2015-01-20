

/**
 * The broadcasting object, keeps two arrays for system and regular messages.
 */
function DbManager () {
  this.numQueries = 0;

}

DbManager.prototype = {
  getDbDetails: function () {
    return {
      host     : 'localhost',
      user     : 'root',
      password : 'enter112',
      database: 'kawe14',
      debug: 'false'
    };
  },

  createTableifNotExists: function () {
     var sql = 'CREATE TABLE IF NOT EXISTS table1'+
    '(id INT(11) AUTO_INCREMENT, '+
    'acronym VARCHAR(255), '+
    'email VARCHAR(255), '+
    'password VARCHAR(255), ' +
    'created DATETIME, '+
    'PRIMARY KEY (id));';

    this.executeSQL(sql);
  },

  insertSystemPeer: function () {
        var sql = 'INSERT INTO table1'+
        ' SET acronym = ?'+
        ', email = ?'+
        ', password = ?'+
        ', created = ?';
        var params = ['John',
         'john@gmail.com',
         'john',
         '2015-01-16 10:00:23'];

         this.executeSQL(sql, params);
  },

  findSystemPeer: function (client) {
    client.query(
        'SELECT * FROM table1',
        function selectCb(err, results, fields) {
            if (err) {
                console.log("ERROR: " + err.message);
                throw err;
            }
            console.log("Got "+results.length+" Rows:");
            console.log(results);
            console.log(fields);
            //console.log("The meta data about the columns:");
            //console.log(fields);
            client.end();
        });
  },

    /**
     * Create MYSQL connection and execute query.
     */
  executeSQL: function (sql, params) {
    var mysql = require('mysql');
    var connection = mysql.createConnection( this.getDbDetails() );

    connection.connect(function(err) {
      if (err) {
        console.error('error connecting to MySQL: ' + err.stack);
        return;
      }

      connection.query(sql, params,
        function(err, results) {
          if (err) {
            console.log("ERROR: " + err.message + "ERRORNO.: " + err.number);
            throw err;
          }

        console.log("table ready " + results);
      });

      console.log('connected to MySQL as id ' + connection.threadId);
    });

/*    connection.end(function(err) {
      if (err) {
        console.error('error terminating connection to MySQL: ' + err.stack);
        return;
      }
      console.log('connection to MySQL teminated.');
    });*/


  },

};


module.exports = DbManager;