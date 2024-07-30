import { Router } from "express";
import { fetchStudentDetails, fetchStudentsSummary, registerStudent, updateStudentDetails } from "../controllers/student.controller.js";

const router = Router()

router.route("/register").post(registerStudent)
router.route("/summary").get(fetchStudentsSummary)
router.route("/student/:studentId").get(fetchStudentDetails) // fetch student full details
router.route("/update-student-details/:studentId").put(updateStudentDetails)


export default router;
