const config = {
  dbConfig: {
    user: 'ijpDB',
    password: 'foo',
    server: 'LAPTOP-U7D59QUF',
    database: 'IJP_DB',
    trustServerCertificate: true,
    option: {
      trustServerCertificate: true,
      trustedConnection: false,
      enableArithAbort: true,
      instancename: 'SQLEXPRESS',
    },
    port: 1433,
  },
};

module.exports = config;
