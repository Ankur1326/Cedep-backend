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
        let existingStudent = await Student.findOne({ fullName, mobileNumber });
        if (existingStudent) {
            const studentId = existingStudent._id
            const registrationNum = existingStudent.registrationNum

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

            return res.status(201).json(new ApiResponse(201, { invoice, existingStudent }, "Invoice created successfully with existing student"));

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

    // Split the query into fullName and registrationNum
    const [fullName, registrationNum] = query.split(/ (\d{6}-\d+)$/);

    try {
        // Search for students based on the parsed fields
        const searchCriteria = {};
        if (fullName) {
            searchCriteria.fullName = { $regex: new RegExp(fullName.trim(), "i") };
        }
        if (registrationNum) {
            searchCriteria.registrationNum = { $regex: new RegExp(registrationNum.trim(), "i") };
        }

        const matchingStudents = await Student.find(searchCriteria).lean();

        return res.status(200).json(new ApiResponse(200, matchingStudents, "Matching students fetched successfully!"));

    } catch (error) {
        console.error("Error while fetching matching students: ", error);
        res.status(500).json({ message: error.message });
    }
});

const findInvoiceDetails = asyncHandler(async (req, res) => {
    const { registrationNum } = req.body;
    // Validate input
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

const getStudentInvoices = asyncHandler(async (req, res) => {
    const { studentId } = req.params
    if (!studentId) {
        return res.status(400).json({ message: "Student id is required" })
    }

    try {
        const invoices = await Invoice.find({ studentId })

        if (!invoices) {
            return res.status(400).json({ message: "Invoices is not found" })
        }

        return res.status(200).json(new ApiResponse(201, invoices, "Invoices successfully fetched"))

    } catch (error) {
        console.log("Error while fetching student invoices ");
    }

})

export { createInvoice, findInvoiceDetails, getMatchingRegistrations, getStudentInvoices }