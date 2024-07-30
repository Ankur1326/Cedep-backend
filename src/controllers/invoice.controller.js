import mongoose from "mongoose";
import { Invoice } from "../models/invoice.modal.js";
import { Student } from "../models/student.modal.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createInvoice = asyncHandler(async (req, res) => {
    const { fullName, mobileNumber, groupName, invoiceDate, modeOfPayment, particular, discount, subTotal, taxableAmount, VAT, grandTotal, authorizedSign, printDate } = req.body;

    try {
        if (!fullName || !groupName || !mobileNumber) {
            return res.status(400).json({ message: "fullName, groupName, mobileNumber, invoice are required" })
        }

        // Check if the fullName, mobileNumber both are exists in same invoice
        let student = await Student.findOne({ fullName, mobileNumber });
        if (student) {
            const studentId = student._id
            const registrationNum = student.registrationNum

            // create invoice 
            const invoice = await Invoice.create({
                studentId,
                registrationNum,
                invoiceDate,
                modeOfPayment,
                particular,
                discount,
                subTotal,
                taxableAmount,
                VAT,
                grandTotal,
                authorizedSign,
                printDate,
            })

            return res.status(201).json(new ApiResponse(201, { invoice, student }, "Invoice created successfully with existing student"));

        } else { // If student is not regestered
            const student = await Student.create({
                fullName,
                mobileNumber,
                groupName,
            })
            if (student) {
                // create new invoice 
                const studentId = student._id
                const registrationNum = student.registrationNum
                const invoice = await Invoice.create({
                    studentId,
                    registrationNum,
                    invoiceDate,
                    modeOfPayment,
                    particular,
                    discount,
                    subTotal,
                    taxableAmount,
                    VAT,
                    grandTotal,
                    authorizedSign,
                    printDate,
                })
                return res.status(201).json(new ApiResponse(201, { invoice, student }, "New Invoice created successfully with new Student"));
            }

        }
    } catch (error) {
        console.log("Error while creating new invoice : ", error);
        res.status(400).json({ message: error.message });
    }
})

const getMatchingRegistrations = asyncHandler(async (req, res) => {
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ message: "Query is required" });
    }

    try {
        // Initialize search criteria object
        const searchCriteria = {};

        // Check if the query contains a registration number in the expected format
        const registrationNumMatch = query.match(/\d{6}-\d+/);
        if (registrationNumMatch) {
            searchCriteria.registrationNum = {
                $regex: new RegExp(registrationNumMatch[0].trim(), "i"),
            };
        }

        // The remaining part of the query is treated as fullName
        const fullName = query.replace(/\d{6}-\d+/, "").trim();
        if (fullName) {
            searchCriteria.fullName = {
                $regex: new RegExp(fullName, "i"),
            };
        }

        // If neither fullName nor registrationNum are present, return a bad request response
        if (!fullName && !registrationNumMatch) {
            return res.status(400).json({ message: "Invalid query format" });
        }

        const matchingStudents = await Student.find(searchCriteria).lean();

        return res.status(200).json(
            new ApiResponse(
                200,
                matchingStudents,
                "Matching students fetched successfully!"
            )
        );
    } catch (error) {
        console.error("Error while fetching matching students: ", error);
        res.status(500).json({ message: error.message });
    }
});

const findStudentDetails = asyncHandler(async (req, res) => {
    const { registrationNum } = req.body;

    if (!registrationNum) {
        return res.status(400).json({ message: "Registration number is required" });
    }
    try {
        // Check if the registration number exists
        let existingStudent = await Student.findOne({ registrationNum });
        console.log("existingStudent : ", existingStudent);

        if (!existingStudent) {
            return res.status(200).json(new ApiResponse(201, {}, "Not Exist"))
        }

        const { fullName, mobileNumber, groupName } = existingStudent;
        return res.status(200).json(new ApiResponse(201, { fullName, mobileNumber, groupName }, "This invoice is already exist!"))
    } catch (error) {
        console.log("Error while searching invoice : ", error);
        return res.status(500).json({ message: "An error occurred while searching for the invoice" });
    }
})

const getStudentInvoicesSummary = asyncHandler(async (req, res) => {
    const { studentId } = req.params
    if (!studentId) {
        return res.status(400).json({ message: "Student id is required" })
    }

    try {
        const invoicesSummary = await Invoice.aggregate([
            {
                $match: {
                    studentId: new mongoose.Types.ObjectId(studentId)
                }
            },
            {
                $project: {
                    invoiceNum: 1,
                    modeOfPayment: 1,
                    invoiceDate: 1,
                    grandTotal: 1
                }
            }
        ])

        if (!invoicesSummary) {
            return res.status(400).json({ message: "Invoices summary is not found" })
        }

        return res.status(200).json(new ApiResponse(201, invoicesSummary, "Invoices successfully fetched"))

    } catch (error) {
        console.log("Error while fetching student invoices ");
    }

})

const fetchInvoiceDetailsWithStudent = asyncHandler(async (req, res) => {
    const { invoiceId } = req.params

    if (!invoiceId) {
        return res.status(400).json({ message: "Invoice id is required" })
    }

    try {
        const invoiceDetails = await Invoice.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(invoiceId)
                },
            },
            {
                $lookup: {
                    from: "students",
                    localField: "studentId",
                    foreignField: "_id",
                    as: "student",
                    pipeline: [
                        {
                            $project: {
                                fullName: 1,
                                groupName: 1,
                                mobileNumber: 1,
                                registrationNum: 1,
                            }
                        }
                    ]
                }
            }
        ])

        if (!invoiceDetails) {
            return res.status(400).json({ message: "Invoice details is not found" })
        }

        return res.status(200).json(new ApiResponse(201, invoiceDetails, "Invoice details successfully fetched"))

    } catch (error) {
        console.log("Internal server error while fetching invoice details", error);
        return res.status(500).json({ message: "Internal server error while fetching invoice details" })
    }

})

export { createInvoice, findStudentDetails, getMatchingRegistrations, getStudentInvoicesSummary, fetchInvoiceDetailsWithStudent }