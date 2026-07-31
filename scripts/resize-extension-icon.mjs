import sharp from "sharp";

await sharp("apps/extension/media/icon.png")
  .resize(128, 128)
  .png({ compressionLevel: 9 })
  .toFile("apps/extension/media/icon-128.png");

console.log("resized ok");
