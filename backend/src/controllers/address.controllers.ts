import { Request, Response } from 'express';
import prisma from '../db/prisma.js';

interface RequestWithUser extends Request {
    user: {
        _id: string; // From auth middleware alias
        id?: string;
    };
}

// Handler to add a new shipping address (Trigger hot reload)
export const addAddress = async (req: RequestWithUser, res: Response) => {
    try {
        const userId = req.user._id;
        const { 
            name, fullName, 
            phoneNumber, phone, 
            street, addressLine, 
            city, 
            state, 
            postalCode, pincode, 
            country, 
            isDefault 
        } = req.body;

        // Support both naming conventions to avoid "Failed to save address" errors
        const finalName = name || fullName;
        const finalPhone = phoneNumber || phone;
        const finalStreet = street || addressLine;
        const finalPostalCode = postalCode || pincode;

        if (!finalName || !finalPhone || !finalStreet || !city || !state || !finalPostalCode) {
            return res.status(400).json({ message: "Missing required address fields" });
        }

        // If this address is set as default, unset other default addresses for this user
        if (isDefault) {
            await prisma.address.updateMany({
                where: { userId, isDefault: true },
                data: { isDefault: false }
            });
        }

        const address = await prisma.address.create({
            data: {
                userId,
                name: finalName,
                phoneNumber: finalPhone,
                street: finalStreet,
                city,
                state,
                postalCode: finalPostalCode,
                country: country || "India",
                isDefault: isDefault || false
            }
        });

        res.status(201).json({ message: "Address added successfully", address });
    } catch (err: any) {
        console.error("Error adding address:", err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

export const getUserAddresses = async (req: RequestWithUser, res: Response) => {
    try {
        const userId = req.user._id;
        const addresses = await prisma.address.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({ addresses });
    } catch (err: any) {
        console.error("Error fetching addresses:", err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

export const updateAddress = async (req: RequestWithUser, res: Response) => {
    try {
        const addressId = req.params.id;
        const userId = req.user._id;

        const { 
            name, fullName, 
            phoneNumber, phone, 
            street, addressLine, 
            city, 
            state, 
            postalCode, pincode, 
            country, 
            isDefault 
        } = req.body;

        if (isDefault === true) {
            await prisma.address.updateMany({
                where: { userId, isDefault: true },
                data: { isDefault: false }
            });
        }

        const updateData: any = {};
        if (name || fullName) updateData.name = name || fullName;
        if (phoneNumber || phone) updateData.phoneNumber = phoneNumber || phone;
        if (street || addressLine) updateData.street = street || addressLine;
        if (city) updateData.city = city;
        if (state) updateData.state = state;
        if (postalCode || pincode) updateData.postalCode = postalCode || pincode;
        if (country) updateData.country = country;
        if (isDefault !== undefined) updateData.isDefault = isDefault;

        const updateResult = await prisma.address.updateMany({
            where: { id: addressId, userId },
            data: updateData
        });

        if (updateResult.count === 0) {
            return res.status(404).json({ message: 'Address not found or unauthorized' });
        }

        const updatedAddress = await prisma.address.findUnique({ where: { id: addressId } });
        res.status(200).json({ message: 'Address updated successfully', address: updatedAddress });
    } catch (err: any) {
        console.error("Error updating address:", err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

export const deleteAddress = async (req: RequestWithUser, res: Response) => {
    try {
        const addressId = req.params.id;
        const userId = req.user._id;
        const deleteResult = await prisma.address.deleteMany({
            where: { id: addressId, userId }
        });
        if (deleteResult.count === 0) {
            return res.status(404).json({ message: 'Address not found or unauthorized' });
        }
        res.status(200).json({ message: 'Address deleted successfully' });
    } catch (err: any) {
        console.error("Error deleting address:", err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};