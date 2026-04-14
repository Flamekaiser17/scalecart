import mongoose, { Document, Schema } from "mongoose";

export type OrderStatus = "Pending" | "Shipped" | "Delivered" | "Cancelled";
export type PaymentStatus = "Pending" | "Paid" | "Failed";

export interface IOrder extends Document {
    userId: mongoose.Types.ObjectId;
    items: mongoose.Types.ObjectId[];
    orderDate: Date;
    shippingDate: Date;
    status: OrderStatus;
    totalAmount: number;
    shippingAddress?: string;
    paymentId?: string;           // Razorpay payment ID (after successful payment)
    razorpayOrderId?: string;     // Razorpay order ID (created before payment)
    paymentStatus: PaymentStatus; // Tracks whether payment went through
}

const orderSchema = new Schema<IOrder>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    items: [{
        type: Schema.Types.ObjectId,
        ref: "Product",
    }],
    orderDate: {
        type: Date,
        required: true,
        default: Date.now,
    },
    shippingDate: {
        type: Date,
        required: true,
    },
    status: {
        type: String,
        required: true,
        enum: ["Pending", "Shipped", "Delivered", "Cancelled"],
        default: "Pending",
    },
    totalAmount: {
        type: Number,
        required: true,
    },
    shippingAddress: {
        type: String,
    },
    paymentId: {
        type: String,  // Set after successful Razorpay payment verification
    },
    razorpayOrderId: {
        type: String,  // Set when Razorpay order is created
    },
    paymentStatus: {
        type: String,
        enum: ["Pending", "Paid", "Failed"],
        default: "Pending",
    },
}, { timestamps: true });

const Order = mongoose.model<IOrder>("Order", orderSchema);
export default Order; 