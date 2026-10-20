import type { App, DataAdapter, Vault } from "obsidian";

import { normalizeMarkDBPath, resolveAdapter } from "./helper"
import { MarkDBStorageContext, MarkDBInvalidPathError } from "./types"
import type { MarkDBOptions, RecordSchema } from "./types";

import { JsonMarkDB } from "./json-markdb";
import { DatabaseMarkDB } from "./database-markdb";
import { FileMarkDB } from "./file-markdb";


/**
 * Opens a JSON MarkDB file.
 *
 * @param context - The Obsidian application, vault, or data adapter.
 * @param path - The vault-relative path to the MarkDB file.
 * @param options - Configuration options specifying the JSON format.
 * @returns The opened JSON MarkDB instance.
 */
async function openMarkDB(
    context: MarkDBStorageContext,
    path: string,
    options: MarkDBOptions & {
        format: "json";
    },
): Promise<JsonMarkDB>;

/**
 * Opens a database MarkDB file.
 *
 * @param context - The Obsidian application, vault, or data adapter.
 * @param path - The vault-relative path to the MarkDB file.
 * @param options - Configuration options specifying the database format and record schema.
 * @returns The opened database MarkDB instance.
 */
async function openMarkDB(
    context: MarkDBStorageContext,
    path: string,
    options: MarkDBOptions & {
        format: "database";
        schema: RecordSchema;
    },
): Promise<DatabaseMarkDB>;

/**
 * Opens a file MarkDB file.
 *
 * @param context - The Obsidian application, vault, or data adapter.
 * @param path - The vault-relative path to the MarkDB file.
 * @param options - Configuration options specifying the file format.
 * @returns The opened file MarkDB instance.
 */
async function openMarkDB(
    context: MarkDBStorageContext,
    path: string,
    options: MarkDBOptions & {
        format: "file";
    },
): Promise<FileMarkDB>;

/**
 * Opens a MarkDB file using the specified format.
 *
 * Resolves the Obsidian storage adapter, normalizes the file path, and checks
 * whether the file exists. If the file does not exist, it creates the file
 * when creation is allowed; otherwise, it throws an error.
 *
 * Validates that the path points to a regular file and that its declared
 * format matches the requested format. It then validates the file's contents
 * and checks its health before returning the corresponding MarkDB instance.
 *
 * If an instance for the same file is already registered, the existing
 * instance is returned instead of creating a duplicate.
 *
 * @param context - The Obsidian application, vault, or data adapter used for storage.
 * @param path - The vault-relative path to the MarkDB file.
 * @param options - Configuration specifying the file format, creation behavior,
 *                  and any format-specific options.
 * @returns The validated MarkDB instance matching the requested format.
 * @throws {MarkDBInvalidPathError} If the file path is invalid.
 * @throws {MarkDBFileNotFoundError} If the file does not exist and creation is disabled.
 * @throws {MarkDBFormatMismatchError} If the existing file's format differs from the requested format.
 * @throws {MarkDBCorruptionError} If the file's contents or metadata are invalid.
 */
async function openMarkDB(
    context: MarkDBStorageContext,
    path: string,
    options: MarkDBOptions,
): Promise<JsonMarkDB | DatabaseMarkDB | FileMarkDB> {

    const adapter = resolveAdapter(context)
    const resolved_path = normalizeMarkDBPath(path);

    // we should check if file have some prefix or not if not then try to look with ".mdb"
    if (!resolved_path.endsWith(".mdb")) {
        throw new MarkDBInvalidPathError(
            `MarkDB files must use the .mdb extension: ${path}`,
            path
        )
    }

    // 2. check if file path instance already exists or not

    if (options.format === "database" && !options.schema) {
        throw new MarkDBSchemaError(
            "A Zod schema is required for database files.",
            path,
        );
    }
    
    if (
        options.format === "file" && 
        ()
    )
}

export { openMarkDB };