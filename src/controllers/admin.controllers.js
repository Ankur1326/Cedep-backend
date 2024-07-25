import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Admin } from "../models/admin.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { sendEmail } from "../utils/sendEmail.js";

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
    try {
        const { email, type } = req.body;
        // console.log("from email and type : ", email, type);

        if (!email) {
            throw new ApiError(400, "email is required");
        }

        const otp = generateOTP();
        const expiry = Date.now() + parseInt(process.env.OTP_EXPIRY, 10);
        memoryStore = []
        memoryStore.push({ email, otp, expiry });
        // console.log(memoryStore);
        await sendEmail(email, type, { otp });

        res.status(200).json(new ApiResponse(200, null, 'OTP sent successfully'));
    } catch (error) {
        console.log("Internal server error while senting otp email", error);
        res.status(500).json({ message: "Internal server error while senting otp email" })
    }
})

const verifyOtp = asyncHandler(async (req, res) => {
    try {
        const { email, otp } = req.body;
        console.log(" verifing otp : ", email, otp);

        // Find the matching entry in the otpStore
        const storedData = memoryStore.find(entry => entry.email === email);

        console.log("storedData : ", storedData);

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

    try {
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

        // check admin is verified or not by super admin
        const isVerifiedAdmin = admin.verifiedAdmin

        if (!isVerifiedAdmin) {
            return res.status(401).json({ message: 'This Admin is not verified by [super admin]' })
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
                        // refreshToken,
                    },
                    "Admin logged In Successfully"
                )
            );
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error while login" })
    }

})

const getCurrentAdmin = asyncHandler(async (req, res) => {
    try {
        return res
            .status(200)
            .json(new ApiResponse(200, req.user, "User fetched successfully"));
    } catch (error) {
        console.log("Internal server error while getting current user");
    }

});

const updateAdminDetails = asyncHandler(async (req, res) => {
    const { username, fullName } = req.body;
    const adminId = req.user._id; // Assuming you have a middleware that sets req.user to the authenticated admin

    // Validation
    if (!username || !fullName) {
        throw new ApiError(400, "Username and Full Name are required");
    }

    try {
        // Find the admin by ID
        const admin = await Admin.findById(adminId);

        if (!admin) {
            throw new ApiError(404, "Admin not found");
        }

        // Update the fields
        admin.username = username;
        admin.fullName = fullName;

        // Save the updated admin
        await admin.save();

        // Respond with the updated admin details
        return res.status(200).json(new ApiResponse(200, admin, 'Admin details updated successfully'));
    } catch (error) {
        console.error("Error updating admin details:", error);
        throw new ApiError(500, "Failed to update admin details");
    }
});

// Controller to get all admins except the logged-in user
const getAllAdminsExceptSelf = asyncHandler(async (req, res) => {
    try {
        const loggedInUserId = req.user._id;

        // Fetch all admins except the logged-in user
        const admins = await Admin.find({ _id: { $ne: loggedInUserId } }).select(
            "-password -refreshToken"
        );

        res.status(200).json({
            success: true,
            data: admins
        });
    } catch (error) {
        console.log("error : ", error);
        throw new ApiError(500, error?.message || "An error occurred while fetching admins");
    }
});

// toggle verified email by super admin
const toggleVerifiedStatus = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        throw new ApiError(400, "Admin ID is required");
    }

    if (!req.user.isSuperAdmin) {
        throw new ApiError(400, "You are not super admin");
    }

    try {
        // Find the admin by ID
        const admin = await Admin.findById(id);

        if (!admin) {
            throw new ApiError(404, "Admin not found");
        }

        // Toggle the verifiedAdmin field
        admin.verifiedAdmin = !admin.verifiedAdmin;

        // Save the updated admin
        await admin.save();

        res.status(200).json({ success: true, data: admin, message: 'Admin verification status updated successfully' });
    } catch (error) {
        console.error("Error updating admin verification status:", error);
        throw new ApiError(500, "Failed to update admin verification status");
    }
};

const toggleSuperAdminStatus = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        throw new ApiError(400, "Admin ID is required");
    }

    if (!req.user.isSuperAdmin) {
        throw new ApiError(400, "You are not super admin");
    }

    try {
        // Find the admin by ID
        const admin = await Admin.findById(id);

        if (!admin) {
            throw new ApiError(404, "Admin not found");
        }

        // Toggle the isSuperAdmin field
        admin.isSuperAdmin = !admin.isSuperAdmin;

        // Save the updated admin
        await admin.save();

        res.status(200).json({ success: true, data: admin, message: 'Admin super admin status updated successfully' });
    } catch (error) {
        console.error("Error updating admin super admin status:", error);
        throw new ApiError(500, "Failed to update admin super admin status");
    }
};

const forgotPassword = asyncHandler(async (req, res) => {
    const { email, newPassword  } = req.body;
    // console.log(email, newPassword);

    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    // if (newPassword !== confirmPassword) {
    //     // throw new ApiError(400, "Passwords do not match");
    //     return res.status(400).json({ message: 'Passwords do not match' })
    // }

    try {
        const admin = await Admin.findOne({ email });

        if (!admin) {
            // throw new ApiError(404, "No admin found with that email address");
            return res.status(400).json({ message: 'No admin found with this email address' })
        }

        admin.password = newPassword;
        await admin.save();
        return res.status(200).json(new ApiResponse(201, "Your Password is Successfully changed"))

    } catch (error) {
        console.log("internal server error while changing password : ", error);
        throw new ApiError(500, "internal server error while changing password")
    }

})

export { sendOtp, verifyOtp, submitAdminDetails, loginAdmin, toggleVerifiedStatus, getCurrentAdmin, getAllAdminsExceptSelf, toggleSuperAdminStatus, forgotPassword, updateAdminDetails }