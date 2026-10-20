/**
 * @file markdb.ts
 * Provides the public API for opening and creating MarkDB files.
 *
 * This module coordinates the lifecycle of a MarkDB instance, from
 * validating the supplied options and resolving the storage adapter
 * to initializing and registering the resulting instance.
 *
 * The `openMarkDB()` function normalizes file paths, checks the registry
 * for previously opened instances, and creates new files when explicitly
 * permitted. Before returning a new instance, it validates the file's
 * structure and declared format, initializes the appropriate storage
 * implementation, and verifies its health.
 *
 * MarkDB supports three storage formats:
 * - `json`: Stores data in JSON format.
 * - `database`: Stores records validated against a defined schema.
 * - `file`: Stores data using the file-based format.
 *
 * Instances are registered only after successful initialization,
 * allowing subsequent calls to reuse existing instances and avoid
 * unnecessary reinitialization of the same file.
 *
 * @module markdb
 */

import { assertRegularFile, normalizeMarkDBPath, readContents, resolveAdapter, writeContents } from "./helper";
import { MarkDBError, MarkDBFileNotFoundError, MarkDBFormatMismatchError, MarkDBInvalidPathError, MarkDBSchemaError } from "./error";
import type { MarkDBFormat, MarkDBStorageContext, RecordSchema } from "./types";
import { parseHeader, makeHeader } from "./parser";
import { markDBRegistry } from "./registry";

import { JsonMarkDB, makeJsonBody } from "./markdb-json";
import { DatabaseMarkDB, makeDatabaseBody } from "./markdb-database";
import { FileMarkDB, makeFileBody } from "./markdb-file";


type MarkDBInstance = JsonMarkDB | DatabaseMarkDB | FileMarkDB;
export interface MarkDBOptions {
    format: MarkDBFormat;
    create?: boolean;
    schema?: RecordSchema;
}


/**
 * Builds the initial contents of a MarkDB file for the specified format.
 *
 * Prepends the format header to the corresponding format-specific body,
 * ensuring the new file can be identified and validated when opened.
 *
 * @param format - Storage format to initialize (`json`, `database`, or `file`).
 * @returns The complete serialized contents of the new MarkDB file.
 */
function makeInitialContents(format: MarkDBFormat, schema?: RecordSchema): string {
    switch (format) {
        case "json": 
            return makeHeader(format) + makeJsonBody({});

        case "database": 
            return makeHeader(format) + makeDatabaseBody([], schema);
            
        case "file": 
            return makeHeader(format) + makeFileBody("");
    }
}

/**
 * Opens a JSON-format MarkDB file or creates one if it does not exist
 * and creation is enabled.
 *
 * @param context - Storage context used to access the file.
 * @param path - Path to the MarkDB file.
 * @param options - Opening options with `format` set to `"json"`.
 * @returns A promise that resolves to an initialized `JsonMarkDB` instance.
 */
function openMarkDB(
    context: MarkDBStorageContext,
    path: string,
    options: MarkDBOptions & { format: "json" },
): Promise<JsonMarkDB>;

/**
 * Opens a database-format MarkDB file or creates one if it does not
 * exist and creation is enabled.
 *
 * A record schema is required to validate records stored in this format.
 *
 * @param context - Storage context used to access the file.
 * @param path - Path to the MarkDB file.
 * @param options - Opening options with `format` set to `"database"`
 * and the required record schema.
 * @returns A promise that resolves to an initialized `DatabaseMarkDB` instance.
 */
function openMarkDB<T>(
    context: MarkDBStorageContext,
    path: string,
    options: MarkDBOptions & {
        format: "database";
        schema: RecordSchema<T>;
    },
): Promise<DatabaseMarkDB<T>>;

/**
 * Opens a file-format MarkDB file or creates one if it does not exist
 * and creation is enabled.
 *
 * @param context - Storage context used to access the file.
 * @param path - Path to the MarkDB file.
 * @param options - Opening options with `format` set to `"file"`.
 * @returns A promise that resolves to an initialized `FileMarkDB` instance.
 */
function openMarkDB(
    context: MarkDBStorageContext,
    path: string,
    options: MarkDBOptions & { format: "file" },
): Promise<FileMarkDB>;

