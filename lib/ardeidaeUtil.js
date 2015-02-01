
/**
 * Function to test the origin of incoming connection.
 */
var originIsAllowed = function (origin, acceptedOrigins) {
  var i;
  for ( i = 0; i < acceptedOrigins.length; i++) {
    if ( origin === acceptedOrigins[i] ) {
      return true;
    }
  }
  return false;
};



/**
 * Function to test if item can be found in array.
 */
var isNotInArray = function (search, arr) {
  var len = arr.length;
  while( len-- ) {
      if ( arr[len] == search ) {
         return false;
      }
  }
  return true;
};



/**
 * Return current Local time or UTC time-date in readable format..
 */
var getUtcNow = function ( format ) {
  var now = new Date(),  //.getTime(),
        date_time_utc,
        time_local;
  if ( format === 'full' ) {
    date_time_utc = now.toUTCString();
    return date_time_utc;
  }
  if ( format === 'time' ) {
    time_local = now.toTimeString();
    return time_local;
  }
};

/**
 * Convert UTC time to local HHMM.
 */
var convertUtcToLocalHHMM = function(timestamp) {
    var utc = new Date(timestamp);
    var time = utc.toLocaleTimeString('en-US', { hour12: false });
    return time.substring(0, time.length-3);
};


exports.getUtcNow = getUtcNow;
exports.isNotInArray = isNotInArray;
exports.originIsAllowed = originIsAllowed;
