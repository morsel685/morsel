const express = require("express");
const connectDB = require("./config/database");
const config = require("./config/config");
const globalErrorHandler = require("./middlewares/globalErrorHandler");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const app = express();


const PORT = config.port;
connectDB();

// Middlewares
app.use(cors({
    credentials: true,
    origin: ['http://localhost:5173', config.frontendUrl]
}))
app.use(express.json()); // parse incoming request in json format
app.use(cookieParser())


// Root Endpoint
app.get("/", (req, res) => {
    res.json({ message: "Hello from POS Server!" });
})

// Other Endpoints
app.use("/api/user", require("./routes/userRoute"));
app.use("/api/order", require("./routes/orderRoute"));
app.use("/api/table", require("./routes/tableRoute"));
app.use("/api/payment", require("./routes/paymentRoute"));
app.use("/api/menu", require("./routes/menuRoute"));
app.use("/api/report", require("./routes/reportRoute"));
app.use("/api/dashboard", require("./routes/dashboardRoute"));

// Global Error Handler
app.use(globalErrorHandler);


// Server
app.listen(PORT, () => {
    console.log(`☑️  POS Server is listening on port ${PORT}`);
})