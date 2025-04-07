import ErrorHandler from "../middlewares/error.js";
import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import { User } from "../models/userModel.js";
import twilio from "twilio";
import { sendEmail } from "../utils/sendEmail.js";
import { config } from 'dotenv';
import { sendToken } from "../utils/sendToken.js";
import crypto from "crypto";
config({ path: "./config.env" });

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

export const register = catchAsyncError(async (req, res, next) => {
    try {
        const { name, email, phone, password, verificationMethod } = req.body;
        if (!name || !email || !phone || !password || !verificationMethod) {
            return next(new ErrorHandler("All fields are required", 400));
        }
        function validatePhoneNumber(phone) {
            const phoneregex = /^\+91\d{10}$/;
            return phoneregex.test(phone);
        }
        if (!validatePhoneNumber(phone)) {

            return next(new ErrorHandler("Invalid Phone Number", 400));
        }
        const existingUser = await User.findOne({
            $or: [
                {
                    email,
                    accountVerified: true,
                },
                {
                    phone,
                    accountVerified: true,
                },
            ],
        });
        if (existingUser) {
            return next(new ErrorHandler("Phone or Email is already used", 400));
        }
        const registrationAttemptsByUser  = await User.find({
            $or: [
                { phone, accountVerified: true },
                { email, accountVerified: true },
            ]
        });
        if (registrationAttemptsByUser.length > 3) {
            return next(new ErrorHandler(
                "You have exceeded the maximum number of attempts (3). Please try again after an hours.", 400
            )
            );
        }
        const userData = {
            name,
            email,
            phone,
            password,
        }
        const user = await User.create(userData);
        const verificationCode = await user.generateVerificationCode();
        await user.save();
        await sendVerificationCode(verificationMethod, verificationCode, name, email, phone, res);


    } catch (error) {
        next(error);

    }
});



async function sendVerificationCode(verificationMethod, verificationCode, name, email, phone, res) {
    try {
        if (verificationMethod === "email") {
            const message = generateEmailTemplate(verificationCode);
            await sendEmail(email, "Your Verification Code", message);
            res.status(200).json({
                success: true,
                message: `Verification email sent successfully to ${name}`,
            });
        } else if (verificationMethod === "phone") {
            const verificationCodeWithSpace = verificationCode.toString().split("").join(" ");
            await client.calls.create({
                body: `Your verification code is ${verificationCodeWithSpace}.`,
                from: process.env.TWILIO_VERIFY_SID,
                to: phone,
            });
            
            res.status(200).json({
                success: true,
                message: `OTP sent to ${phone}.`,
            });
        } else {
            res.status(400).json({
                success: false,
                message: "Invalid verification method.",
            });
        }
    } catch (error) {
        console.error("Error sending verification code:", error);
        return res.status(500).json({
            success: false,
            message: "Verification code failed to send.",
        });
    }
}

function generateEmailTemplate(verificationCode) {
    return ` 
     <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
      <h2 style="color: #4CAF50; text-align: center;">Verification Code</h2>
      <p style="font-size: 16px; color: #333;">Dear User,</p>
      <p style="font-size: 16px; color: #333;">Your verification code is:</p>
      <div style="text-align: center; margin: 20px 0;">
        <span style="display: inline-block; font-size: 24px; font-weight: bold; color: #4CAF50; padding: 10px 20px; border: 1px solid #4CAF50; border-radius: 5px; background-color: #e8f5e9;">
          ${verificationCode}
        </span>
      </div>
      <p style="font-size: 16px; color: #333;">Please use this code to verify your email address. The code will expire in 10 minutes.</p>
      <p style="font-size: 16px; color: #333;">If you did not request this, please ignore this email.</p>
      <footer style="margin-top: 20px; text-align: center; font-size: 14px; color: #999;">
        <p>Thank you,<br>Your Company Team</p>
        <p style="font-size: 12px; color: #aaa;">This is an automated message. Please do not reply to this email.</p>
      </footer>
    </div>
    `
}

export const verifyOTP = catchAsyncError(async (req, res, next) => {
    const { email, otp, phone } = req.body;
    function validatePhoneNumber(phone) {
        const phoneregex = /^\+91\d{10}$/;
        return phoneregex.test(phone);
    }
    if (!validatePhoneNumber(phone)) {

        return next(new ErrorHandler("Invalid Phone Number", 400));
    }
    try {
        const userAllEntries = await User.find({
            $or: [

                {
                    email,
                    accountVerified: false,
                },
                {
                    phone,
                    accountVerified: false,
                },
            ],
        }).sort({ createdAt: -1 });

        if (userAllEntries.length === 0) {
            return next(new ErrorHandler("user not found", 404));
        }
        let user;
        if (userAllEntries.length > 1) {
            user = userAllEntries[0];

            await User.deleteMany({
                _id: { $ne: user._id },
                $or: [
                    { phone, accountVerified: false },
                    { email, accountVerified: false },
                ],
            });
        } else {
            user = userAllEntries[0];
        }

        if (user.verificationCode !== Number(otp)) {
            return next(new ErrorHandler("Invalid otp ", 400));
        }
        const currentTime = Date.now();

        const verificationCodeExpire = new Date(user.verificationCodeExpire).getTime();
        console.log(currentTime);
        console.log(verificationCodeExpire);

        if (currentTime > verificationCodeExpire) {
            return next(new ErrorHandler("OTP expired", 400));
        }
        user.accountVerified = true;
        user.verificationCode = null;
        user.verificationCodeExpire = null;
        await user.save({ validateModifiedOnly: true });
        sendToken(user, 200, "Account Verified", res);

    } catch (error) {
        return next(new ErrorHandler("Internal Server Error", 500));


    }
});



export const login = catchAsyncError(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new ErrorHandler("Please enter email and password", 400));
    }
    const user = await User.findOne({ email, accountVerified: true }).select("+password");
    if (!user) {
        return next(new ErrorHandler("Invalid email or password", 401));
    }
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
        return next(new ErrorHandler("Invalid email or password", 401));
    }

    sendToken(user, 200, "User Logged in successfully", res);
});


export const logout = catchAsyncError(async (req, res, next) => {
    res.status(200).cookie("token", "", {
        expires: new Date(Date.now()),
        httpOnly: true,
    }).json({
        success: true,
        message: "Logged out successfully.",
    });
});

export const getUser = catchAsyncError(async (req, res, next) => {
    const user = req.user;
    res.status(200).json({
        success: true,
        user,
    });
});



export const forgotPassword = catchAsyncError(async (req, res, next) => {
    const user = await User.findOne({
        email: req.body.email,
        accountVerified: true,
    });

    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }

    const resetToken = user.generateResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    const resetPasswordUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;
    const message = `Your Reset Password Token is:\n\n ${resetPasswordUrl} \n\n If you did not request this email, please ignore it.`;

    try {
        await sendEmail(user.email, "MERN AUTHENTICATION APP RESET PASSWORD ", message);

        res.status(200).json({
            success: true,
            message: `Email sent to ${user.email} successfully`,
        });
    } catch (error) {
        console.error("Email sending error:", error);

        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new ErrorHandler("Failed to send email", 500));
    }
});


export const resetPassword = catchAsyncError(async (req, res, next) => {
    const { token } = req.params;
    const resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
    });
    if (!user) {
        return next(
            new ErrorHandler("Reset password token is invalid or has been expired.", 400)
        );
    }

    if (req.body.password !== req.body.confirmPassword) {
        return next(
            new ErrorHandler("Password & Confirm  Password do not match ", 400)
        );
    }


    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    sendToken(user, 200, "Reset Password Successfull", res);
});