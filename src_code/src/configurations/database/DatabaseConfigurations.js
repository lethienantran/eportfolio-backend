/** Initialize Knex modules */
const knex = require("knex");

/** Create cofig object for export development environment */
const config = {
  client: "mysql",
  connection: {
    host: "eportfolio-production.cwqsgyahoeq7.us-west-2.rds.amazonaws.com",
    user: "eportfolio_db",
    password: "",
    database: "eportfolio_prod",
  },
};

const db = knex(config);

/** Export db object that already config */
module.exports = db;
