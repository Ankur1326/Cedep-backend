import { Router } from "express";
import { getAllAdminsExceptSelf, getCurrentAdmin, loginAdmin, sendOtp, submitAdminDetails, toggleVerifiedStatus, verifyOtp, toggleSuperAdminStatus } from "../controllers/admin.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/send-otp").post(sendOtp)
router.route("/verify-otp").post(verifyOtp)
router.route("/submit-admin-details").post(submitAdminDetails)

router.route("/login").post(loginAdmin)

// Route for toggling admin verification status using id by super admin
router.route("/current-admin").get(verifyJWT, getCurrentAdmin)
router.route("/exclude-self").get(verifyJWT, getAllAdminsExceptSelf)
router.route('/toggle-verified/:id').patch(verifyJWT, toggleVerifiedStatus)
router.route("/toggle-super-admin/:id").patch(verifyJWT, toggleSuperAdminStatus)

export default router;