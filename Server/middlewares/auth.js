import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import jwt from "jsonwebtoken";
import {User} from "../models/userModel.js";


// export const isAuthenticated = catchAsyncError (async (req,res, next) =>{
//     const { token } = req.cookies;

//     if(!token){
//         return next(new ErrorHandler("You are not logged in",401));
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     req.user = await User.findById(decoded.id);

//     next();
// });


export const isAuthenticated = async (req, res, next) => {
    const { token } = req.cookies;

    console.log("Token in Cookie:", token); 

    if (!token) {
        return next(new ErrorHandler("Not authenticated", 401));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Decoded JWT:", decoded); 

        req.user = await User.findById(decoded.id);
        // console.log("User Found in DB:", req.user); 

        if (!req.user) {
            return next(new ErrorHandler("User not found", 404));
        }
        next();
    } catch (error) {
        return next(new ErrorHandler("Invalid token", 401));
    }
};
