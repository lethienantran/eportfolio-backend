/** Initialize neccessary modules */
const responseBuilder = require("../../utils/interfaces/IResponseBuilder");
const helpers = require("../../utils/interfaces/IHelpers");
const db = require("../../configurations/database/DatabaseConfigurations");
const dataRepos = require("../../utils/interfaces/IDataRepos");

async function GetUserInformation(res, userId) {
  try {
    const userFollowers = await db
      .select()
      .from("follow")
      .where("FK_KEY_FOLLOW_USR_ID", "=", userId);
    let userFollowersResponseObject = [];
    if (userFollowers && userFollowers.length > 0) {
      userFollowersResponseObject = userFollowers.map((userFollower) => {
        return {
          followId: userFollower.PK_KEY_FOLLOW_ID,
          userId: userFollower.FK_KEY_USR_ID,
          userFollowerId: userFollower.FK_KEY_FOLLOW_USR_ID,
        };
      });
    }

    const userFollowings = await db
      .select()
      .from("follow")
      .where("FK_KEY_USR_ID", "=", userId);

    let userFollowingsResponseObject = [];
    if (userFollowings && userFollowings.length > 0) {
      userFollowingsResponseObject = userFollowings.map((userFollowing) => {
        return {
          followId: userFollowing.PK_KEY_FOLLOW_ID,
          userId: userFollowing.FK_KEY_USR_ID,
          userFollowerId: userFollowing.FK_KEY_FOLLOW_USR_ID,
        };
      });
    }

    const personalProjects = await db
      .select()
      .from("project")
      .where("FK_KEY_USR_ID", "=", userId)
      .where("PROJECT_TYPE", "=", "SL");
    let personalProjectsResponseObject = [];
    if (personalProjects && personalProjects.length > 0) {
      personalProjectsResponseObject = await Promise.all(
        personalProjects.map(async (project) => {
          const photoInfo = await dataRepos.GetPhotoInformation(
            db,
            project.FK_KEY_PHOTO_ID
          );
          return {
            projectId: project.PK_KEY_PROJECT_ID,
            projectPhoto: photoInfo,
          };
        })
      );
    }
    const collaborateProjects = await db("project_collaborator")
      .select(
        "project.PK_KEY_PROJECT_ID as PK_KEY_PROJECT_ID",
        "project.FK_KEY_PHOTO_ID as FK_KEY_PHOTO_ID"
      )
      .leftJoin(
        "project",
        "project.PK_KEY_PROJECT_ID",
        "project_collaborator.FK_KEY_PROJECT_ID"
      )
      .where("project_collaborator.FK_KEY_USR_ID", userId);
    let collaborateProjectsResponseObject = [];
    if (collaborateProjects && collaborateProjects.length > 0) {
      collaborateProjectsResponseObject = await Promise.all(
        collaborateProjects.map(async (project) => {
          const photoInfo = await dataRepos.GetPhotoInformation(
            db,
            project.FK_KEY_PHOTO_ID
          );
          return {
            projectId: project.PK_KEY_PROJECT_ID,
            projectPhoto: photoInfo,
          };
        })
      );
    }
    const user = await db
      .select(
        "PK_KEY_USR_ID",
        "TXT_FULL_NAME",
        "TXT_MAJOR",
        "TXT_SCHOOL",
        "FK_KEY_PHOTO_ID",
        "USR_EMAIL",
        "USR_USERNAME"
      )
      .from("user_account")
      .where("PK_KEY_USR_ID", "=", userId)
      .first();

    if (!user) {
      return responseBuilder.BuildResponse(res, 404, {
        message: "User is not exists.",
      });
    }
    const photoInformation =
      user.FK_KEY_PHOTO_ID === 0
        ? null
        : await dataRepos.GetPhotoInformation(db, user.FK_KEY_PHOTO_ID);

    const responseObject = {
      userId: user.PK_KEY_USR_ID,
      fullname: user.TXT_FULL_NAME,
      major: user.TXT_MAJOR,
      school: user.TXT_SCHOOL,
      userImage: photoInformation,
      email: user.USR_EMAIL,
      username: user.username,
      personalProjects: personalProjectsResponseObject,
      collaborateProjects: collaborateProjectsResponseObject,
      userFollowers: userFollowersResponseObject,
      userFollowings: userFollowingsResponseObject,
    };

    return responseBuilder.GetSuccessful(
      res,
      responseObject,
      "USER INFORMATION"
    );
  } catch (error) {
    console.log("ERROR WHILE RETRIEVING USER INFORMATION: ", error);
    return responseBuilder.ServerError(
      res,
      "Error occurred while retrieving user information."
    );
  }
}

