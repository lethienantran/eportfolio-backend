/** Initialize neccessary modules */
const responseBuilder = require("../../utils/interfaces/IResponseBuilder");
const helpers = require("../../utils/interfaces/IHelpers");
const db = require("../../configurations/database/DatabaseConfigurations");
const dataRepos = require("../../utils/interfaces/IDataRepos")

async function PostProject(res, req) {
    /** Begin the transaction */
    const trx = await db.transaction();

    try {
        const errors = await ValidatePostProjectBody(res, req);
        if(errors) {
            return errors;
        }

        /** Destructure variables from request body */
        const {projectTitle, projectPhoto, projectOwnerId, projectCollaborators, projectDescription} = req;
        
        const projectType = projectCollaborators.length > 0 ? "GP" : "SL";

        const projectData = {
            FK_KEY_USR_ID: projectOwnerId,
            TXT_PROJECT_TITLE: helpers.CapitalizeFirstLetter(projectTitle.trim().toLowerCase()),
            TXT_PROJECT_DESCRIPTION: projectDescription,
            PROJECT_TYPE: projectType,
            PROJECT_IMAGE: projectPhoto,
        }

        // Insert the project data into the database using Knex
        const newProject = await trx("project").insert({...projectData});
        
        if(projectType == "GP") {
            const newProjectID = newProject[0];

            const collaborators = projectCollaborators.map((collaborator) => ({
                FK_KEY_USR_ID: collaborator,
                FK_KEY_PROJECT_ID: newProjectID
            }));
    
            await trx("project_collaborator").insert(collaborators);
        }

        await trx.commit();

        return responseBuilder.CreateSuccessful(res, null, "A PROJECT POST");
    } catch (error) {
        /** If failed to posted a project, roll back transaction, return server error and logs */
        console.log("ERROR WHILE POSTING A PROJECT: ", error);
        await trx.rollback();
        return responseBuilder.ServerError(res, "Error occurred while uploading your project.");
    }
}

async function ValidatePostProjectBody(res, req) {
    /** Destructure variables from request body */
    const {projectTitle, projectPhoto, projectOwnerId, projectCollaborators} = req;

    /** Ensure all required fields is filled */
    if(!projectTitle || !projectPhoto || !projectCollaborators || !projectOwnerId) {
        return responseBuilder.MissingContent(res);
    }

    if(projectTitle.length > 47) {
        return responseBuilder.BuildResponse(res, 400, {
            message: "Your project title is too long. Max length should be 47 characters.",
        })
    }

    /** ENsure that the project owner is exists */
    if(!(await dataRepos.IsUserExistsById(db, projectOwnerId))) {
        return responseBuilder.NotFound(res, "PROJECT OWNER");
    }

    /** Ensure projectCollaborators must be sent as an array */
    if(!Array.isArray(projectCollaborators)) {
        return responseBuilder.BuildResponse(res, 400, {
            message: "Collaborators should be an array.",
        });
    }

    const uniqueUserIds = new Set();

    for (const userId of projectCollaborators) {
        /** Ensure all project collaborators exists */
        if (!(await dataRepos.IsUserExistsById(db, userId))) {
            return responseBuilder.BuildResponse(res, 404, {
                message:  "One of the collaborators is not exists.",
            });
        }
        
        /** Ensure that project owner is not include themself in project collaborator section */
        if(userId == projectOwnerId) { 
            return responseBuilder.BuildResponse(res, 400, {
                message: "You don't need to specify in collaborator section since you are the project owner.",
            })
        }

        /** Ensure that there will be no duplicate collaborators */
        if (uniqueUserIds.has(userId)) {
            return responseBuilder.BuildResponse(res, 400, {
                message: "One of the collaborators is already added, please remove one of them.",
            });
        }

        /** Add the user ID to the Set to check for duplicates */
        uniqueUserIds.add(userId);
    }

    /** Return null to indicate validate passed */
    return null;
}

/** Handle get project information */
async function GetProjectInformation(res, projectId) {
    try {
        const responseObject = await dataRepos.GetProjectInformation(db, projectId); 
        if (!responseObject) {
            return responseBuilder.BuildResponse(res, 404, {
                message:"The project does not exist."
            })
        }
        return responseBuilder.GetSuccessful(res, responseObject, "PROJECT'S INFORMATION")
    } catch (error) {
        /** If failed to retrieve task information, return server error and logs */
        console.log("ERROR WHILE RETRIEVING TASK INFORMATION: ", error);
        return responseBuilder.ServerError(
        res,
        "Error occurred while retrieving project information"
        );
    }
}

/** Handle edit project information */
async function EditProject(res, req) {
    
}

/** Handle validating edit project information */
async function ValidateEditProjectBody(res, req) {

}

/** Handle delete project */
async function DeleteProject(res, req) {

}

/** Handle validating delete project */
async function ValidateDeleteProject(res, req) {

}

module.exports = {
    PostProject,
    GetProjectInformation,
    EditProject,
}