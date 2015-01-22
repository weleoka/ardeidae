/*globals Config */

/**
 * The MySQL handler.
 */
function DbManager (dbDetails) {
  // this.setDbDetails(dbDetails);
  this.dbDetails = dbDetails;
  this.numQueries = 0;
  this.sql = null;
}

DbManager.prototype = {
  setDbDetails: function (details) {
      this.dbDetails = details;
  },
  getDbDetails: function () {
    return this.dbDetails;
  },

  createTableifNotExists: function () {
     this.sql = 'CREATE TABLE IF NOT EXISTS table1'+
    '(id INT(11) AUTO_INCREMENT, '+
    'acronym VARCHAR(255), '+
    'email VARCHAR(255), '+
    'password VARCHAR(255), ' +
    'created DATETIME, '+
    'PRIMARY KEY (id), ' +
    'UNIQUE  KEY acronym (acronym));';
  },

  insertSystemPeer: function () {
        this.sql = 'INSERT INTO table1'+
        ' SET acronym = ?'+
        ', email = ?'+
        ', password = ?'+
        ', created = ?';
  },

  findSystemPeer: function () {
    this.sql = 'SELECT * FROM table1 ' +
    'WHERE acronym = ?;';
  },



    /**
     * Create MYSQL connection and execute query.
     */
  executeSQL: function (params, callback) {
    var mysql = require('mysql');
    var connection = mysql.createConnection( this.getDbDetails() );
    var sql = this.sql;
    connection.connect(function(err) {
      if (err) {
        console.error('ERROR in CONNECTION to MySQL: ' + err.stack);
        return;
      }
      console.log('SUCCESS in CONNECTION to MySQL as id ' + connection.threadId);
      console.log('EXECUTING QUERY: ' + sql);
      console.log('PARAMS: ' + params);
      return connection.query(sql, params,
        function(err, results, fields) {
            if ( err ) {
              console.log("ERROR in QUERY: " + err.message + "ERRORNO.: " + err.number);
            }
            if ( results[0] ) {
              console.log("Got "+results.length+" Rows:");
              console.log(results);
              // console.log(fields);
              // console.log(result.insertId) // last insert ID on autincrement */
              return callback(results);
            }
            return callback();
        });


    });
  },

  closeConnection: function (sqlClient) {
    sqlClient.end(function(err) {
      if (err) {
        console.error('error terminating connection to MySQL: ' + err.stack);
        return;
      }
      console.log('connection to MySQL teminated.');
    });
  },



};


module.exports = DbManager;