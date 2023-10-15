/** Initialize neccessary module */
const responseBuilder = require("../../utils/interfaces/IResponseBuilder");
const helpers = require("../../utils/interfaces/IHelpers");
const db = require("../../configurations/database/DatabaseConfigurations");
const dataRepos = require("../../utils/interfaces/IDataRepos");

/** Handles following other users */
async function Follow(res, req) {
  try {
    const errors = await ValidateFollow(res, req);
    if (errors) {
      return errors;
    }
    const { userId, userBeingFollowedId } = req;

    await db("follow").insert({
      FK_KEY_USR_ID: userId,
      FK_KEY_FOLLOW_USR_ID: userBeingFollowedId,
    });

    return responseBuilder.CreateSuccessful(res, null, "NEW FOLLOWING");
  } catch (error) {
    /** If there are errors occurred, return server error and log */
    console.log("ERROR WHILE FOLLOWING THIS PERSON: ", error);
    return responseBuilder.ServerError(
      res,
      "ERROR WHILE FOLLOWING THIS PERSON."
    );
  }
}

/** Handle validates follow other users */
async function ValidateFollow(res, req) {
  try {
    const { userId, userBeingFollowedId } = req;
    if (!userId || !userBeingFollowedId) {
      return responseBuilder.MissingContent(res);
    }
    if (
      !(await dataRepos.IsUserExistsById(db, userId)) ||
      !(await dataRepos.IsUserExistsById(db, userBeingFollowedId))
    ) {
      return responseBuilder.BuildResponse(res, 404, {
        message: "One of the users is not exists.",
      });
    }
    if (userId === userBeingFollowedId) {
      return responseBuilder.BuildResponse(res, 400, {
        message: "You cannot followed yourself.",
      });
    }
    return null;
  } catch (error) {
    /** If there are errors occurred, return server error and log */
    console.log("ERROR WHILE VALIDATING FOLLOWING THIS PERSON: ", error);
    return responseBuilder.ServerError(
      res,
      "ERROR WHILE VALIDATING FOLLOWING THIS PERSON."
    );
  }
}

/** Handles unfollow other users */
async function Unfollow(res, followId) {
  try {
    const errors = await ValidateUnfollow(res, followId);
    if (errors) {
      return errors;
    }
    /** Delete the row from table follow where PK_KEY_FOLLOW_ID = followId */
    await db("follow").where("PK_KEY_FOLLOW_ID", followId).del();
    return responseBuilder.DeleteSuccessful(res);
  } catch (error) {
    /** If there are errors occurred, return server error and log */
    console.log("ERROR WHILE UNFOLLOWING THIS PERSON: ", error);
    return responseBuilder.ServerError(
      res,
      "ERROR WHILE UNFOLLOWING THIS PERSON."
    );
  }
}

/** Handles validate unfollow other users */
async function ValidateUnfollow(res, followId) {
  try {
    /** Check if followId exists */
    // Check if followId exists in the 'follow' table
    const followRecord = await db
      .select()
      .from("follow")
      .where("PK_KEY_FOLLOW_ID", followId)
      .first();
    if (!followRecord && followRecord.length === 0) {
      return responseBuilder.BuildResponse(res, 404, {
        message: "You are not following this person.",
      });
    }
    /** Return null indicate sucess pass validation */
    return null;
  } catch (error) {
    /** If there are errors occurred, return server error and log */
    console.log("ERROR WHILE VALIDATING UNFOLLOWING THIS PERSON: ", error);
    return responseBuilder.ServerError(
      res,
      "ERROR WHILE VALIDATING UNFOLLOWING THIS PERSON."
    );
  }
}

/** Exports the modules */
module.exports = {
  Follow,
  Unfollow,
};
