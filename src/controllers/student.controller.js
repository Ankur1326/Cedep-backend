import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Student } from "../models/student.modal.js";

const registerStudent = asyncHandler(async (req, res) => {
    try {
        const { fullName, permanentAddress, email, mobileNumber, telephoneNumber,groupName, service, psc_post, level, bank, hc_post, ds_department, otherCourse, shift } = req.body
        console.log(fullName, permanentAddress, email, mobileNumber, telephoneNumber, groupName, service, psc_post, bank, hc_post, level, ds_department, otherCourse, shift);

        const existedStudent = await Student.findOne({
            $and: [{ fullName }, { mobileNumber }],
        })
        if (existedStudent) {
            return res.status(409).json({ message: "This Student is already registered" })
        }

        const registerStudent = await Student.create({
            fullName,
            permanentAddress,
            email,
            mobileNumber,
            telephoneNumber,
            groupName,
            service,
            psc_post: psc_post,
            level: level,
            bank: bank,
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
