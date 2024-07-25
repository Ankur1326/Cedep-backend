import { Router } from "express";
import { getAllAdminsExceptSelf, getCurrentAdmin, loginAdmin, sendOtp, submitAdminDetails, toggleVerifiedStatus, verifyOtp, toggleSuperAdminStatus, forgotPassword, updateAdminDetails } from "../controllers/admin.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/send-otp").post(sendOtp)
router.route("/verify-otp").post(verifyOtp)
router.route("/submit-admin-details").post(submitAdminDetails)

router.route("/login").post(loginAdmin)
router.route("/forgot-password").post(forgotPassword)

// Route for toggling admin verification status using id by super admin
router.route("/current-admin").get(verifyJWT, getCurrentAdmin)
router.route("/exclude-self").get(verifyJWT, getAllAdminsExceptSelf)
router.route('/toggle-verified/:id').patch(verifyJWT, toggleVerifiedStatus)
router.route("/toggle-super-admin/:id").patch(verifyJWT, toggleSuperAdminStatus)
router.route("/update-admin-details").put(verifyJWT, updateAdminDetails)

export default router;