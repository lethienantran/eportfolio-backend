/** Initialize neccessary modules */
const authenticationServices = require("../services/AuthenticationServices");

module.exports = {
    SignUp: authenticationServices.SignUp,
    SignIn: authenticationServices.SignIn,
}