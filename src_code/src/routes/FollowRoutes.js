/** Initialize neccessary modules */
const express = require("express");
const responseBuilder = require("../utils/interfaces/IResponseBuilder");
const followServices = require("../controllers/interfaces/IFollow");

/** Initialize router for use */
const router = express.Router();

/**
 * POST/FOLLOW
 * URL => /api/follow/new
 */
router.post("/new", async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return responseBuilder.MissingContent(res, "RB");
    }
    return await followServices.Follow(res, req.body);
  } catch (error) {
    return responseBuilder.ServerError(
      res,
      "ERROR WHILE FOLLOWING THIS PERSON."
    );
  }
});

/**
 * DELETE/UNFOLLOW
 *  URL => /api/follow/{followId}/unfollow
 */
router.delete("/:followId/unfollow", async (req, res) => {
  try {
    const followId = req.params.followId;
    return await followServices.Unfollow(res, followId);
  } catch (error) {
    return responseBuilder.ServerError(
      res,
      "ERROR WHILE UNFOLLOWING THIS PERSON."
    );
  }
});
/** Exports the router */
module.exports = router;
