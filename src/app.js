import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// testing routes 
app.get("/", (req, res) => res.send("Express on Vercel"));

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    // origin: 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

import adminRouter from "./routes/admin.routes.js"
import studentRouter from "./routes/student.routes.js"
import invoiceRouter from "./routes/invoice.routes.js"

app.use("/api/v1/admins", adminRouter);
app.use("/api/v1/students", studentRouter);
app.use("/api/v1/invoices", invoiceRouter);



export { app };