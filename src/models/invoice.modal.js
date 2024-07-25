import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import moment from "moment"

// Counter schema to track the last sequence number
const counterSchema = new Schema({
    yearMonth: { type: String, required: true, unique: true }, // Format: YYYYMM
    sequenceValue: { type: Number, default: 0 }
})

const Counter = mongoose.model("Counter", counterSchema);

// Generate a new registration number
const generateRegistrationNum = async () => {
    const currentYearMonth = moment().format("YYYYMM")
    let counter = await Counter.findOne({ yearMonth: currentYearMonth })

    if (!counter) {
        counter = new Counter({ yearMonth: currentYearMonth, sequenceValue: 0 })
    }

    counter.sequenceValue += 1;
    await counter.save();

    const registrationNum = `${currentYearMonth}-${String(counter.sequenceValue).padStart(3, '0')}`;

    return registrationNum;
}

// main invoice schema 
const invoiceDetailsSchema = new Schema({
    invoiceNum: {
        type: String,
        unique: true,
        required: true
    },
    invoiceDate: { type: Date, required: true },
    modeOfPayment: {
        type: String,
        enum: ['Cash', 'Cheque', 'Bank Deposit', 'eSewa', 'Khalti'],
        required: true
    },
    particular: {
        type: String,
        enum: ['Tuition Fees', 'Materials Fees', 'Exam Fees', 'Library Fees'],
        required: true
    },
    discount: { type: Number, required: true },
    subTotal: { type: Number, required: true },
    taxableAmount: { type: Number, required: true },
    VAT: { type: Number, required: true },
    grandTotal: { type: Number, required: true },
    authorizedSign: { type: String },
    printDate: { type: Date, required: true }
})

// Main schema
const invoiceSchema = new Schema(
    {
        fullName: {
            type: String,
            lowecase: true,
            index: true
        },
        mobileNumber: {
            type: String,
            trim: true,
        },
        groupName: {
            type: String,
            trim: true,
        },
        registrationNum: {
            type: String,
            unique: true,
            // required: true,
            trim: true,
            index: true
        },
        invoices: [invoiceDetailsSchema]
    }
)

invoiceSchema.pre("save", async function (next) {
    if (!this.registrationNum) {
        this.registrationNum = await generateRegistrationNum()
    }
    next();
})

export const Invoice = mongoose.model("Invoice", invoiceSchema)
