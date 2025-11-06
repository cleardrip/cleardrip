import { FastifyReply, FastifyRequest } from "fastify";
import { logger } from "@/lib/logger";
import { productSchema, productUpdateSchema } from "@/schemas/product.schema";
import { createProduct, deleteProduct, getAllProducts, getProductById, updateProduct } from "@/services/product.service";
import { sendError } from "@/utils/errorResponse";
import { parsePagination } from "@/utils/parsePagination";

interface ProductQueryParams {
    search?: string;
}

export const getAllProductsHandler = async (req: FastifyRequest<{ Querystring: ProductQueryParams }>, reply: FastifyReply) => {
    try {
        const { take, skip } = parsePagination(req.query);
        const searchTerm = req.query.search;
        // decode URI components
        const products = await getAllProducts(
            take,
            skip,
            decodeURIComponent(searchTerm ?? "")
        );
        return reply.code(200).send(products);
    } catch (error) {
        logger.error(error, "Get all products error");
        return sendError(reply, 500, "Get all products failed", error);
    }
};

export const getProductByIdHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    try {
        const product = await getProductById(id);
        if (!product) {
            return reply.code(404).send({ error: "Product not found" });
        }
        return reply.code(200).send(product);
    } catch (error) {
        logger.error(error, "Get product by ID error");
        return sendError(reply, 500, "Get product by ID failed", error);
    }
}

export const createProductHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    const productData = productSchema.parse(req.body);
    try {
        const product = await createProduct(productData);
        return reply.code(201).send(product);
    } catch (error) {
        logger.error(error, "Create product error");
        return sendError(reply, 500, "Create product failed", error);
    }
};

export const updateProductHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const productData = productUpdateSchema.parse(req.body);
    try {
        const existingProduct = await getProductById(id);
        if (!existingProduct) {
            return reply.code(404).send({ error: "Product not found" });
        }
        const product = await updateProduct(id, productData);
        return reply.code(200).send({
            message: "Product updated successfully",
            product
        });
    } catch (error) {
        logger.error(error, "Update product error");
        return sendError(reply, 500, "Update product failed", error);
    }
};

export const deleteProductHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    try {
        const existingProduct = await getProductById(id);
        if (!existingProduct) {
            return reply.code(404).send({ error: "Product not found" });
        }
        const deletedProduct = await deleteProduct(id);
        return reply.code(200).send({ message: "Product deleted successfully", product: deletedProduct });
    } catch (error) {
        logger.error(error, "Delete product error");
        return sendError(reply, 500, "Delete product failed", error);
    }
};