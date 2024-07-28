import { Router } from "express";
import { fetchStudentDetails, fetchStudentsSummary, registerStudent } from "../controllers/student.controller.js";

const router = Router()

router.route("/register").post(registerStudent)
router.route("/summary").get(fetchStudentsSummary)
router.route("/student/:studentId").get(fetchStudentDetails) // fetch student full details


export default router;
