import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Student } from "../models/student.modal.js";

const registerStudent = asyncHandler(async (req, res) => {
    try {
        const { fullName, permanentAddress, email, mobileNumber, telephoneNumber, service, psc_post, level, bank, hc_post, ds_department, otherCourse, shift } = req.body
        console.log(fullName, permanentAddress, email, mobileNumber, telephoneNumber, service, psc_post, bank, hc_post, level, ds_department, otherCourse, shift);

        const existedStudent = await Student.findOne({ fullName: "Ankur Swami" })
        if (existedStudent) {
            await Student.deleteOne({ fullName: "Ankur Swami" })
        }

        const registerStudent = await Student.create({
            fullName,
            permanentAddress,
            email,
            mobileNumber,
            telephoneNumber,
            service,
            psc_post: psc_post || {},
            level: level || {},
            bank: bank || {},
            hc_post,
            ds_department,
            otherCourse,
            shift
        })

        console.log(registerStudent);

        return res.status(200).json({ message: "success!" })
    } catch (error) {
        console.log("Error : ", error);
    }
})

export { registerStudent }
