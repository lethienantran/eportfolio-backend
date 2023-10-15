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

/** Exports the router */
module.exports = router;
