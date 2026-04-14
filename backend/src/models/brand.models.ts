import mongoose, { Document, Schema } from "mongoose";

export interface IBrand extends Document {
    name: string;
    logo: string;
    productCount: number;
    topProducts: mongoose.Types.ObjectId[];
}

const brandSchema = new Schema<IBrand>({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    logo: {
        type: String,
        required: true,
    },
    productCount: {
        type: Number,
        required: true,
        default: 0,
    },
    topProducts: [{
        type: Schema.Types.ObjectId,
        ref: "Product",
    }],
}, { timestamps: true });

const Brand = mongoose.model<IBrand>("Brand", brandSchema);
export default Brand; 
