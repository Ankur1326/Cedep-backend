import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

// invoice schema 
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
    particulars: {
        type: String,
        enum: ['Tution Fees', 'Materials Fees', 'Exam Fees', 'Library Fees'],
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
            unique: true,
        },
        groupName: {
            type: String,
            trim: true,
        },
        registrationNum: {
            type: String,
            unique: true,
            required: true,
            trim: true,
            index: true
        },
        invoices: [invoiceDetailsSchema]
    }
)

export const Invoice = mongoose.model("Invoice", invoiceSchema)
