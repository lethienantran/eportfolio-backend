/** Initialize neccessary modules */
const express = require("express");
const responseBuilder = require("../utils/interfaces/IResponseBuilder");
const authenticationServices = require("../controllers/interfaces/IAuthentication");

/** Initialize router for use */
const router = express.Router();

/** 
 * POST/SIGN-UP
 * URL => /api/authentication/sign-up
 */
router.post("/sign-up", async(req, res) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return responseBuilder.MissingContent(res, "RB");
        }
        return await authenticationServices.SignUp(res, req.body);
    } catch (error) {
        return responseBuilder.ServerError(res, "ERROR WHILE SIGNING UP.");
    }
});

/**
 * POST/SIGN-IN
 * URL => /api/authentication/sign-in
 */
router.post("/sign-in", async(req, res) => {
    try{
        if (!req.body || Object.keys(req.body).length === 0) {
            return responseBuilder.MissingContent(res, "RB");
        }
        return await authenticationServices.SignIn(res, req.body);
    } catch (error) {
        return responseBuilder.ServerError(res, "ERROR WHILE SIGNING IN.");
    }
})

/** Exports the router */
module.exports = router;