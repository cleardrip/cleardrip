// utils/parseMultipartData.ts
import { FastifyRequest } from "fastify";
import { MultipartFile, MultipartValue } from "@fastify/multipart";

export const parseMultipartData = async (req: FastifyRequest) => {
    const parts = req.parts();
    const fields: Record<string, any> = {};
    const files: MultipartFile[] = [];

    for await (const part of parts) {
        if ('file' in part && part.file) {
            files.push(part as MultipartFile);
        } else {
            const fieldPart = part as MultipartValue;
            fields[part.fieldname] = fieldPart.value;
        }
    }
    console.log(`\n\nParsed files: ${JSON.stringify(files)}`);
    console.log(`Parsed file lengths: ${files.length}`);
    return { fields, files };
};
