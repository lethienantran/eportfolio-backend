/** Initialize neccessary modules */
const express = require("express");
const responseBuilder = require("../utils/interfaces/IResponseBuilder");
const userServices = require("../controllers/interfaces/IUser");

/** Initialize router for use */
const router = express.Router();

/**
 * GET/RETRIEVE USER INFORMATION & PROJECTS
 * URL => /api/users/{userId}/information
 */
router.get("/:userId/information", async (req, res) => {
  try {
    const userId = req.params.userId;
    return await userServices.GetUserInformation(res, userId);
  } catch (error) {
    console.log("ERROR WHILE RETRIEVING USER INFORMATION: ", error);
    return responseBuilder.ServerError(
      res,
      "Error occurred while retrieving user information."
    );
  }
});

/**
 *  PUT/UPDATE USER INFORMATION
 *  URL => /api/users/information
 */
router.put("/information", async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return responseBuilder.MissingContent(res, "RB");
    }
    return await userServices.UpdateUserInformation(res, req.body);
  } catch {
    console.log("ERROR WHILE UPDATING USER INFORMATION: ", error);
    return responseBuilder.ServerError(
      res,
      "Error occurred while updating user information."
    );
  }
});

/**
 * GET/RETRIEVE SEARCH USER
 * URL => /api/users/search?username={username}
 */
router.get("/search", async (req, res) => {
  try {
    const username = req.query.username;
    return await userServices.SearchUser(res, username);
  } catch (error) {
    console.log("ERROR WHILE SEARCHING AN USER: ", error);
    return responseBuilder.ServerError(
      res,
      "Error occurred while searching an user."
    );
  }
});
/** Exports the router */
module.exports = router;
