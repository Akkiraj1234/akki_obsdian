import { z } from "zod";

/**
 * Defines the validation schema for hobby records stored in MarkDB.
 * Each record represents a hobby with its identifying details, category,
 * description, display color, and creation and modification timestamps.
 * Supports optional parent-child relationships through `parentId`,
 * allowing hobbies to be organized hierarchically.
 * Strict validation ensures that records contain only the defined fields.
 */
export const hobbySchema = z.strictObject({
    hobbyId: z.string().min(1).max(64),
    name: z.string().trim().min(1).max(30),
    description: z.string().max(200),
    category: z.string().trim().min(1).max(30),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    parentId: z.string().max(64).nullable(),
});


export type Hobby = z.infer<typeof hobbySchema>;