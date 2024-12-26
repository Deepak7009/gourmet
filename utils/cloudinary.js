const cloudinary = require("cloudinary").v2;
const fs = require("fs").promises;

cloudinary.config({
  cloud_name: "dhdk9yop5",
  api_key: "126739441976649",
  api_secret: "hDe9rnUIzmc96__HGmP2-pkeJ6A",
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // Check if file exists before trying to delete it
    try {
      await fs.access(localFilePath); // Verifies if the file exists
      await fs.unlink(localFilePath); // Deletes the file if it exists
    } catch (accessError) {
      console.warn(`File ${localFilePath} does not exist or is already deleted.`);
    }

    return response;
  } catch (error) {
    console.error(`Cloudinary upload failed for ${localFilePath}:`, error);
    throw error;
  }
};

module.exports = { uploadOnCloudinary };