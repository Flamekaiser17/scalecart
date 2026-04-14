import mongoose, { Document, Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

export interface IUser extends Document {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    gender?: string;
    avatar?: string;
    dateOfBirth?: Date;
    password: string;
    addresses: mongoose.Types.ObjectId[];
    orders: mongoose.Types.ObjectId[];
    wishlist: mongoose.Types.ObjectId[];
    refreshToken?: string;
    emailVerificationToken?: string;
    emailVerificationTokenExpires?: Date;
    isVerified: boolean;
    isPasswordCorrect(password: string): Promise<boolean>;
    generateAccessToken(): string;
    generateRefreshToken(): string;
}

const userSchema = new Schema<IUser>(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        firstName: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        lastName: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        phoneNumber: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        gender: {
            type: String,
        },
        avatar: {
            type: String,  //cloudinary url  
        },
        dateOfBirth: {
            type: Date,
        },
        password: {
            type: String,
            required: [true, "Password is required"]
        },
        addresses: [{
            type: Schema.Types.ObjectId,
            ref: "Address"
        }],
        orders: [{
            type: Schema.Types.ObjectId,
            ref: "Order"
        }],
        wishlist: [{
            type: Schema.Types.ObjectId,
            ref: "Wishlist"
        }],
        refreshToken: {
            type: String
        },
        emailVerificationToken: {
            type: String
        },
        emailVerificationTokenExpires: {
            type: Date
        },
        isVerified: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.isPasswordCorrect = async function (password: string): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function (): string {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
        },
        process.env.ACCESS_TOKEN_SECRET as string,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    );
};

userSchema.methods.generateRefreshToken = function (): string {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET as string,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    );
};

const User = mongoose.model<IUser>("User", userSchema);
export default User; 