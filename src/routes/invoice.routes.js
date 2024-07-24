import { Router } from "express";
import { createInvoice, findInvoiceRegistration } from "../controllers/invoice.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/create-invoice").post(verifyJWT,createInvoice)
// Route to find an invoice or generate a new registration number
router.route('/find-invoice-regNum').post(findInvoiceRegistration);


export default router;