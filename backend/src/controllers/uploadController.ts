import cloudinary from "@/utils/cloudinary";
import { sendError } from "@/utils/errorResponse";
import { FastifyReply, FastifyRequest } from "fastify";

const uploadImage = async (req: FastifyRequest, res: FastifyReply) => {
    try {
        const file = await req.file(); // Multer is not used in Fastify, use fastify-multer or fastify-multipart
        if (!file) {
            return sendError(res, 400, "No file uploaded.");
        }

        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (!allowedTypes.includes(file.mimetype)) {
            return sendError(res, 400, "Unsupported file type.");
        }

        if (file.file.bytesRead > 5 * 1024 * 1024) {
            return sendError(res, 400, "File size exceeds 5MB limit.");
        }

        const resourceType = file.mimetype === 'application/pdf' ? 'raw' : 'image';

        // Read buffer from file.stream
        const buffer = await file.toBuffer();

        const uploadedUrl = await new Promise<string>((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    resource_type: resourceType,
                    folder: 'service',
                    public_id: `${Date.now()}_${file.filename}_${Math.random().toString(36).substring(2, 15)}`
                },
                (error, result) => {
                    if (error || !result) return reject(error);
                    resolve(result.secure_url);
                }
            );

            stream.end(buffer);
        });

        return res.status(200).send({
            message: "File uploaded successfully.",
            success: true,
            data: {
                filename: file.filename,
                mimetype: file.mimetype,
                size: file.file.bytesRead,
                url: uploadedUrl,
            },
        });

    } catch (error) {
        console.error("Upload error:", error);
        return res.status(500).send({
            message: "Internal server error.",
            success: false,
        });
    }
};

export { uploadImage };