/** Initialize neccessary module */
const awsServerlessExpress = require("aws-serverless-express");
const app = require("./src_code/express_app/app");
/** Create server */
const server = awsServerlessExpress.createServer(app);

/** Exports lambda function */
exports.handler = (event, context) => {
  awsServerlessExpress.proxy(server, event, context);
};