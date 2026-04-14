import express, { Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
//import session from "express-session";
//import passport from "./middlewares/passport.js";
import userRouter from "./routes/user.routes.js";
import addressRoutes from './routes/address.routes.js';
import brandRoutes from './routes/brand.routes.js';
import categoryRoutes from './routes/category.routes.js';
import productRoutes from './routes/product.routes.js';
import uploadRoutes from "./routes/upload.routes.js";
import reviewRoutes from './routes/review.routes.js';
import cartRoutes from './routes/cart.routes.js';
import wishlistRoutes from './routes/wishlist.routes.js';
import orderRoutes from './routes/order.routes.js';
import paymentRoutes from './routes/payment.routes.js';
//import authRouter from "./routes/auth.routes.js";

const app: Express = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

app.use(express.json({ limit: "4mb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Session middleware for Passport
// app.use(
//     session({
//         secret: process.env.SESSION_SECRET,
//         resave: false,
//         saveUninitialized: false,
//     })
// );

// Initialize Passport
// app.use(passport.initialize());
// app.use(passport.session());

app.use("/api/v1/users", userRouter);
app.use("/api/v1/users", addressRoutes);
app.use("/api/v1/brands", brandRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/utils", uploadRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/wishlist", wishlistRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/payments", paymentRoutes);

//app.use("/api/v1/auth", authRouter);

//http://localhost:8000/api/v1/users/register

export { app }; 