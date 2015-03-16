/*globals Config */

/**
 * The MySQL handler.
 */
function DbManager (SysLog, dbDetails, dbDetailsTable) {
  this.SysLog = SysLog;
  // this.setDbDetails(dbDetails);
  this.dbDetails = dbDetails;
  this.numQueries = 0;
  this.sql = null;
  this.tableName = dbDetailsTable.tableName;
}

DbManager.prototype = {
  setDbDetails: function (details) {
      this.dbDetails = details;
  },
  getDbDetails: function () {
    return this.dbDetails;
  },

  createTableifNotExists: function () {
     this.sql = 'CREATE TABLE IF NOT EXISTS ' + this.tableName + ' ' +
    '(id INT(11) AUTO_INCREMENT, '+
    'acronym VARCHAR(255), '+
    'email VARCHAR(255), '+
    'password VARCHAR(300), ' +
    'created DATETIME, '+
    'PRIMARY KEY (id), ' +
    'UNIQUE  KEY acronym (acronym));';
  },

  insertSystemPeer: function () {
        this.sql = 'INSERT INTO ' + this.tableName + ' ' +
        ' SET acronym = ?'+
        ', email = ?'+
        ', password = ?'+
        ', created = ?';
  },

  findSystemPeer: function () {
    this.sql = 'SELECT * FROM ' + this.tableName + ' ' +
    'WHERE acronym = ?;';
  },



    /**
     * Create MYSQL connection and execute query.
     */
  executeSQL: function (params, callback) {
    var mysql = require('mysql');
    var sqlCon = mysql.createConnection( this.getDbDetails() );
    var sql = this.sql;
    sqlCon.connect( function (err) {
        if (err) {
          console.error('ERROR in CONNECTION to MySQL: ' + err.stack);
          return;
        }
        console.log('SUCCESS in CONNECTION to MySQL as id: ' + sqlCon.threadId + '\n');
        console.log('QUERY: ' + sql + '\n');
        if ( params ) {
          console.log('RECIEVED PARAMS. Executing...');
          console.log(params);
        }
        sqlCon.query(sql, params, function (err, results) { // callback function also takes "fields" value.
           if ( typeof callback === 'function' ) {  // Check if callback function is defined.
              if ( err ) {
                  console.log('ERROR: ' + err.message + '. ERRORNO.: '+ err.number + '\n');
                    callback(err);
              } else if ( results ) {
                  if ( results.hasOwnProperty('affectedRows') ) {
                      console.log('QUERY RETURN: impacted ' + results.affectedRows + ' rows:\n');
                      callback(results);
                  }
                  // Check if query result is array, ECMAscript standard way.
                  if ( Object.prototype.toString.call( results ) === '[object Array]' ) {
                    if ( results.length === 1 ) {
                      if ( results[0].hasOwnProperty('acronym') ) {
                        console.log('QUERY RETURN: Found user "' + results[0].acronym + '"');
                        callback( results[0] );
                      }
                    } else {
                      console.log('QUERY RETURN: user not found.');
                      callback(['empty']); // Empty array to return something.
                    }
                  }
              } else {
                  console.log('QUERY RETURN: negative result.');
                  callback(['empty']); // Empty array to return something.
              }
           }
         });
    });
  },
                      // console.log(results);
                      // console.log('\n');
                      // console.log(fields);
                      // console.log(result.insertId) // last insert ID on autincrement
                      // console.log('SUCCESS.\n');

  closeConnection: function (sqlClient) {
    sqlClient.end(function(err) {
      if (err) {
        console.error('error terminating sqlCon to MySQL: ' + err.stack);
        return;
      }
      console.log('sqlCon to MySQL teminated.');
    });
  },

/**
 *  Common object methods
 */
  toString: function () {
    var str = 'toString DBManager: \n';
    str += 'DbDetails: ' + this.dbDetails;
    str += ' number of queries: ' + this.numQueries;
    str += ' table name: ' + this.tableName;
    str += ' recent SQL: ' + this.sql;
    return str;
  },

};


module.exports = DbManager;