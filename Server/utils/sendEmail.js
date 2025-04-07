import nodemailer from "nodemailer";

export const sendEmail = async (email, subject, message) => {
    const transporter = nodemailer.createTransport({
        host: process.env.SHTP_HOST,
        service: process.env.SHIP_SERVICE, 
        port: process.env.SHIP_PORT,
        auth: {
            user: process.env.SHIP_MAIL,
            pass: process.env.SHIP_PASSWORD,
        },
    });

    const options = {
        from: process.env.SHTP_MAIL,
        to: email,
        subject,
        html: message,
    };

    try {
        await transporter.sendMail(options);
        console.log(`Email sent to ${email}`);
    } catch (error) {
        console.error("Error sending email:", error); 
        throw new Error("Failed to send email."); 
    }
};


