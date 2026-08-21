import jwt from "jsonwebtoken";
import asyncHandler from "../utils/async-handler.js";
import ApiError from "../utils/api-error.js";

const authenticationMiddleware = asyncHandler(async (req, res, next) => {
  const { token } = req.cookies;
  if (!token) {
    throw new ApiError(401, "You are not logged in");
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    throw new ApiError(401, "unauthorized", error);
  }
});

const isAuthenticated = asyncHandler((req, res, next) => {
  if (!req.userId) {
    throw new ApiError(401, "unauthorized login again");
  }
  next();
});


export {
    authenticationMiddleware, isAuthenticated
};
