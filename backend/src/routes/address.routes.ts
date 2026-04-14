import express from "express";
import {
    addAddress,
    getUserAddresses,
    updateAddress,
    deleteAddress
} from '../controllers/address.controllers.js';
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { Request, Response, RequestHandler } from "express";

const router = express.Router();

interface RequestWithUser extends Request {
    user: {
        _id: string;
        id?: string;
    };
}

const wrapHandler = (handler: (req: RequestWithUser, res: Response) => Promise<any>): RequestHandler => {
    return (req: Request, res: Response) => handler(req as RequestWithUser, res);
};

router.route("/address")
    .post(verifyJWT, wrapHandler(addAddress));

router.route("/addresses")
    .get(verifyJWT, wrapHandler(getUserAddresses));

router.route("/address/:id")
    .put(verifyJWT, wrapHandler(updateAddress))
    .delete(verifyJWT, wrapHandler(deleteAddress));

export default router; 