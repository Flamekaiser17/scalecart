import mongoose, { Document, Schema } from "mongoose";

interface ICartItem {
    productId: mongoose.Types.ObjectId;
    quantity: number;
    price: number;
}

interface ICart extends Document {
    userId: mongoose.Types.ObjectId;
    items: ICartItem[];
    totalAmount: number;
}

const cartSchema = new Schema<ICart>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    items: [{
        productId: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
            type: Number,
            required: true
        }
    }]
}, { timestamps: true });

cartSchema.virtual('totalAmount').get(function(this: ICart) {
    return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
});

const Cart = mongoose.model<ICart>("Cart", cartSchema);

export default Cart; 