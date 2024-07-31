import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Student } from "../models/student.modal.js";
import { Invoice } from "../models/invoice.modal.js";

const registerStudent = asyncHandler(async (req, res) => {
    try {
        const { fullName, permanentAddress, email, mobileNumber, telephoneNumber, groupName, service, psc_post, level, bank, hc_post, ds_department, otherCourse, shift } = req.body
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

// Fetch student summary data
const fetchStudentsSummary = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search = '' } = req.query;

    try {
        const searchRegex = new RegExp(search, 'i');

        const students = await Student.aggregate([
            {
                $match: {
                    fullName: { $regex: searchRegex }
                }
            },
            {
                $lookup: {
                    from: 'invoices',
                    localField: '_id',
                    foreignField: 'studentId',
                    as: 'invoices'
                }
            },
            {
                $addFields: {
                    invoiceCount: { $size: '$invoices' }
                }
            },
            {
                $project: {
                    fullName: 1,
                    groupName: 1,
                    mobileNumber: 1,
                    registrationNum: 1,
                    invoiceCount: 1,
                    createdAt: 1
                }
            },
            {
                $skip: (page - 1) * limit
            },
            {
                $limit: Number(limit)
            }
        ])

        const totalCount = await Student.countDocuments()

        return res.status(200).json(new ApiResponse(201, {
            data: students,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: Number(page),
        },
            "Data fetched successfully"
        ))

    } catch (error) {
        res.status(500).json({ message: error.message });
    }

})

// Fetch detailed student data
const fetchStudentDetails = asyncHandler(async (req, res) => {
    const studentId = req.params.studentId
    if (!studentId) {
        return res.status(400).json({ message: "Student id is required" })
    }
    try {
        const student = await Student.findById(req.params.studentId);

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // const invoices = await Invoice.find({ studentId: student._id });

        return res.status(200).json(new ApiResponse(201, student, "Successfully fetched"));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

const updateStudentDetails = asyncHandler(async (req, res) => {
    const { fullName, permanentAddress, email, mobileNumber, groupName } = req.body
    const studentId = req.params.studentId
    if (!studentId) {
        return res.status(404).json({ message: 'Student Id is required' });
    }


    try {
        const student = await Student.findById(studentId)

        student.fullName = fullName
        student.permanentAddress = permanentAddress
        student.email = email
        student.mobileNumber = mobileNumber
        student.groupName = groupName

        await student.save()

        return res.status(200).json(new ApiResponse(200, student, 'Student details updated successfully'));

    } catch (error) {
        console.error("Error updating student details:", error);
        // throw new ApiError(500, "Failed to update student details");
        res.status(500).json({ message: "Failed to update student details" })

    }
})

export { registerStudent, fetchStudentsSummary, fetchStudentDetails, updateStudentDetails }
