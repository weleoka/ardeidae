
/**
 * Function to test the origin of incoming connection.
 */
var originIsAllowed = function (origin, acceptedOrigins) {
  var i;
  for ( i = 0; i < acceptedOrigins.length; i++) {
    if ( origin === acceptedOrigins[i] || acceptedOrigins.allowAll ) {
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

// Return an array that holds the names of the enumerable properties of o
function getPropertyNames(/* object */o) {
    var r = [], name;
    for(name in o) { r.push(name); }
    return r;
}

// Copy the enumerable properties of the object from to the object to.
// If to is null, a new object is created.  The function returns to or the
// newly created object.
function copyProperties(/* object */ from, /* optional object */ to) {
    var p;
    if (!to) { to = {}; }
    for(p in from) { to[p] = from[p]; }
    return to;
}

// Copy the enumerable properties of the object from to the object to,
// but only the ones that are not already defined by to.
// This is useful, for example, when from contains default values that
// we want to use if they are not already defined in to.
function copyUndefinedProperties(/* object */ from, /* object */ to) {
  var p;
    for(p in from) {
        if (!p in to) { to[p] = from[p]; }
    }
}

exports.getUtcNow = getUtcNow;
exports.isNotInArray = isNotInArray;
exports.originIsAllowed = originIsAllowed;
exports.getPropertyNames = getPropertyNames;
exports.copyProperties = copyProperties;
exports.copyUndefinedProperties = copyUndefinedProperties;

