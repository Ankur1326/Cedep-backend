import mongoose, { Schema } from "mongoose";

const invoiceSchema = new Schema(
    {
        studentId: {
            type: Schema.Types.ObjectId,
            ref: 'Student',
            required: true,
        },
        registrationNum: {
            type: String,
            required: true,
        },
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
        discount: {
            type: Number,
            required: true,
            min: 0
        },
        subTotal: {
            type: Number,
            required: true,
            min: 0,
        },
        taxableAmount: { type: Number, required: true },
        VAT: { type: Number, required: true },
        grandTotal: {
            type: Number,
            required: true,
            min: 0,
        },
        authorizedSign: {
            type: String, trim: true,
            default: '',
        },
        printDate: { type: Date, required: true },
    },
    {
        timestamps: true,
    }
)

export const Invoice = mongoose.model("Invoice", invoiceSchema)