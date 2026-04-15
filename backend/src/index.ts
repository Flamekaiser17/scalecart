import "./loadEnv.js";
import prisma from "./db/prisma.js";
import { app } from "./app.js";

// Test PostgreSQL connection then start server
prisma.$connect()
  .then(() => {
    console.log("\nPostgreSQL connected via Prisma");

    app.on("error", () => {
      console.log("Server error occurred");
      process.exit(1);
    });

    const port = process.env.PORT ? Number(process.env.PORT) : 8000;
    app.listen(port, () => {
      console.log(`Server is running at port: ${port}`);
    });
  })
  .catch((error: Error) => {
    console.log("PostgreSQL connection failed:", error.message);
    process.exit(1);
  });