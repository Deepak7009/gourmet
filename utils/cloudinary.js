const cloudinary = require("cloudinary").v2;
const fs = require("fs");

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
    // console.log("file is uploaded successfully", response.url);
    return response;
  } catch (error) {
    fs.unlink(localFilePath);
    return null;
  }
};

module.exports = { uploadOnCloudinary };
