const responseBuilder = require("../services/response_builder/ResponseBuilder");
/** Exports the function */
module.exports = {
  BuildResponse: responseBuilder.BuildResponse,
  CreateSuccessful: responseBuilder.CreateSuccessful,
  UpdateSuccessful: responseBuilder.UpdateSuccessful,
  DeleteSuccessful: responseBuilder.DeleteSuccessful,
  GetSuccessful: responseBuilder.GetSuccessful,
  MissingContent: responseBuilder.MissingContent,
  NotFound: responseBuilder.NotFound,
  ServerError: responseBuilder.ServerError,
};