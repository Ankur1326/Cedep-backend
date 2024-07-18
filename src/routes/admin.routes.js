import { Router } from "express";
import { loginAdmin, sendOtp, submitAdminDetails, verifyOtp } from "../controllers/admin.controllers.js";

const router = Router()

router.route("/send-otp").post(sendOtp)
router.route("/verify-otp").post(verifyOtp)
router.route("/submit-admin-details").post(submitAdminDetails)

router.route("/login").post(loginAdmin)


export default router;