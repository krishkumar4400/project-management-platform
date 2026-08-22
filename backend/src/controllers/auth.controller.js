import userModel from "../models/user.model.js";
import asyncHandler from "../utils/async-handler.js";
import ApiError from "../utils/api-error.js";
import ApiResponse from "../utils/api-response.js";
import sendMail from "../services/mail.service.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await userModel.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return {
      accessToken,
      refreshToken,
    };
  } catch (error) {
    console.log(error);
    throw new ApiError(
      500,
      "Failed to generate access and refresh tokens",
      error,
    );
  }
};

const registerUser = asyncHandler(async (req, res, next) => {
  const { username, email, password, role } = req.body;

  const existingUser = await userModel.findOne({
    $or: [{ username }, { email }],
  });

  if (existingUser) {
    throw new ApiError(
      409,
      "User with this username or email already exists",
      [],
    );
  }

  const user = await userModel.create({
    username,
    email,
    password,
    role,
  });

  const { unHashedToken, hashedToken, tokenExpiry } =
    await user.generateTemporaryToken();

  user.emailVerificationToken = hashedToken;
  user.emailVerificationTokenExpiry = tokenExpiry;
  await user.save({ validateBeforeSave: false });

  const html = `
    <p>
    Verify you email by clicking the following link
    <div>
    <a href=${req.protocol}://${req.get("host")}/api/v1/auth/verify-email/${unHashedToken}>click here</a>
    </div>
    </p>
    `;

  await sendMail({ email, subject: "Account verification", html });

  const { accessToken, refreshToken } = generateAccessAndRefreshTokens(
    user._id,
  );
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "development" ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  const data = {
    _id: user._id,
    email: user.email,
    username: user.username,
    fullName: user.fullName,
    isVerified: user.isEmailVerified,
  };

  return res
    .status(201)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(new ApiResponse(201, data, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await userModel.findOne({ email }).select("+password");

  if (!user) {
    throw new ApiError(401, "incorrect email or password", []);
  }

  const isPasswordMatch = await user.comparePassword(password);

  if (!isPasswordMatch) {
    throw new ApiError(401, "incorrect email or password", []);
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id,
  );

  const data = {
    _id: user._id,
    email: user.email,
    username: user.username,
    fullName: user.fullName,
    isVerified: user.isEmailVerified,
  };

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "development" ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(new ApiResponse(200, data, "User logged in successfully"));
});

const logoutUser = asyncHandler(async (req, res, next) => {
  await userModel.findByIdAndUpdate(
    req.userId,
    {
      $set: {
        refreshToken: "",
      },
    },
    {
      returnDocument: "after",
    },
  );
  return res
    .status(200)
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json(new ApiResponse(200, {}, "user logged out successfully"));
});

const verifyEmail = asyncHandler(async (req, res, next) => {
  const { verificationToken } = req.params;

  if (!verificationToken) {
    throw new ApiError(400, "Email verification token is missing");
  }

  const hashedToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  const user = await userModel.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationTokenExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, "Email verification is invalid or expired");
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationTokenExpiry = undefined;

  await user.save({ validateBeforeSave: false });

  const data = {
    isEmailverified: user.isEmailVerified,
    username: user.username,
    email: user.email,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Email verified successfully"));
});

const resendVerificationMail = asyncHandler(async (req, res, next) => {
  const user = await userModel.findById(req?.userId);

  if (user.isEmailVerified) {
    throw new ApiError(409, "Email is already verified");
  }

  const { unHashedToken, hashedToken, tokenExpiry } =
    user.generateTemporaryToken;

  user.emailVerificationToken = hashedToken;
  user.emailVerificationTokenExpiry = tokenExpiry;
  await user.save({ validateBeforeSave: false });

  const html = `
    <p>
    Verify you email by clicking the following link
    <div>
    <a href=${req.protocol}://${req.get("host")}/api/v1/auth/verify-email/${unHashedToken}>click here</a>
    </div>
    </p>
    `;
  await sendMail({ to: user.email, subject: "Account verification", html });

  const data = {
    message: "Account verification email sent successfully ",
    success: true,
    email: user.email,
    username: user.username,
  };
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        data,
        "Account verification email sent successfully",
      ),
    );
});

const changeCurrentPassword = asyncHandler(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  const user = await userModel.findById(req?.userId);

  const isPasswordMatch = await user.comparePassword(oldPassword);

  if (!isPasswordMatch) {
    throw new ApiError(401, "Old password doesn't match");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  const data = {
    message: "Password has be changed successfully ",
    success: true,
    email: user.email,
    username: user.username,
  };
  return res
    .status(200)
    .json(new ApiResponse(200, data, "Password has been changed successfully"));
});

const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const user = await userModel.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User doesn't exist with this email address");
  }

  const { unHashedToken, hashedToken, tokenExpiry } =
    user.generateTemporaryToken();

  user.resetPasswordToken = hashedToken;
  user.resetPasswordTokenExpiry = tokenExpiry;
  await user.save({ validateBeforeSave: false });

  const html = `
    <p>
    Verify you email by clicking the following link
    <div>
    <a href=${req.protocol}://${req.get("host")}/api/v1/auth/verify-email/${unHashedToken}>click here</a>
    </div>
    </p>
    `;

  await sendMail({ to: email, subject: "Reset password mail", html });

  const data = {
    message: "reset password email sent successfully",
    success: true,
    email,
  };
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        data,
        "Email for reseting the password has been sent to your email",
      ),
    );
});

const resetForgotPassword = asyncHandler(async (req, res, next) => {
  const { forgotPasswordToken } = req.params;
  const { newPassword } = req.body;

  const hashedToken = crypto
    .createHash("sha256")
    .update(forgotPasswordToken)
    .digest("hex");

  const user = await userModel.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordTokenExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(489, "Forgot password token is invalid or expired");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  const data = {
    message: "Password changed succesfully",
    success: true,
    email: user.email,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Password has be changed successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res, next) => {
  const incommingRefreshToken = req.cookies.refreshToken;

  if (!incommingRefreshToken) {
    throw new ApiError(401, "Unauthorized access");
  }

  try {
    const decodedRefreshToken = jwt.verify(
      incommingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    const user = await userModel.findById(decodedRefreshToken?.userId);

    if (user?.refreshAccessToken !== incommingRefreshToken) {
      throw new ApiError(401, "Refresh token is expired");
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: true });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "development" ? "strict" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    const data = {
      _id: user._id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      isVerified: user.isEmailVerified,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", newRefreshToken, cookieOptions)
      .json(new ApiResponse(200, data, "Access token refreshed"));
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Refresh token is not valid", error);
  }
});

export {
  registerUser,
  loginUser,
  logoutUser,
  verifyEmail,
  resendVerificationMail,
  changeCurrentPassword,
  forgotPassword,
  resetForgotPassword,
  refreshAccessToken,
};
