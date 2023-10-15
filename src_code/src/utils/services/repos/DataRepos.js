async function IsUsernameExists(db, username) {
    try {
      /** Query the database for the existence of the username associated with the provided username */
      const existUsername = await db
        .select("USR_USERNAME")
        .from("user_account")
        .where("USR_USERNAME", "=", username.toLowerCase().trim());
  
      /** Return true if the username is found in the database, false otherwise */
      return existUsername && existUsername.length > 0;
    } catch (error) {
      console.log(
        /** If failed to check username existence, return error log */
        "ERROR WHILE VALIDATING USERNAME EXISTENCE BY USERNAME: ",
        error
      );
    }
}

async function IsEmailExists(db, emailAddress) {
  try {
    /** Query the database for the existence of the email address associated with the provided email address */
    const existUserEmail = await db
      .select("USR_EMAIL")
      .from("user_account")
      .where("USR_EMAIL", "=", emailAddress.toLowerCase().trim());

    /** Return true if the email address associated with the email address is found in the database, false otherwise */
    return existUserEmail && existUserEmail.length > 0;
  } catch (error) {
    /** If failed to check email address existence, return error log */
    console.log("ERROR WHILE VALIDATING EMAIL EXISTENCE", error);
  }
}

async function GetUserInfoByUsername(db, username) {
  try {
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
      .where("USR_USERNAME", "=", username.toLowerCase().trim())
      .first();
    const photoInformation = await GetPhotoInformation(db, user.FK_KEY_PHOTO_ID);
    return {
      userId: user.PK_KEY_USR_ID,
      fullname: user.TXT_FULL_NAME,
      major: user.TXT_MAJOR,
      school: user.TXT_SCHOOL,
      userImage: photoInformation,
      email: user.USR_EMAIL,
      username: user.USR_USERNAME
    }
  } catch (error) {
    /** If failed to get user by username, return log */
    console.log("ERROR WHILE RETRIEVING USER BY USERNAME: ", error);
    return null;
  }
}

async function GetUserInfoByID(db, userId) {
  try {
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
    const photoInformation = await GetPhotoInformation(db, user.FK_KEY_PHOTO_ID);
    return {
      userId: user.PK_KEY_USR_ID,
      fullname: user.TXT_FULL_NAME,
      major: user.TXT_MAJOR,
      school: user.TXT_SCHOOL,
      userImage: photoInformation,
      email: user.USR_EMAIL,
      username: user.USR_USERNAME
    }
  } catch (error) {
    /** If failed to get user by username, return log */
    console.log("ERROR WHILE RETRIEVING USER BY USERNAME: ", error);
    return null;
  }
}

async function IsUserExistsById(db, userId) {
  try {
    /** Query the database for the existence of the username associated with the provided user ID */
    const existUsername = await db
      .select("USR_USERNAME")
      .from("user_account")
      .where("PK_KEY_USR_ID", "=", userId);

    /** Return true if the username associated with the user ID is found in the database, false otherwise */
    return existUsername && existUsername.length > 0;
  } catch (error) {
    /** If failed to check username existence, return error log */
    console.log("ERROR WHILE VALIDATING USERNAME EXISTENCE BY ID: ", error);
  }
}

async function GetProjectCollaborators(db, projectId) {
  try {
    /** Query the database for the existence collaborators of the project. */
    const collaboratorsID = await db.select("FK_KEY_USR_ID").from("project_collaborator").where("FK_KEY_PROJECT_ID", "=", projectId);
    
    /** Once got array of id of the project's collaborators, we will store each collaborator's information from user_account table */
    const collaboratorsInfo = [];

    /** Loop through the collaborators' IDs and fetch their details. */
    for (const row of collaboratorsID) {
      const userID = row.FK_KEY_USR_ID;
      const userInfo = await GetUserInfoByID(db, userID);
      if (userInfo) {
        collaboratorsInfo.push(userInfo);
      }
    }

    /** Return the array of all collaborators' information */
    return collaboratorsInfo;
  } catch (error) {
    /** If failed to check username existence, return error log */
    console.log("ERROR WHILE GETTING PROJECT'S COLLABORATORS BY PROJECT ID: ", error);
  }
}

async function IsProjectExists(db, projectId) {
  try {
    const project = await db.select().from("project").where("PK_KEY_PROJECT_ID", "=", projectId);
    return project && project.length > 0;
  } catch (error) {
    /** If failed to check project existence, return error log */
    console.log("ERROR WHILE VALIDING PROJECT'S EXISTENCE BY PROJECT ID: ", error);
  }
}

async function GetProjectInformation(db, projectId){
  try{ 
    const project = await db.select().from("project").where("PK_KEY_PROJECT_ID", "=", projectId).first();
    
    /** Return null to indicate that the project does not exist */
    if (!project) {
      return null; 
    }

    const collaborators = project.PROJECT_TYPE === "SL" ? [] : await GetProjectCollaborators(db, projectId);
    const projectOwner = await GetUserInfoByID(db, project.FK_KEY_USR_ID);
    const photoInformation = await GetPhotoInformation(db, project.FK_KEY_PHOTO_ID);
    const responseObject = {
      projectId: project.PK_KEY_PROJECT_ID,
      projectOwner: projectOwner,
      projectTitle: project.TXT_PROJECT_TITLE,
      projectDescription: project.TXT_PROJECT_DESCRIPTION,
      projectType: project.PROJECT_TYPE,
      projectPhoto: photoInformation,
      projectCreationDate: project.CREATION_DATE,
      projectLikeCount: project.NUMBER_OF_LIKES,
      projectCollaborators: collaborators,
    };

    return responseObject;
  } catch (error) {
    /** If failed to check PROJECT existence, return error log */
    console.log("ERROR WHILE GETTING PROJECT'S INFORMATION BY PROJECT ID: ", error);
  }
}

async function GetPhotoInformation(db, photoId) {
  try {
    if(photoId === 0) return null;
    else {
      const photo = await db.select().from("photo").where("PK_KEY_PHOTO_ID", "=", photoId).first();
      if (photo) {
        return {
          photoId: photo.PK_KEY_PHOTO_ID, // Corrected the column name
          photoEncode64: photo.TXT_PHOTO_BASE64,
          photoOGWidth: photo.PHOTO_OG_WIDTH,
          photoOGHeight: photo.PHOTO_OG_HEIGHT,
        };
      } else {
        // Handle the case where the query returned no results (photo not found)
        return null;
      }
    }
  } catch (error) {
    /** If failed to check photo existence, return error log */
    console.log("ERROR WHILE GETTING PHOTO'S INFORMATION BY PROJECT ID: ", error);
  }
}

module.exports = {
    IsUsernameExists,
    IsUserExistsById,
    IsEmailExists,
    GetUserInfoByUsername,
    GetUserInfoByID,
    GetProjectCollaborators,
    GetProjectInformation,
    IsProjectExists,
    GetPhotoInformation,
}