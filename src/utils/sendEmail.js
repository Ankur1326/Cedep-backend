import nodemailer from 'nodemailer';

const generateEmailContent = (type, data) => {
    switch (type) {
        case "OTP for verifing email":
            return {
                subject: 'OTP for Admin Registration',
                text: `Your OTP code is ${data?.otp}. Please use this code to verify your email.
                CEDEP Institute
                `
            };
        case "OTP for forgot password":
            return {
                subject: "OTP for forgot password",
                text: `Your OTP code is ${data?.otp} to change password.
                CEDEP Institute
                `
            };
        case 'admin verification':
            return {
                subject: 'Admin Verification',
                text: `You have been verified by the super admin. You can now access the admin panel.`
            };
        case 'super admin verification':
            return {
                subject: 'Super Admin Verification',
                text: `You have been became super admin by the super admin. You can now access the admin panel and also do all activictys.`
            };
        default:
            break;
    }
}

export const sendEmail = async (to, type, data) => {
    // console.log(to, type, data);

    const { subject, text } = generateEmailContent(type, data);

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false,
        auth: {
            user: process.env.SMTP_MAIL,
            pass: process.env.SMTP_PASSWORD
        },
    });

    const mailOptions = {
        from: `"CEDEP Institute" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text
    };

    try {
        await transporter.sendMail(mailOptions,
            function (error, info) {
                if (error) {
                    console.log("Error sending email:", error);
                    throw new ApiError(500, "Failed to send email");
                } else {
                    console.log("Email sent successfully:", info.response);
                    res.status(200).json(new ApiResponse(200, null, 'OTP sent successfully'));
                }
            })
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
    }
    // return await transporter.sendMail(mailOptions);
}