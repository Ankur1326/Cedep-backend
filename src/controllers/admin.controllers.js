import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Admin } from "../models/admin.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import nodemailer from 'nodemailer';

const generateRefreshAndAccessToken = async (admin_id) => {
    try {
        const admin = await Admin.findById(admin_id)

        const accessToken = admin.generateAccessToken();
        const refreshToken = admin.generateRefreshToken();

        admin.refreshToken = refreshToken;

        await admin.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Error while generate refresh and access token");
    }

}

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

let memoryStore = [];
const sendOtp = asyncHandler(async (req, res) => {
    const { email } = req.body;
    // console.log("from email : ", email);

    if (!email) {
        throw new ApiError(400, "email is required");
    }

    const otp = generateOTP();
    const expiry = Date.now() + parseInt(process.env.OTP_EXPIRY, 10);

    // Store email, OTP, and expiry in the array
    memoryStore.push({ email, otp, expiry });
    // console.log(memoryStore);

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
        to: email,
        subject: 'OTP for Admin Registration',
        text: `Dear Admin,

        Your OTP for registering a new admin is: ${otp}

        CEDEP Institute`
    };

    await transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log("Error sending email:", error);
            throw new ApiError(500, "Failed to send email");
        } else {
            console.log("Email sent successfully:", info.response);
            res.status(200).json(new ApiResponse(200, null, 'OTP sent successfully'));
        }
    });
})

const verifyOtp = asyncHandler(async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Find the matching entry in the otpStore
        const storedData = memoryStore.find(entry => entry.email === email);

        // console.log("storedData : ", storedData);

        if (!storedData) {
            // throw new ApiError(400, "No admin data found");
            return res.status(400).json({ message: 'No admin data found' })
        }

        if (storedData.otp !== otp) {
            // throw new ApiError(400, "Invalid OTP");
            return res.status(400).json({ message: 'Invalid OTP' })
        }

        if (Date.now() > storedData.expiry) {
            // throw new ApiError(400, "OTP has expired");
            return res.status(400).json({ message: 'OTP has expired' })
        }

        // Mark OTP as verified by adding a verified flag to the entry
        storedData.isOtpVerified = true;

        return res.status(200).json(new ApiResponse(200, null, 'OTP verified successfully'));

    } catch (error) {
        console.log("Internal server error while verifying otp : ", error);
    }

})

const submitAdminDetails = asyncHandler(async (req, res) => {
    try {
        const { fullName, username, email, password, confirmPassword, isSuperAdmin = false } = req.body;

        const storedData = memoryStore.find(entry => entry.email === email);

        // console.log(fullName, username, email, password, confirmPassword);

        if (!storedData || !storedData.isOtpVerified) {
            // throw new ApiError(400, "OTP not verified");
            return res.status(400).json({ message: 'OTP not verified' })
        }

        if (!fullName || !username || !email || !password || !confirmPassword) {
            // throw new ApiError(400, "All fields are required");
            return res.status(400).json({ message: 'All fields are required' })
        }

        if (password !== confirmPassword) {
            // throw new ApiError(400, "Passwords do not match");
            return res.status(400).json({ message: 'Passwords do not match' })
        }

        const existedAdmin = await Admin.findOne({
            $or: [{ username }, { email }],
        });

        if (existedAdmin) {
            // throw new ApiError(409, "Admin with email or username already submitted");
            return res.status(409).json({ message: 'Admin with email or username already submitted' })
        }

        await Admin.create({
            fullName,
            username,
            email,
            password,
            isSuperAdmin,
            verifiedAdmin: isSuperAdmin ? true : false
        })

        // Clean up the otpStore after successful registration
        memoryStore = memoryStore.filter(entry => entry.email !== email);

        return res.status(200).json(new ApiResponse(200, null, 'Admin registered successfully!'));

    } catch (error) {
        console.log("Internal server error while submiting new admin : ", error);
        return res.status(500).json({ message: "Internal server error while submiting new admin" })
    }
})

const loginAdmin = asyncHandler(async (req, res) => {
    const { identifier, password } = req.body

    // Check if identifier is an email or phone number
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    // const isPhoneNumber = /^[0-9]{10,15}$/.test(identifier);

    if (!isEmail) {
        // throw new ApiError(400, "Invalid email format");
        return res.status(400).json({ message: 'Invalid email format' })
    }
    
    const admin = await Admin.findOne({ email: identifier })
    
    if (!admin) {
        return res.status(401).json({ message: 'This Admin is not registered' })
    }
    // console.log('admin : ', admin);
    
    const isPasswordValid = await admin.isPasswordCorrect(password.trim())
    
    if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid user credentials (Incorrect password)' })
        // throw new ApiError(401, "Invalid user credentials (Incorrect password)");
    }

    const { accessToken, refreshToken } = await generateRefreshAndAccessToken(admin._id);

    // for send cookie
    const loggedInAdmin = await Admin.findById(admin._id).select(
        "-password -refreshToken"
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    admin: loggedInAdmin,
                    accessToken,
                    refreshToken,
                },
                "Admin logged In Successfully"
            )
        );

})


export { sendOtp, verifyOtp, submitAdminDetails, loginAdmin }