/**
 * Opens a MarkDB file or creates it if it does not exist and creation is enabled.
 *
 * Validates the supplied options and path, resolves the storage adapter,
 * and checks the registry for an existing instance. If no instance is
 * registered, it creates the file when permitted, validates its header
 * and format, initializes the corresponding implementation, and checks
 * its health before registering it.
 *
 * @param context - Storage context used to access the file.
 * @param path - Path to the MarkDB file; must use the `.mdb` extension.
 * @param options - Options specifying the format, creation behavior, and optional schema.
 * @returns A promise resolving to the initialized MarkDB instance.
 *
 * @throws {MarkDBInvalidPathError} If the path or storage context is invalid.
 * @throws {MarkDBFileNotFoundError} If the file does not exist and creation is disabled.
 * @throws {MarkDBFormatMismatchError} If the existing file format differs from the requested format.
 * @throws {MarkDBSchemaError} If the `database` format is selected without a schema.
 * @throws {MarkDBError} If the options are missing or the requested format is unsupported.
 */
async function openMarkDB(
    context: MarkDBStorageContext,
    path: string,
    options: MarkDBOptions,
): Promise<MarkDBInstance> {
    // Validate the supplied arguments.
    if (!context || typeof context !== "object") {
        throw new MarkDBInvalidPathError(
            "A valid MarkDB storage context is required.",
        );
    }

    if (typeof path !== "string" || path.trim() === "") {
        throw new MarkDBInvalidPathError(
            "A non-empty MarkDB path is required.",
        );
    }

    if (!options || typeof options !== "object") {
        throw new MarkDBError("MarkDB options are required.");
    }

    if (
        options.format !== "json" &&
        options.format !== "database" &&
        options.format !== "file"
    ) {
        throw new MarkDBError(
            `Unsupported MarkDB format: ${String(options.format)}`,
        );
    }

    if (options.format === "database" && !options.schema) {
        throw new MarkDBSchemaError(
            'The "database" format requires a record schema.',
        );
    }

    // Resolve the adapter and normalize the path.
    const adapter = resolveAdapter(context);
    const resolvedPath = normalizeMarkDBPath(path);

    if (!resolvedPath.endsWith(".mdb")) {
        throw new MarkDBInvalidPathError(
            `MarkDB files must use the .mdb extension: ${path}`,
            path,
        );
    }

    // Reuse an existing instance when its format matches.
    const existing = markDBRegistry.get(resolvedPath);

    if (existing) {
        const matchesFormat =
            (options.format === "json" &&
                existing instanceof JsonMarkDB) ||
            (options.format === "database" &&
                existing instanceof DatabaseMarkDB) ||
            (options.format === "file" &&
                existing instanceof FileMarkDB);

        if (!matchesFormat) {
            throw new MarkDBFormatMismatchError(
                `The requested format "${options.format}" does not match the already-open instance.`,
            );
        }

        return existing;
    }

    // Create the file only when explicitly permitted.
    const exists = await adapter.exists(resolvedPath);

    if (!exists) {
        if (options.create !== true) {
            throw new MarkDBFileNotFoundError(
                `MarkDB file not found: ${resolvedPath}`,
            );
        }

        await writeContents(
            adapter,
            resolvedPath,
            makeInitialContents(options.format, options.schema),
        );
    }

    // Validate the file and its declared format.
    await assertRegularFile(adapter, resolvedPath);
    const contents = await readContents(adapter, resolvedPath);
    const { header } = parseHeader(contents);

    if (header.format !== options.format) {
        throw new MarkDBFormatMismatchError(
            `Expected format "${options.format}", but found "${header.format}" in "${resolvedPath}".`,
        );
    }

    // Construct the implementation for the requested format.
    let instance: MarkDBInstance;
    
    if (options.format === "json") {
        instance = new JsonMarkDB(adapter, resolvedPath);

    } else if (options.format === "database") {
        instance = new DatabaseMarkDB(adapter, resolvedPath, options.schema!);
    
    } else {
        instance = new FileMarkDB(adapter, resolvedPath);
    }

    // Register the instance only after its health check succeeds.
    await instance.checkHealth();
    markDBRegistry.register(resolvedPath, options.format, instance);
    return instance;
}

export { openMarkDB };
