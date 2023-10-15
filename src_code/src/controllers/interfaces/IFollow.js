/** Initialize neccessary module */
const followServices = require("../services/FollowServices");

module.exports = {
  Follow: followServices.Follow,
  Unfollow: followServices.Unfollow,
};
