import userModel from '../models/user.model.js';
import ApiResponse from '../utils/api-response.js';
import asyncHandler from '../utils/async-handler.js';

const getCurrentLoggedInUser = asyncHandler(async(req,res) => {
    const userId = req.userId;

    const user = await userModel.findById(userId);

    return res.status(200).json(new ApiResponse(200, user, "user data fetched successfully"));
});

export {
    getCurrentLoggedInUser
};
