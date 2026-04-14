import "../loadEnv.js";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import fs from "fs";
import { extractPublicId } from "cloudinary-build-url";


// Configuration with explicit type checking
const config = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
};

cloudinary.config(config);

//console.log("Cloudinary config at upload:", cloudinary.config());

const uploadOnCloudinary = async (
    localFilePath: string,
    path: string
): Promise<UploadApiResponse | null> => {
    try {
        if (!localFilePath) {
            console.error("No local file path provided");
            return null;
        }

        if (!fs.existsSync(localFilePath)) {
            console.error(`File does not exist at path: ${localFilePath}`);
            return null;
        }

        console.log("Attempting to upload file to Cloudinary...");
        //upload on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            folder: path,
            resource_type: "auto"
        });

        //file uploaded successfully
        fs.unlinkSync(localFilePath); //remove the locally saved temp file
        console.log("File uploaded successfully to Cloudinary:", response.secure_url);
        
        return response;
    } catch (error) {
        console.error("Error uploading to Cloudinary:", error);
        // Only try to delete the file if it exists
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return null;
    }
};

const deleteFromCloudinary = async (
    cloudinaryUrl: string,
    path: string
): Promise<any> => {
    try {
        if (!cloudinaryUrl) {
            throw new Error('Cloudinary URL is required');
        }
        //get publicId
        const publicId = extractPublicId(cloudinaryUrl);

        //destroy
        const response = await cloudinary.uploader.destroy(publicId);

        console.log('Successfully deleted:', publicId);
        return response;
    } catch (error: any) {
        console.error('Error deleting from Cloudinary:', error.message);
        throw error;
    }
};

export { uploadOnCloudinary, deleteFromCloudinary }; 