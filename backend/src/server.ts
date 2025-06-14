import express from "express";
import dotenv from "dotenv";
import reposRouter from "./routes/repos.router";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.use("/api/repos", reposRouter);



app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})