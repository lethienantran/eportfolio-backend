/** Import neccessary modules */
const express = require("express");
const cors = require("cors");
const app = express();

/** Import neccessary routes */
const authenticationRoute = require("../src/routes/AuthenticationRoutes");
const projectRoute = require("../src/routes/ProjectRoutes")

/** Use Cors */
app.use(cors());

/** Parse JSON request body */
app.use(express.json());

/** Define the PORT */
const PORT = 5000;

/** Use the routes (Create middleware) */
app.use("/api/authentication", authenticationRoute);
app.use("/api/project", projectRoute);

/** Start the server */
app.listen(PORT, (err) => {
    if(err) {
        console.error("ERROR STARTING SERVER: ", err); 
    } else {
        console.log(`SERVER IS RUNNING ON PORT ${PORT}.`);
    }
});

/** Export the express app */
module.exports = app;