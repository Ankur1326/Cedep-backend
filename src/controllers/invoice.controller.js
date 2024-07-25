import { Invoice } from "../models/invoice.modal.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createInvoice = asyncHandler(async (req, res) => {
    const { fullName, groupName, mobileNumber, registrationNum = "", invoice } = req.body;
    console.log(req.body);

    try {
        if (!fullName || !groupName || !mobileNumber) {
            return res.status(400).json({ message: "fullName, groupName, mobileNumber, invoice are required" })
        }

        // Check if the fullName, mobileNumber both are exists in same invoice
        let existingInvoice = await Invoice.findOne({ fullName, mobileNumber });

        if (existingInvoice) {
            // Add the provided invoice in the invoices array
            existingInvoice.invoices.push(invoice);
            await existingInvoice.save();
            // console.log('Invoice added to existing Invoice');
            return res.status(200).json(new ApiResponse(201, existingInvoice, "Invoice added to existing Invoice"))
        }
        else {
            const newInvoice = new Invoice({
                fullName,
                mobileNumber,
                groupName,
                invoices: [invoice]
            });

            await newInvoice.save();
            return res.status(201).json(new ApiResponse(201, {}, "New Invoice successfully created!"));
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

    const fullNameRegex = /^(.*?)(\d{6}-\d+)$/;
    const matches = query.match(fullNameRegex);
    let fullName = "";
    let registrationNum = "";

    if (matches) {
        fullName = matches[1].trim();
        registrationNum = matches[2].trim();
    } else {
        fullName = query.trim();
    }

    try {
        const pipeline = [
            {
                $match: {
                    $and: [
                        { fullName: { $regex: fullName, $options: "i" } },
                        ...(registrationNum ? [{ registrationNum: { $regex: registrationNum, $options: 'i' } }] : [])
                    ]
                }
            },
            {
                $project: {
                    _id: 0,
                    fullName: 1,
                    registrationNum: 1
                }
            }
        ];

        const matchingInvoices = await Invoice.aggregate(pipeline);

        return res.status(200).json(new ApiResponse(200, matchingInvoices, "Matching registrations fetched successfully!"));

    } catch (error) {
        console.error("Error while fetching matching registrations: ", error);
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

export { createInvoice, findInvoiceDetails, getMatchingRegistrations }