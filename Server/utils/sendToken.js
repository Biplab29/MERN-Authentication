// export const sendToken = (user, statusCode, message, res) => {

// const token = user.generateToken();
// res.status(statusCode).cookie("token", token, {
//     expires: new Date(Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
//     httpOnly : true,
// }).json({
//     success : true,
//     user,
//     message,
//     token,
// });
// };

export const sendToken = async (user, statusCode, message, res) => {
    await user.save();  
    const token = user.generateToken();
    console.log("Generated Token:", token); 

    res.status(statusCode)
        .cookie("token", token, { 
            expires: new Date(Date.now()+ process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
            httpOnly: true,
        })
        .json({
            success: true,
            user,
            message,
            token,
        });
};


