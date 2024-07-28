import mongoose, { Schema } from "mongoose";
import { Counter } from "./counter.modal.js";
import moment from "moment";

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

// Generate a new registration number
const generateInvoiceNum = async () => {
    const currentYearMonth = moment().format("YYYYMM")
    let counter = await Counter.findOne({ yearMonth: currentYearMonth })

    if (!counter) {
        counter = new Counter({ yearMonth: currentYearMonth, invoiceSequenceNumValue: 0 })
    }

    counter.invoiceSequenceNumValue += 1;
    await counter.save();

    const invoiceNum = `CN-${currentYearMonth}-${String(counter.invoiceSequenceNumValue).padStart(3, '0')}`;

    return invoiceNum;
}

invoiceSchema.pre("save", async function (next) {
    if (!this.invoiceNum) {
        this.invoiceNum = await generateInvoiceNum();
    }
    next();
});

export const Invoice = mongoose.model("Invoice", invoiceSchema)