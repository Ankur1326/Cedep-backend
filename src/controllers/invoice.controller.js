import { Invoice } from "../models/invoice.modal.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createInvoice = asyncHandler(async (req, res) => {
    const { fullName, groupName, mobileNumber, registrationNum, invoice } = req.body;

    try {
        if (!fullName || !groupName || !mobileNumber || !registrationNum) {
            return res.status(400).json({ message: "fullName, groupName, mobileNumber, registrationNum, invoice are required" })
        }

        // Check if the registration number exists
        let existingInvoice = await Invoice.findOne({ registrationNum });

        if (existingInvoice) {
            // Invoice exists, send data without invoices
            const { fullName, mobileNumber, groupName, registrationNum } = existingInvoice;

            // Add the provided invoice in the invoices array
            if (invoice) {
                existingInvoice.invoices.push(invoice);
                await existingInvoice.save();
                // console.log('Invoice added to existing Invoice');

                return res.status(200).json(new ApiResponse(201, existingInvoice, "Invoice added to existing Invoice"))
            }
        } else {
            const newInvoice = new Invoice({
                fullName,
                mobileNumber,
                groupName,
                registrationNum,
                invoices: [invoice]
            });

            const savedInvoice = await newInvoice.save();
            return res.status(201).json(new ApiResponse(201, {}, "New Invoice successfully created!"));
        }
    } catch (error) {
        console.log("Error while creating new invoice : ", error);
        res.status(400).json({ message: error.message });
    }
})

const findInvoiceRegistration = asyncHandler(async (req, res) => {
    const { registrationNum } = req.body;

    // Validate input
    if (!registrationNum) {
        return res.status(400).json({ message: "Registration number is required" });
    }
    try {
        // Check if the registration number exists
        let existingInvoice = await Invoice.findOne({ registrationNum });

        if (!existingInvoice) {
            return res.status(200).json(new ApiResponse(201, {}, "Not Exist"))
        }

        const { fullName, mobileNumber, groupName } = existingInvoice;
        return res.status(200).json(new ApiResponse(201, { fullName, mobileNumber, groupName }, "This invoice is already exist!"))
    } catch (error) {
        console.log("Error while searching invoice : ", error);
        return res.status(500).json({ message: "An error occurred while searching for the invoice" });
    }
})

export { createInvoice, findInvoiceRegistration }