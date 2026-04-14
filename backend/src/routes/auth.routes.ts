import { Router } from "express";
import passport from "passport";
import { Request, Response } from "express";
import { OAuth2Client } from 'google-auth-library';
import User from '../models/user.models.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const router: Router = Router();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Google Authentication
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// Google Callback
router.get(
    "/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    (req: Request, res: Response) => {
        res.redirect("/"); // Redirect to the frontend after successful login
    }
);

// Facebook Authentication
router.get("/facebook", passport.authenticate("facebook", { scope: ["email"] }));

// Facebook Callback
router.get(
    "/facebook/callback",
    passport.authenticate("facebook", { failureRedirect: "/login" }),
    (req: Request, res: Response) => {
        res.redirect("/"); // Redirect to the frontend after successful login
    }
);

router.post('/google-signin', async (req, res) => {
  const { idToken } = req.body;
  try {
    // 1. Verify Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload) throw new Error('Invalid Google token payload');
    const { email, given_name, family_name, picture } = payload;
    if (!email) {
      return res.status(400).json({ error: 'Google account does not have an email.' });
    }

    // 2. Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        username: email.split('@')[0] + crypto.randomBytes(2).toString('hex'),
        email,
        firstName: given_name || '',
        lastName: family_name || '',
        phoneNumber: '', // You may want to prompt for this later
        avatar: picture,
        password: crypto.randomBytes(16).toString('hex'), // random password
        isVerified: true,
      });
    }

    // 3. Issue your own JWT
    const accessToken = user.generateAccessToken();
    res.json({ token: accessToken, user });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    res.status(401).json({ error: 'Invalid Google token', details: errorMessage });
  }
});

export default router; 