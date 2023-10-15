/** Initialize neccessary modules */
const userServices = require("../services/UserServices");

module.exports = {
  GetUserInformation: userServices.GetUserInformation,
  UpdateUserInformation: userServices.UpdateUserInformation,
};
