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
        const {projectTitle, projectOwnerId, encodePhoto, photoOGWidth, photoOGHeight, projectCollaborators, projectDescription} = req;
        
        const newProjectPhotoData = {
            TXT_PHOTO_BASE64: encodePhoto,
            PHOTO_OG_WIDTH: photoOGWidth,
            PHOTO_OG_HEIGHT: photoOGHeight,
        }

        // Insert the project data into the database using Knex
        const newImage = await trx("photo").insert({...newProjectPhotoData});
        const newImageId = newImage[0];

        const projectType = projectCollaborators.length > 0 ? "GP" : "SL";

        const projectData = {
            FK_KEY_USR_ID: projectOwnerId,
            TXT_PROJECT_TITLE: helpers.CapitalizeFirstLetter(projectTitle.trim().toLowerCase()),
            TXT_PROJECT_DESCRIPTION: projectDescription,
            PROJECT_TYPE: projectType,
            FK_KEY_PHOTO_ID: newImageId,
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
    const {projectTitle, encodePhoto, photoOGWidth, photoOGHeight, projectOwnerId, projectCollaborators} = req;

    /** Ensure all required fields is filled */
    if(!projectTitle || !encodePhoto || !photoOGWidth || !photoOGHeight || !projectCollaborators || !projectOwnerId) {
        return responseBuilder.MissingContent(res);
    }

    if(projectTitle.length > 40) {
        return responseBuilder.BuildResponse(res, 400, {
            message: "Your project title is too long. Max length should be 40 characters.",
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
        /** If failed to retrieve project information, return server error and logs */
        console.log("ERROR WHILE RETRIEVING PROJECT INFORMATION: ", error);
        return responseBuilder.ServerError(
            res,
            "Error occurred while retrieving project information"
        );
    }
}

/** Handle edit project information */
async function EditProject(res, req, projectId) {
    /** Begin the transaction */
    const trx = await db.transaction();
    try {
        const errors = await ValidateEditProjectBody(res, req, projectId);
        if(errors) {
            await trx.rollback();
            return errors;
        }

        const {projectTitle, encodePhoto, photoOGHeight, photoOGWidth, projectCollaborators, projectDescription} = req;
        const projectType = projectCollaborators.length > 0 ? "GP" : "SL";

        const updatedImageProjectData = { 
            TXT_PHOTO_BASE64: encodePhoto,
            PHOTO_OG_WIDTH: photoOGWidth,
            PHOTO_OG_HEIGHT: photoOGHeight,
        }

        const projectInformation = await dataRepos.GetProjectInformation(db, projectId);
        const currentImageInformation = projectInformation.projectPhoto;
        const isUpdateImage = currentImageInformation.photoEncode64 === encodePhoto ? false : true;
        let photoId = isUpdateImage === true ? (await trx("photo").insert({...updatedImageProjectData}))[0] : currentImageInformation.photoId;
        
        const updatedProjectData = {
            TXT_PROJECT_TITLE: projectTitle,
            TXT_PROJECT_DESCRIPTION: projectDescription,
            PROJECT_TYPE: projectType,
            FK_KEY_PHOTO_ID: photoId,
        }

        const promises = [];
        promises.push(
            trx("project")
                .where("PK_KEY_PROJECT_ID", projectId)
                .update(updatedProjectData)
          );
        
        if (isUpdateImage) {
            promises.push(
                trx("photo")
                .where("PK_KEY_PHOTO_ID", currentImageInformation.photoId)
                .del()
            );
        }
        await Promise.all(promises);

        /* The next process is getting all currentCollaborators of the project before updated, compare with
        * projectCollaborators from the request, if there is a removal, or addition, then we should remove/add
        * that collaborator.
        */

        /** Get current collaborators before updated */
        const currentCollaborators = await dataRepos.GetProjectCollaborators(db, projectId);
        const currentCollaboratorsId = currentCollaborators.map(collaborator => collaborator.userId);

        collaboratorsToAdd = GetAddCollaborator(currentCollaboratorsId, projectCollaborators);
        collaboratorsToRemove = GetRemoveCollaborator(currentCollaboratorsId, projectCollaborators);

        // Insert new collaborators
        for (const collaboratorToAdd of collaboratorsToAdd) {
            await trx("project_collaborator").insert({
                FK_KEY_PROJECT_ID: projectId,
                FK_KEY_USR_ID: collaboratorToAdd,
            });
        }

        // Remove collaborators
        for (const collaboratorToRemove of collaboratorsToRemove) {
            await trx("project_collaborator")
                .where({
                    FK_KEY_PROJECT_ID: projectId,
                    FK_KEY_USR_ID: collaboratorToRemove,
                })
                .del();
        }

        await trx.commit();
        const responseObject = await dataRepos.GetProjectInformation(db, projectId);
        return responseBuilder.UpdateSuccessful(res, responseObject, "YOUR PROJECT");
    } catch (error) {
        /** If failed to update a project, roll back transaction, return server error and logs */
        console.log("ERROR WHILE UPDATING A PROJECT: ", error);
        await trx.rollback();
        return responseBuilder.ServerError(res, "Error occurred while updating your project.");
    }
}

/** Handle validating edit project information */
async function ValidateEditProjectBody(res, req, projectId) {
    try {
        if (!(await dataRepos.IsProjectExists(db, projectId))) {
            return responseBuilder.BuildResponse(res, 404, {
                message:"The project does not exist."
            })
        }

        const {projectTitle, encodePhoto, photoOGHeight, photoOGWidth, idUserEdit, projectCollaborators} = req;
        
        /** Ensure all required fields is filled */
        if(!projectTitle || !encodePhoto || !photoOGHeight || !photoOGWidth || !projectCollaborators || !idUserEdit) {
            return responseBuilder.MissingContent(res);
        }
        
        if(projectTitle.length > 40) {
            return responseBuilder.BuildResponse(res, 400, {
                message: "Your project title is too long. Max length should be 40 characters.",
            })
        }
    
        /** ENsure that the project owner is exists */
        if(!(await dataRepos.IsUserExistsById(db, idUserEdit))) {
            return responseBuilder.NotFound(res, "PROJECT OWNER");
        }

        /** Ensure that only project collaborators and project owner can edit */
        const currentCollaborators = await dataRepos.GetProjectCollaborators(db, projectId);
        const currentCollaboratorsId = currentCollaborators.map(collaborator => collaborator.userId);
        const projectOwnerId = await db.select("FK_KEY_USR_ID").from("project").where("PK_KEY_PROJECT_ID", "=", projectId).first();

        if(!(currentCollaboratorsId.includes(idUserEdit)) && projectOwnerId.FK_KEY_USR_ID !== idUserEdit) {
            return responseBuilder.BuildResponse(res, 400, {
                message:"Only collaborators or project owner can edit the post.",
            })
        }

        /** Ensure projectCollaborators must be sent as an array */
        if(!Array.isArray(projectCollaborators)) {
            return responseBuilder.BuildResponse(res, 400, {
                message: "Collaborators should be an array.",
            });
        }
        
        /** Ensure that collaborator can only remove themselves from collaborator section of the project */
        if(idUserEdit !== projectOwnerId.FK_KEY_USR_ID){
            collaboratorsToAdd = GetAddCollaborator(currentCollaboratorsId, projectCollaborators);
            collaboratorsToRemove = GetRemoveCollaborator(currentCollaboratorsId, projectCollaborators);
            if(collaboratorsToRemove.length > 1 || collaboratorsToRemove.length === 1 && collaboratorsToRemove[0].FK_KEY_USR_ID !== idUserEdit) {
                collaboratorsToRemove[0].FK_KEY_USR_ID
                return responseBuilder.BuildResponse(res, 400, {
                    message:"You can only remove yourself as a collaborator."
                })
            } else if (collaboratorsToAdd.length > 0) {
                return responseBuilder.BuildResponse(res, 400, {
                    message:"Only project owner can add more collaborators."
                })
            }
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
            if(userId === projectOwnerId.FK_KEY_USR_ID) { 
                return responseBuilder.BuildResponse(res, 400, {
                    message: "You don't need to specify project owner in collaborator section.",
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
        return null;
    } catch (error) { 
        /** If failed to retrieve project information, return server error and logs */
        console.log("ERROR WHILE VALIDATING EDIT PROJECT INFORMATION: ", error);
        return responseBuilder.ServerError(
            res,
            "Error occurred while validating edit project information"
        );
    }
}

/** Handle delete project */
async function DeleteProject(res, projectId, projectOwnerId) {
    /** Begin the transaction */
    const trx = await db.transaction();
    try {
        const errors = await ValidateDeleteProject(res, projectId, projectOwnerId);
        if(errors) {
            return errors;
        }

        const projectInformation = await dataRepos.GetProjectInformation(db, projectId);
        const projectPhotoID = projectInformation.projectPhoto.photoId;
        /** Delete associate collaborator in table project_collaborator */
        await trx("project_collaborator")
                .where("FK_KEY_PROJECT_ID", projectId)
                .del();
        await Promise.all([
            /** Delete row in table project */
            trx("project")
              .where("PK_KEY_PROJECT_ID", projectId)
              .del(),
          
            /** Delete associate photo id in table photo */
            trx("photo")
              .where("PK_KEY_PHOTO_ID", projectPhotoID)
              .del(),
          ]);

          await trx.commit();
        return responseBuilder.DeleteSuccessful(res, "A PROJECT");
    } catch (error) {
        console.log("ERROR WHILE DELETING PROJECT: ", error);
        await trx.rollback();
        return responseBuilder.ServerError(
            res,
            "Error occurred while deleting project."
        );
    }
}

/** Handle validating delete project */
async function ValidateDeleteProject(res, projectId, projectOwnerId) {
    try {
        if(!(await dataRepos.IsProjectExists(db, projectId))) {
            return responseBuilder.NotFound(res, "PROJECT");
        } 
        if(!(await dataRepos.IsUserExistsById(db, projectOwnerId))) {
            return responseBuilder.NotFound(res, "PROJECT OWNER");
        }
        const projectInformation = await dataRepos.GetProjectInformation(db, projectId);
        if(parseInt(projectOwnerId,10) !== projectInformation.projectOwner.userId) {
            return responseBuilder.BuildResponse(res, 400, {
                message: "Only project owner can delete this project.",
            });
        }
        return null;
    } catch (error) {
        console.log("ERROR WHILE VALIDATING DELETE PROJECT: ", error);
        return responseBuilder.ServerError(
            res,
            "Error occurred while validating delete project."
        );
    }
}

 function GetAddCollaborator(array1, array2) {
    const result = [];

    for (const item of array2) {
        if (!array1.includes(item)) {
            result.push(item);
        }
    }

    return result;
}

 function GetRemoveCollaborator(array1, array2) {
    const result = [];

    for (const item of array1) {
        if (!array2.includes(item)) {
            result.push(item);
        }
    }

    return result;
}
module.exports = {
    PostProject,
    GetProjectInformation,
    EditProject,
    DeleteProject
}