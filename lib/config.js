var config = {};

// Port to listen for connections.
config.port = 8120;

config.SSLkey = 'test/fixtures/keys/agent2-key.pem';
config.SSLcert = 'test/fixtures/keys/agent2-cert.pem';
// Set default server behaviour for login only access.
config.ProtectedServer = false;

// Details for connecting to MySQL database.
config.dbDetails = {
      host     : 'localhost',
      user     : 'root',
      password : 'enter112',
      database: 'kawe14',
      debug: false,
      trace: true
};

// These are the protocols the server uses depending on protected or public mode.
config.protocol = {
      broadcast_protected : 'broadcast-protocol-priv',
      system_protected : 'system-protocol-priv',
      broadcast : 'broadcast-protocol',
      system : 'system-protocol',
};

// Accept connections from these origins.
config.origins = ['http://dbwebb.se',
    		'http://localhost:8080',
    		'http://192.168.1.36:8080',
    		'http://www.student.bth.se',
];

module.exports = config;