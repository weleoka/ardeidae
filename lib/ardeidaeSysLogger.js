/*globals */
'use strict';
/**
 * System logger object
 */
 // Modes:
  // 0: debug (development) console and logfile messages to console.
  // 1: standard (development) console to console, logfile to file.
  // 2: logfile only messages (production)
  // 3: No message display or logging (silent mode)

function SysLog (config, utils, nodeFS) {
    this.fileHandler = nodeFS;
    this.getUtcNow = utils.getUtcNow;
    this.mode = config.sysLogMode;
    this.path = config.sysLogFile;
    this.logMethod = config.sysLogFileType;
}

SysLog.prototype = {
    console: function (out) {
        if ( this.mode === 0 || this.mode === 1 ) {
            console.log(this.getUtcNow() + ': ' + out);
        }
    },

    inspect: function (object) {
        if ( this.mode === 0 || this.mode === 1 ) {
            console.dir(object);
        }
    },

    file: function (out, entryType) {
        var type = entryType || 'NORM';
        var time = this.getUtcNow;
        if ( typeof out !== 'string' ) {
            out = JSON.stringify(out);
        }
        if ( this.mode === 1 || this.mode === 2 ) {
            if ( this.logMethod === 'JSON' ) {
                var objectEntry = {
                                time: time(),
                                type: type,
                                data: out
                };
                this.write( JSON.stringify(objectEntry) );

            } else if ( this.logMethod === 'text' ) {
                var textEntry = ('\n' + time() + ': ' + '[' + type + '] ' + out );
                this.write( textEntry );
            } else {
                console.log("ERROR in logging method to file, please check the settings in the config file.");
            }

        }
        if ( this.mode === 0 ) {
            console.log (time() + ': ' + out);
        }
    },

    // http://nodejs.org/docs/latest/api/fs.html
    write: function (line) {
        var fs = this.fileHandler;
        var path = this.path;
        var buffer = new Buffer(line);

        fs.open(path, 'a', function(err, fd) {
            if (err) {
                throw 'error opening log file: ' + err;
            }
            fs.write(fd, buffer, 0, buffer.length, null, function(err) {//,data) {
                if (err) {throw 'error writing log file: ' + err;}
                fs.close(fd, function() { return; });
                // console.log(data);
            });

        });
    }

};


module.exports = SysLog;
