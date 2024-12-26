const cloudinary = require("cloudinary").v2;
const fs = require("fs");

cloudinary.config({
  cloud_name: "dyhoapc9t",
  api_key: "988269748118134",
  api_secret: "28Po9OqYCgqo0GfSNerAkfpaO4E",
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
  // console.log("file is uploaded successfully", response.url);
    return response;
  } catch (error) {
    fs.unlink(localFilePath);
    return null;
  }
};

module.exports = { uploadOnCloudinary };
