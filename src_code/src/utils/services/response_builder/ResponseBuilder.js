function BuildResponse(res, statusCode, body) {
    return res.status(statusCode).json(body);
  }
  
  function NotFound(res, entityName = "") {
    /** Construct a customized message for entity not found. */
    var responseMessage = "";
    if (entityName.length !== 0) {
      responseMessage = entityName.trim().toUpperCase() + " ";
    }
  
    /** Create and return the response object */
    return BuildResponse(res, 404, {
      message: `${responseMessage}NOT FOUND.`,
    });
  }
  
  function CreateSuccessful(res, responseObject = null, entityName = "") {
    /** Construct a customized message for created entity */
    var responseMessage = "";
    if (entityName.length !== 0) {
      responseMessage = entityName.trim().toUpperCase() + " ";
    }
  
    /** Create and return response */
    if (!responseObject) {
      return BuildResponse(res, 201, {
        message: `${responseMessage}SUCCESSFULLY CREATED.`,
      });
    }
  
    return BuildResponse(res, 201, {
      message: `${responseMessage}SUCCESSFULLY CREATED.`,
      responseObject,
    });
  }
  
  function GetSuccessful(res, responseObject = null, entityName = "") {
    // Construct a customized message for the retrieved entity
    var responseMessage = "";
    if (entityName.length != 0) {
      responseMessage = entityName.trim().toUpperCase() + " ";
    }
  
    /** Create and return response */
    if (!responseObject) {
      return BuildResponse(res, 200, {
        message: `${responseMessage}SUCCESSFULLY RETRIEVED.`,
      });
    }
  
    return BuildResponse(res, 200, {
      message: `${responseMessage}SUCCESSFULLY RETRIEVED.`,
      responseObject,
    });
  }
  
  function UpdateSuccessful(res, responseObject = null, entityName = "") {
    /** Construct a customized message for updated entity */
    var responseMessage = "";
    if (entityName.length != 0) {
      responseMessage = entityName.trim().toUpperCase() + " ";
    }
  
    /** Create and return response */
    if (!responseObject) {
      return BuildResponse(res, 200, {
        message: `${responseMessage}SUCCESSFULLY UPDATED.`,
      });
    }
  
    return BuildResponse(res, 200, {
      message: `${responseMessage}SUCCESSFULLY UPDATED.`,
      responseObject,
    });
  }
  
  function DeleteSuccessful(res, responseObject = null, entityName = "") {
    /** Construct a customized message for deleted entity */
    var responseMessage = "";
    if (entityName.length != 0) {
      responseMessage = entityName.trim().toUpperCase() + " ";
    }
  
    return BuildResponse(res, 204, {
      message: `${responseMessage}SUCCESSFULLY DELETED.`,
    });
  }
  
  function MissingContent(res, type) {
    /** Create and return the response object for type "RB" (Request Body) */
    if (type === "RB") {
      return BuildResponse(res, 400, {
        message: "REQUEST BODY IS EMPTY",
      });
    }
  
    /** Create and return the response object for missing required fields */
    return BuildResponse(res, 400, {
      message: "MISSING REQUIRED FIELDS!",
    });
  }
  
  function ServerError(res, message = "") {
    /** Construct a customized error message for server error. */
    var responseMessage = "";
    if (message.length != 0) {
      responseMessage = message.trim().toUpperCase() + " ";
    }
  
    /** Return the response */
    return BuildResponse(res, 503, {
      message: "SERVER ERROR.",
      errorOccurTime: responseMessage,
    });
  }
  
  /** Exports the functions */
  module.exports = {
    BuildResponse,
    CreateSuccessful,
    GetSuccessful,
    NotFound,
    UpdateSuccessful,
    DeleteSuccessful,
    MissingContent,
    ServerError,
  };