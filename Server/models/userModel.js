import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { config } from "dotenv";
config({ path: "./config.env" }); 

// const userSchema = new mongoose.Schema({
//     name: String,
//     email: String,
//     password:{
//         type:String,
//         minLength: [0, "Password mudt have at least 8 characters."],
//         maxLength: [12, "Password must have at most 12 characters."],
//         select: false,
//     },
//     phone: String,
//     accountVerified: {
//         type: Boolean,
//         default: false
//     },

//     verificationCode : Number,
//     verificationCodeExpire: Date,
//     resetPasswordToken: String,
//     resetPasswordExpire: Date,
//     createAt:{
//         type: Date,
//         default: Date.now,
//     },
// });


// userSchema.pre("save", async function(next) {
//     if(!this.isModified("password")){
//         next();
//     }
//     this.password = await bcrypt.hash(this.password, 10);
// });

// userSchema.methods.comparePassword = async function(EnterPassword){
//     return await bcrypt.compare(EnterPassword, this.password);
// };
// userSchema.methods.generateVerificationCode = function () {
//     function generateRandomFiveDigitNumber(){
//         const firstDigit = Math.floor(Math.random() * 9) + 1 ;
//         const remainingDigits = Math.floor(Math.random() * 10000).toString().padStart(4,0);


//         return parseInt(firstDigit + remainingDigits);

//     }
//     const verificationCode = generateRandomFiveDigitNumber();
//     this.verificationCode = verificationCode;
//     this.verificationCodeExpire = Date.now() + 5 * 60 * 1000;

//     return verificationCode;
// };


// // userSchema.methods.generateToken = function () {
// //     return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
// //         expiresIn: process.env.JWT_EXPIRE,
// //     });
// // };


// userSchema.methods.generateToken = function () {
//     console.log("User ID in generateToken:", this._id); // Debugging log
//     return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
//         expiresIn: process.env.JWT_EXPIRE,
//     });
// };


// // userSchema.methods.generateToken =  function () {
// //     console.log("JWT_SECRET:", process.env.JWT_SECRET);
// //     return jwt.sign(
// //         { _id: this._id },
// //         process.env.JWT_SECRET || 'bipla09',
// //         {
// //             expiresIn: process.env.JWT_EXPIRE
// //         }
// //     );
// // };


// export const User = mongoose.model("User", userSchema);



const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: {
        type: String,
        required: [true, "Password is required."],
        select: false, 
    },
    phone: String,
    accountVerified: {
        type: Boolean,
        default: false,
    },
    verificationCode: Number,
    verificationCodeExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Hash password before saving
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Compare hashed password
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate OTP
userSchema.methods.generateVerificationCode = function () {
    function generateRandomFiveDigitNumber() {
        return Math.floor(10000 + Math.random() * 90000);
    }
    const verificationCode = generateRandomFiveDigitNumber();
    this.verificationCode = verificationCode;
    this.verificationCodeExpire = Date.now() + 5 * 60 * 1000; 

    return verificationCode;
};

// Generate JWT Token
userSchema.methods.generateToken = function () {
    console.log("User ID in generateToken:", this._id); // Debug log
    console.log("JWT_SECRET:", process.env.JWT_SECRET);  // Debug log
    return jwt.sign({ id: this._id.toString() }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE ,
    });
};


userSchema.methods.generateResetPasswordToken = function () {
    const resetToken = crypto.randomBytes(20).toString("hex");

    this.resetPasswordToken = crypto.createHash("sha256")
        .update(resetToken)
        .digest("hex");


    this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    return resetToken;
};


export const User = mongoose.model("User", userSchema);
