/** Initialize neccessary modules */
const dataRepos = require("../services/repos/DataRepos");

module.exports = {
    IsUsernameExists: dataRepos.IsUsernameExists,
    IsEmailExists: dataRepos.IsEmailExists,
    GetUserInfoByUsername: dataRepos.GetUserInfoByUsername,
    GetUserInfoByID: dataRepos.GetUserInfoByID,
    IsUserExistsById: dataRepos.IsUserExistsById,
    GetProjectCollaborators: dataRepos.GetProjectCollaborators,
    GetProjectInformation: dataRepos.GetProjectInformation,
    IsProjectExists: dataRepos.IsProjectExists,
    GetPhotoInformation: dataRepos.GetPhotoInformation
}