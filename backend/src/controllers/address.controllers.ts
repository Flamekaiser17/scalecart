import Address from '../models/address.models.js';
import { Request, Response } from 'express';
import { Document } from 'mongoose';

interface IAddress {
    _id: string;
    userId: string;
    name: string;
    phoneNumber: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
    save: () => Promise<Document>;
}

type AddressDocument = Document & IAddress;

interface RequestWithUser extends Request {
    user: {
        _id: string;
        id?: string;
    };
}

export const addAddress = async (req: RequestWithUser, res: Response) => {
    const userId = req.user._id;
    const { name, phoneNumber, street, city, state, postalCode, country } = req.body;

    const newAddress = new Address({
        userId,
        name,
        phoneNumber,
        street,
        city,
        state,
        postalCode,
        country,
    });

    await newAddress.save();

    res.status(201).json({ message: "Address added successfully", address: newAddress });
};

export const getUserAddresses = async (req: RequestWithUser, res: Response) => {
    const userId = req.user._id;

    const addresses = await Address.find({ userId });

    res.status(200).json({ addresses });
};

export const updateAddress = async (req: RequestWithUser, res: Response) => {
    try {
        const addressId = req.params.id;
        const userId = req.user.id || req.user._id; // handle both id and _id

        const address = await Address.findOne({ _id: addressId, userId }) as AddressDocument;

        if (!address) {
            return res.status(404).json({ message: 'Address not found' });
        }

        // Update the fields
        Object.assign(address, req.body);
        const updated = await address.save();

        res.status(200).json({ message: 'Address updated successfully', address: updated });
    } catch (err: any) {
        console.error("Error updating address:", err);
        res.status(500).json({ message: 'Server error' });
    }
};

export const deleteAddress = async (req: RequestWithUser, res: Response) => {
    try {
        const addressId = req.params.id;
        const userId = req.user._id;

        const address = await Address.findOneAndDelete({ _id: addressId, userId });

        if (!address) {
            return res.status(404).json({ message: 'Address not found' });
        }

        res.status(200).json({ message: 'Address deleted successfully' });
    } catch (err: any) {
        console.error("Error deleting address:", err);
        res.status(500).json({ message: 'Server error' });
    }
}; 