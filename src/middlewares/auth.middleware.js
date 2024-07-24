import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { Admin } from "../models/admin.model.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    // using for web browser 
    let token = req.cookies?.accessToken || req.header("Authorization");
    // console.log("token : ", token);
    // console.log("accessToken :", req.header(("Authorization"))); 

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    // Remove 'Bearer ' prefix if present
    if (token.startsWith("Bearer ")) {
      token = token.slice(7, token.length).trim();
    }
    // console.log("without Bearer token : ", token);

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // console.log("decodedToken : ", decodedToken);

    const user = await Admin.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    // console.log("user : ", user);
    
    if (!user) {
      throw new ApiError(404, "Invalid Access Token");
    }

    req.user = user;
    next();
  } catch (error) {
    console.log("error : ", error);
    throw new ApiError(401, error?.message || "Invalid access token")
  }
});
