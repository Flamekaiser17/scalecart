import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWishlistItem extends Document {
  userId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
}

const wishlistItemSchema = new Schema<IWishlistItem>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  productId: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
}, { timestamps: true });

const WishlistItem = mongoose.model<IWishlistItem>("WishlistItem", wishlistItemSchema);
export default WishlistItem; 