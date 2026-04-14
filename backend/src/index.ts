import "./loadEnv.js";
import connectDB from "./db/index.js";
import { app } from "./app.js";



connectDB()
.then(() => {
    app.on("error", () => {
        console.log("Server error occurred");
        process.exit(1);
    });

    const port = process.env.PORT ? Number(process.env.PORT) : 8000;
    app.listen(port, () => {
        console.log(`Server is running at the port : ${port}`);
    });
})
.catch((error: Error) => {
    console.log("MongoDB connection Failed!!", error);
});