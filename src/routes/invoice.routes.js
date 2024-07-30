import { Router } from "express";
import { createInvoice, fetchInvoiceDetailsWithStudent, findStudentDetails, getMatchingRegistrations, getStudentInvoicesSummary } from "../controllers/invoice.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/create-invoice").post(verifyJWT, createInvoice)
router.route('/matching-registrations').get(getMatchingRegistrations) // to fetch matching registrations
// Route to find an invoice or generate a new registration number
router.route('/find-student-details').post(findStudentDetails);
router.route('/get-student-invoices-summary/:studentId').get(getStudentInvoicesSummary);
router.route('/get-invoice-details/:invoiceId').get(fetchInvoiceDetailsWithStudent);

export default router;