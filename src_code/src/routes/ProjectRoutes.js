/** Initialize neccessary modules */
const express = require("express");
const responseBuilder = require("../utils/interfaces/IResponseBuilder");
const projectServices = require("../controllers/interfaces/IProject");

/** Initialize router for use */
const router = express.Router();

/** 
 * POST/SIGN-UP
 * URL => /api/project/upload
 */
router.post("/upload", async(req, res) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return responseBuilder.MissingContent(res, "RB");
        }
        return await projectServices.PostProject(res, req.body);
    } catch (error) {
        console.log("ERROR WHILE UPLOADING THE PROJECT: ", error);
        return responseBuilder.ServerError(res, "Error occurred while uploading your project.");
    }
});

/**
 * GET PROJECT INFORMATION
 * URL => /api/project/{projectId}/information
 */
router.get("/:projectId/information", async(req, res) => {
    try {
        const projectId = req.params.projectId;
        return await projectServices.GetProjectInformation(res, projectId);
    } catch (error) {
        console.log("ERROR WHILE RETRIEVING PROJECT INFORMATION: ", error);
        return responseBuilder.ServerError(res, "Error occurred while retrieving project information.")
    }
})

/** 
 *  PUT/EDIT PROJECT INFORMATION
 *  URL => /api/project/{projectId}/information
 */
router.put("/:projectId/information", async(req, res) => {
    try{
        if (!req.body || Object.keys(req.body).length === 0) {
            return responseBuilder.MissingContent(res, "RB");
        }
        const projectId = req.params.projectId;
        return await projectServices.EditProject(res, req.body, projectId);
    } catch (error) {
        console.log("ERROR WHILE EDITING PROJECT INFORMATION: ", error);
        return responseBuilder.ServerError(res, "Error occurred while editing project information.")
    }
})

/**
 *  DELETE/REMOVE PROJECT 
 *  URL => /api/project/{projectId}/information/{projectOwnerId}
 */
router.delete("/:projectId/information/:projectOwnerId", async(req, res) => {
    try {
        const projectId = req.params.projectId;
        const projectOwnerId = req.params.projectOwnerId;
        return await projectServices.DeleteProject(res, projectId, projectOwnerId);
    } catch (error) {
        console.log("ERROR WHILE DELETING PROJECT: ", error);
        return responseBuilder.ServerError(res, "Error occurred while deleting project.")
    }
})
/** Exports the router */
module.exports = router;