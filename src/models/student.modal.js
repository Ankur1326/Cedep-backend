import mongoose, { Schema } from "mongoose";
import moment from "moment";
import { Counter } from "./counter.modal.js";

const psc_paperDefaults = {
    'Joint Secretary': { firstPaper: false, secondPaper: false },
    'Under Secretary': { firstPaper: false, secondPaper: false },
    'Section Officer': { firstPaper: false, gk: false, iq: false, english: false, secondPaper: false, thirdPaper: false, fourthPaper: false },
    'Law Service Officer': { firstPaper: false, secondPaper: false, thirdPaper: false },
    'Foreign Service Officer': { firstPaper: false, secondPaper: false, thirdPaper: false, extraPaper1: false, extraPaper2: false },
    'NAASU': { firstPaper: false, gk: false, iq: false, secondPaper: false, thirdPaper: false, प्रशासन: false, राजश्व: false, लेखा: false, न्याय: false, परर्राष्ट्र: false },
    'Kharidar': { firstPaper: false, secondPaper: false, thirdPaper: false },
};

const tsc_levelDefauts = {
    'Primary Level': { firstPaper: false, secondPaper: false },
    'Lower Sec. Level': { firstPaper: false, secondPaper: false },
    'Secondary Level': { firstPaper: false, secondPaper: false },
}

// Define sub-schemas...............
const psc_postSchema = new Schema({
    name: {
        type: String,
        enum: [
            'Joint Secretary',
            'Under Secretary',
            'Section Officer',
            'Law Service Officer',
            'Foreign Service Officer',
            'NAASU',
            'Kharidar'
        ],
        // required: true
    },
    papers: {
        type: Object,
        default: function () {
            return psc_paperDefaults[this.name] || {};
        }
    }
}, { _id: false })

const tsc_levelschema = new Schema({
    name: {
        type: String,
        enum: ['Primary Level', 'Lower Sec. Level', 'Secondary Level'],
    },
    papers: {
        type: Object,
        default: function () {
            return tsc_levelDefauts[this.name] || {};
        },
        // required: 
    }
}, { _id: false })

const bs_bankScheha = new Schema({
    name: {
        type: String,
        enum: ["Nepal Rastra Bank", 'Rastriya Bank Limited', 'Nepal Bank Limited', 'Agriculture Development Bank'],
    },
    level: {
        type: Object,
        enum: ["fourth", "fifth", "officer"]
    },
}, { _id: false })

const ds_departmentSchema = new Schema({
    name: {
        type: String,
        enum: [
            'Nepal Police',
            'Armed Police Force',
            'Anushandhan'
        ],
    },
    nepalPolice_post: {
        type: String,
        required: function () {
            return this.name === 'Nepal Police'
        },
        enum: ['Inspector', 'ASI']
    },
    armedPoliceForce_post: {
        type: String,
        required: function () {
            return this.name === 'Armed Police Force'
        },
        enum: ['Inspector', 'ASI']
    },
    anushandhan_post: {
        type: String,
        required: function () {
            return this.name === 'Anushandhan'
        },
        enum: ['Officer', 'Assistant']
    },
}, { _id: false })

// Pre-save middleware to merge default and provided paper values
psc_postSchema.pre('save', function (next) {
    if (this.papers) {
        const defaultPapers = psc_paperDefaults[this.name] || {};
        this.papers = { ...defaultPapers, ...this.papers };
    }
    next();
});

tsc_levelschema.pre('save', function (next) {
    if (this.papers) {
        const defaultPaper = {} || {};
        this.papers = { ...defaultPaper, ...this.papers }
    }
    next();
})

// Main schema
const studentSchema = new Schema(
    {
        fullName: {
            type: String,
            // unique: true,
            required: true,
            // lowercase: true,
            index: true
        },
        permanentAddress: {
            type: String,
            // trim: true,
        },
        email: {
            type: String,
            trim: true,
        },
        mobileNumber: {
            type: String,
            trim: true,
            required: true,
            unique: true,
        },
        telephoneNumber: {
            type: String,
            trim: true,
        },
        passportSizePhoto: {
            type: String,
            // required: true,
        },
        groupName: {
            type: String,
            trim: true,
            required: true,
        },
        idCardPhoto: {
            type: String,
        },
        registrationNum: {
            type: String,
            unique: true,
            // required: true,
            trim: true,
            index: true
        },
        //courseDetails***
        service: {
            type: String,
            // required: true,
            enum: [
                'Public Service Commission (PSC)',
                'Teacher Service Commission (TSC)',
                'Banking Service',
                'Health Service',
                'Defense Service',
                'Other Course'
            ],
        },
        psc_post: {
            type: psc_postSchema,
            required: function () {
                return this.service === 'Public Service Commission (PSC)';
            }
        },
        level: {
            type: tsc_levelschema,
            required: function () {
                return this.service === 'Teacher Service Commission (TSC)'
            }
        },
        bank: {
            type: bs_bankScheha,
            required: function () {
                return this.service === 'Banking Service'
            }
        },
        hc_post: {
            type: String,
            enum: ['Health Assistant', 'CMA (AHW)', 'ANM', 'Staff Nurse', 'Lab Technology', 'Lab Assistant', 'B.N. - Nursing Officer', 'M.N. - Master in Nursing', 'D. Pharmacy', 'MBBS (Medical Officer)', 'BPH (Public Health Officer)', 'MPH (Masters in Public Health)'],
            required: function () {
                return this.service === 'Health Service'
            }
        },
        ds_department: {
            type: ds_departmentSchema,
            required: function () {
                return this.service === 'Defense Service'
            }
        },
        otherCourse: {
            type: Object,
            specify: {
                type: String,
            },
            required: function () {
                return this.service === 'Other Course'
            }
        },
        shift: {
            type: String,
            enum: ['Morning', 'Day', 'Evening', 'Night'],
        },
        // Payment Details***
        paymentMode: {
            type: String,
            enum: [
                'Bank Deposit',
                'CEDEP Bill',
                'E-Sewa',
                'E-Banking',
                'Pay Letter',
            ],
        },
        voucher: { // voucher image
            type: String,
            required: function () {
                return ['Bank Deposit', 'CEDEP Bill', 'E-Sewa', 'E-Banking'].includes(this.paymentMode);
            }
        },
        voucherAmount: {
            type: Number,
            required: function () {
                return ['Bank Deposit', 'CEDEP Bill', 'E-Sewa', 'E-Banking'].includes(this.paymentMode);
            }
        },
        voucherDate: {
            type: Date,
            required: function () {
                return ['Bank Deposit', 'CEDEP Bill', 'E-Sewa', 'E-Banking'].includes(this.paymentMode);
            }
        },
    },
    {
        timestamps: true,
    }
)

// Generate a new registration number
const generateRegistrationNum = async () => {
    const currentYearMonth = moment().format("YYYYMM")
    let counter = await Counter.findOne({ yearMonth: currentYearMonth })

    if (!counter) {
        counter = new Counter({ yearMonth: currentYearMonth, registrationNumSequenceValue: 0 })
    }

    counter.registrationNumSequenceValue += 1;
    await counter.save();

    const registrationNum = `${currentYearMonth}-${String(counter.registrationNumSequenceValue).padStart(3, '0')}`;

    return registrationNum;
}

studentSchema.pre("save", async function (next) {
    if (!this.registrationNum) {
        this.registrationNum = await generateRegistrationNum();
    }
    next();
});

export const Student = mongoose.model("Student", studentSchema)
