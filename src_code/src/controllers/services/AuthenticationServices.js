/** Initialize neccessary modules */
const bcrypt = require("bcryptjs");
const responseBuilder = require("../../utils/interfaces/IResponseBuilder");
const helpers = require("../../utils/interfaces/IHelpers");
const db = require("../../configurations/database/DatabaseConfigurations");
const dataRepos = require("../../utils/interfaces/IDataRepos");

/** Handles user sign-up */
async function SignUp(res, req) {
  try {
    /** Validate before signing up */
    const errors = await ValidateSignUpBody(res, req);
    if (errors) {
      return errors;
    }

    /** If validation pass, destructure variables from request body */
    const { fullname, major, school, userEmail, username, password } = req;

    /** Encrypt the password */
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const encryptedPassword = await bcrypt.hash(password, salt);

    const userData = {
      TXT_FULL_NAME: helpers.CapitalizeFirstLetter(
        fullname.trim().toLowerCase()
      ),
      TXT_MAJOR: helpers.CapitalizeFirstLetter(major.trim().toLowerCase()),
      TXT_SCHOOL: helpers.CapitalizeFirstLetter(school.trim().toLowerCase()),
      USR_EMAIL: userEmail.toLowerCase().trim(),
      USR_USERNAME: username.toLowerCase().trim(),
      USR_PASSWORD: encryptedPassword,
    };

    // Insert the user data into the database using Knex
    await db("user_account").insert(userData);

    // If inserted successful, then return with message
    return responseBuilder.CreateSuccessful(res, null, "Your account");
  } catch (error) {
    /** If there are errors occurred, return server error and log */
    console.log("ERROR WHILE SIGNING-UP: ", error);
    return responseBuilder.ServerError(res, "ERROR WHILE SIGNING-UP.");
  }
}

/** Handles validation before while signing up */
async function ValidateSignUpBody(res, req) {
  /** Destructure variables from the request body */
  const { fullname, major, school, userEmail, username, password } = req;
  if (!fullname || !major || !school || !userEmail || !username || !password) {
    return responseBuilder.MissingContent(res);
  }

  /** If username exists, return bad request with message */
  if (await dataRepos.IsUsernameExists(db, username)) {
    return responseBuilder.BuildResponse(res, 400, {
      message: "Username already exists.",
    });
  }

  /** If email address exists, return bad request with message */
  if (await dataRepos.IsEmailExists(db, userEmail)) {
    return responseBuilder.BuildResponse(res, 400, {
      message: "Email already in used.",
    });
  }

  /** If all checks pass, return null to indicate validation success */
  return null;
}

/** Handle Sign In */
async function SignIn(res, req) {
  try {
    /** Validate before sign-in process */
    const errors = await ValidateSignInBody(res, req);
    if (errors) {
      return errors;
    }

    /** If validations pass, destructure varaibles from the request body*/
    const { username } = req;

    /** Get user based on username, it will return a list, but will expected to get 1 row only */
    const user = await dataRepos.GetUserInfoByUsername(db, username);
    /** Create response object */
    const responseObject = {
      userId: user.userId,
      fullname: user.fullname,
      major: user.major,
      school: user.school,
      userImage: user.userImage,
      email: user.email,
      username: user.username,
    };

    /** Return get successful message */
    return responseBuilder.GetSuccessful(res, responseObject, "SIGN-IN");
  } catch (error) {
    /** If failed to sign-in, return server error and log */
    console.log("ERROR WHILE SIGNING-IN: ", error);
    return responseBuilder.ServerError(res, "Error occurs when signing in.");
  }
}

/** Validate Sign In */
async function ValidateSignInBody(res, req) {
  /** Destructure the username and password from the signInBody */
  const { username, password } = req;

  /** If the required fields are missing */
  if (!username || !password) {
    return responseBuilder.MissingContent(res);
  }

  /** Query the database to check if the user exists */
  const existUser = await db("user_account")
    .select("USR_USERNAME", "USR_PASSWORD")
    .where("USR_USERNAME", username.toLowerCase().trim())
    .first();

  if (!existUser) {
    return responseBuilder.BuildResponse(res, 404, {
      message: "Incorrect username or password.",
    });
  }

  /** Compare the password */
  if (!bcrypt.compareSync(password, existUser.USR_PASSWORD)) {
    return responseBuilder.BuildResponse(res, 404, {
      message: "Incorrect username or password.",
    });
  }

  /** If all checks pass, return null to indicate validation success */
  return null;
}

/** Exports the function */
module.exports = {
  SignUp,
  SignIn,
};