/** Handle update user information */
async function UpdateUserInformation(res, req) {
  /** Begin the transaction */
  const trx = await db.transaction();
  try {
    const errors = await ValidateUpdateUserInformation(res, req);
    if (errors) {
      return errors;
    }
    const {
      userId,
      fullname,
      major,
      school,
      email,
      encodePhoto,
      photoOGWidth,
      photoOGHeight,
    } = req;
    let isImageAppear = encodePhoto === null ? false : true;
    if (isImageAppear) {
      const currentUserInformation = await dataRepos.GetUserInfoByID(
        db,
        userId
      );
      const updatedUserImageData = {
        TXT_PHOTO_BASE64: encodePhoto,
        PHOTO_OG_WIDTH: photoOGWidth,
        PHOTO_OG_HEIGHT: photoOGHeight,
      };
      /** Freshly new image */
      if (currentUserInformation.userImage === null) {
        const newPhoto = await trx("photo").insert({
          ...updatedUserImageData,
        });
        const newPhotoId = newPhoto[0];
        const updateUserInformation = {
          TXT_FULL_NAME: helpers.CapitalizeFirstLetter(
            fullname.trim().toLowerCase()
          ),
          TXT_MAJOR: helpers.CapitalizeFirstLetter(major.trim().toLowerCase()),
          TXT_SCHOOL: helpers.CapitalizeFirstLetter(
            school.trim().toLowerCase()
          ),
          USR_EMAIL: email.toLowerCase().trim(),
          FK_KEY_PHOTO_ID: newPhotoId,
        };
        await trx("user_account")
          .where("PK_KEY_USR_ID", userId)
          .update(updateUserInformation);
      } else {
        let isUpdateImage =
          encodePhoto === currentUserInformation.userImage.photoEncode64
            ? false
            : true;

        let newPhotoId =
          isUpdateImage === true
            ? (await trx("photo").insert({ ...updatedUserImageData }))[0]
            : currentUserInformation.userImage.photoId;
        const updateUserInformation = {
          TXT_FULL_NAME: helpers.CapitalizeFirstLetter(
            fullname.trim().toLowerCase()
          ),
          TXT_MAJOR: helpers.CapitalizeFirstLetter(major.trim().toLowerCase()),
          TXT_SCHOOL: helpers.CapitalizeFirstLetter(
            school.trim().toLowerCase()
          ),
          USR_EMAIL: email.toLowerCase().trim(),
          FK_KEY_PHOTO_ID: newPhotoId,
        };
        const promises = [];
        promises.push(
          trx("user_account")
            .where("PK_KEY_USR_ID", userId)
            .update(updateUserInformation)
        );

        if (isUpdateImage) {
          promises.push(
            trx("photo")
              .where(
                "PK_KEY_PHOTO_ID",
                currentUserInformation.userImage.photoId
              )
              .del()
          );
        }
        await Promise.all(promises);
      }
    } else {
      const updateUserInformation = {
        TXT_FULL_NAME: helpers.CapitalizeFirstLetter(
          fullname.trim().toLowerCase()
        ),
        TXT_MAJOR: helpers.CapitalizeFirstLetter(major.trim().toLowerCase()),
        TXT_SCHOOL: helpers.CapitalizeFirstLetter(school.trim().toLowerCase()),
        USR_EMAIL: userEmail.toLowerCase().trim(),
      };
      await trx("user_account")
        .where("PK_KEY_USR_ID", userId)
        .update(updateUserInformation);
    }
    await trx.commit();
    return responseBuilder.UpdateSuccessful(res, null, "YOUR INFORMATION");
  } catch (error) {
    /** If failed to update a project, roll back transaction, return server error and logs */
    console.log("ERROR WHILE UPDATING USER INFORMATION: ", error);
    await trx.rollback();
    return responseBuilder.ServerError(
      res,
      "Error occurred while updating your information."
    );
  }
}

/** Handle validating update user information */
async function ValidateUpdateUserInformation(res, req) {
  try {
    const {
      userId,
      fullname,
      major,
      school,
      email,
      encodePhoto,
      photoOGHeight,
      photoOGWidth,
    } = req;
    if (!userId || !fullname || !major || !school || !email) {
      return responseBuilder.MissingContent(res);
    }

    if (!(await dataRepos.IsUserExistsById(db, userId))) {
      return responseBuilder.NotFound(res, "USER");
    }

    if ((encodePhoto && !photoOGHeight) || (encodePhoto && !photoOGWidth)) {
      return responseBuilder.BuildResponse(res, 400, {
        message: "Original size of photo is not given.",
      });
    }

    /** Validating if the update email address is already in use by other users. */
    const userHasEmailAddressInUse = await db
      .select("USR_EMAIL", "PK_KEY_USR_ID")
      .from("user_account")
      .where("USR_EMAIL", "=", email.toLowerCase().trim())
      .first();

    if (userHasEmailAddressInUse) {
      if (
        userHasEmailAddressInUse.USR_EMAIL === email.toLowerCase().trim() &&
        parseInt(userHasEmailAddressInUse.PK_KEY_USR_ID, 10) !==
          parseInt(userId, 10)
      ) {
        return responseBuilder.BuildResponse(res, 400, {
          message: "EMAIL ALREADY IN USED.",
        });
      }
    }
    return null;
  } catch (error) {
    /** If failed to retrieve project information, return server error and logs */
    console.log("ERROR WHILE VALIDATING UPDATE USER INFORMATION: ", error);
    return responseBuilder.ServerError(
      res,
      "Error occurred while validating update user information"
    );
  }
}

module.exports = {
  GetUserInformation,
  UpdateUserInformation,
};
