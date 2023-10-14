/** Initialize neccessary module */
const projectServices = require("../services/ProjectServices");

module.exports = {
    PostProject: projectServices.PostProject,
    GetProjectInformation: projectServices.GetProjectInformation,
}