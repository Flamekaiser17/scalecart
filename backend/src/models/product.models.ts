import mongoose, { Document, Schema } from "mongoose";

export interface IProduct extends Document {
    name: string;
    description: string;
    price: number;
    discount: number;
    brandId: mongoose.Types.ObjectId;
    images: string[];
    categoryId: mongoose.Types.ObjectId;
    stock: number;
    rating: number;
    reviews: mongoose.Types.ObjectId[];
    colors?: string[];
    sizes?: string[];
}

const productSchema = new Schema<IProduct>({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    price: {
        type: Number,
        required: true,
    },
    discount: {
        type: Number,
        default: 0.0,
    },
    brandId: {
        type: Schema.Types.ObjectId,
        ref: "Brand",
        required: true,
    },
    images: [{
        type: String,
        required: true,
    }],
    categoryId: {
        type: Schema.Types.ObjectId,
        ref: "Category",
        required: true,
    },
    stock: {
        type: Number,
        required: true,
    },
    rating: {
        type: Number,
        default: 0.0,
    },
    reviews: [{
        type: Schema.Types.ObjectId,
        ref: "Review",
    }],
    colors: {
        type: [String],
        default: []
    },
    sizes: {
        type: [String],
        default: []
    },
}, { timestamps: true });

const Product = mongoose.model<IProduct>("Product", productSchema);
export default Product; 