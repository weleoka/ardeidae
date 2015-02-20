var config = {};

// Port to listen for connections.
config.port = 8120;
// Given to HUB. Should be in format: www.nodejs1.student.bth.se, nodejs1.student.bth.se.
config.serverDomain = 'localhost';
// The name of your server.
config.serverCallsign = 'Ardeidae One';
config.serverVersion = '1.3.0';

// HTTPS certificates
config.SSLkey = 'test/fixtures/keys/agent2-key.pem';
config.SSLcert = 'test/fixtures/keys/agent2-cert.pem';
// Set default server behaviour for login only access.
config.ProtectedServer = false;

// Details for connecting to MySQL database.
config.dbDetails = {
      host     : 'localhost', // blu-ray.student.bth.se
      user     : 'root',  // kawe14
      password : 'enter112',
      insecureAuth: true, // Required for some newer SQL servers.
      database: 'kawe14',
      debug: false,
      trace: true,
};

config.dbDetailsTable = {tableName: 'ardeidaeUsers'};

// These are the protocols the server uses depending on protected or public mode.
config.protocol = {
      protected_key_length: 14,
      broadcast_protected : 'broadcast-protocol-priv',
      system_protected : 'system-protocol-priv',
      broadcast : 'broadcast-protocol',
      system : 'system-protocol',
};

// Accept connections from these origins.
config.origins = ['*',
];

// Enable to allow all origins.
config.origins.allowAll = true;



// Ardeidae HUB details.
config.hub = { address: 'localhost',
                       port: 8121,
                       baseUrl: '/',
                       method: 'POST' };





module.exports = config;