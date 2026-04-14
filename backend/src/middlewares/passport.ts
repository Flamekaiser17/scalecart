// import passport from "passport";
// import { Strategy as GoogleStrategy } from "passport-google-oauth20";
// import { Strategy as FacebookStrategy } from "passport-facebook";
// import User from "../models/user.models.js";
// import { Profile as GoogleProfile } from "passport-google-oauth20";
// import { Profile as FacebookProfile } from "passport-facebook";

// interface UserDocument {
//     _id: string;
//     googleId?: string;
//     facebookId?: string;
//     firstName: string;
//     lastName: string;
//     email: string;
// }

// // Serialize user
// passport.serializeUser((user: any, done) => {
//     done(null, user._id);
// });

// // Deserialize user
// passport.deserializeUser(async (id: string, done) => {
//     const user = await User.findById(id);
//     done(null, user);
// });

// // Google Strategy
// passport.use(
//     new GoogleStrategy(
//         {
//             clientID: process.env.GOOGLE_CLIENT_ID as string,
//             clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
//             callbackURL: "/api/v1/auth/google/callback",
//         },
//         async (accessToken: string, refreshToken: string, profile: any, done) => {
//             try {
//                 // Check if user exists
//                 let user = await User.findOne({ googleId: profile.id });

//                 if (!user) {
//                     // Create a new user
//                     user = await User.create({
//                         googleId: profile.id,
//                         firstName: profile._json.given_name || "",
//                         lastName: profile._json.family_name || "",
//                         email: profile._json.email || "",
//                     });
//                 }

//                 done(null, user);
//             } catch (error) {
//                 done(error, null);
//             }
//         }
//     )
// );

// // Facebook Strategy
// passport.use(
//     new FacebookStrategy(
//         {
//             clientID: process.env.FACEBOOK_CLIENT_ID as string,
//             clientSecret: process.env.FACEBOOK_CLIENT_SECRET as string,
//             callbackURL: "/api/v1/auth/facebook/callback",
//             profileFields: ["id", "emails", "name"],
//         },
//         async (accessToken: string, refreshToken: string, profile: any, done) => {
//             try {
//                 // Check if user exists
//                 let user = await User.findOne({ facebookId: profile.id });

//                 if (!user) {
//                     // Create a new user
//                     user = await User.create({
//                         facebookId: profile.id,
//                         firstName: profile._json.first_name || "",
//                         lastName: profile._json.last_name || "",
//                         email: profile._json.email || "",
//                     });
//                 }

//                 done(null, user);
//             } catch (error) {
//                 done(error, null);
//             }
//         }
//     )
// );

// export default passport; 