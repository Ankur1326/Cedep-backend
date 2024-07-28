import { Router } from "express";
import { createInvoice, findInvoiceDetails, getMatchingRegistrations, getStudentInvoices } from "../controllers/invoice.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/create-invoice").post(verifyJWT, createInvoice)
router.route('/matching-registrations').get(getMatchingRegistrations) // to fetch matching registrations
// Route to find an invoice or generate a new registration number
router.route('/find-invoice-details').post(findInvoiceDetails);
router.route('/get-student-invoices/:studentId').get(getStudentInvoices);

export default router;