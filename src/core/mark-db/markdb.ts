import { assertRegularFile, normalizeMarkDBPath, readContents, resolveAdapter, writeContents } from "./helper"
import { MarkDBStorageContext, MarkDBInvalidPathError, MarkDBSchemaError, MarkDBError, MarkDBFormatMismatchError, MarkDBFileNotFoundError } from "./types"
import type { RecordSchema, MarkDBFormat } from "./types";
import { markDBRegistry } from "./registry"
import { parseHeader } from "./parser";

import { JsonMarkDB } from "./json-markdb";
import { DatabaseMarkDB } from "./database-markdb";
import { FileMarkDB } from "./file-markdb";
import { registry } from "zod/v4/core";



type MarkDBInstance = JsonMarkDB | DatabaseMarkDB | FileMarkDB;
export interface MarkDBOptions<T = unknown> {
    format: MarkDBFormat;
    create?: boolean;
    schema?: RecordSchema;
}


/**
 * Creates the initial contents for a new MarkDB file.
 *
 * The file header records its format so that opening the file
 * later can verify that the requested format matches.
 */
function makeInitialContents(
    format: MarkDBOptions["format"],
    blockSize: number,
): string {
    if (format === "json") {
        return makeHeader(format) + "null\n";
    }

    if (format === "database") {
        return makeHeader(format) + makeDatabaseBody([]);
    }

    return makeHeader(format) + makeFileBody(blockSize);
}



/**
 * Opens an existing JSON MarkDB file or creates it when permitted.
 *
 * @param context Storage context used to access the file.
 * @param path Path to the MarkDB file.
 * @param options Opening and creation options.
 * @returns An initialized JSON MarkDB instance.
 * @throws MarkDBInvalidPathError If the path is invalid.
 * @throws MarkDBFileNotFoundError If the file is missing and creation is disabled.
 * @throws MarkDBFormatMismatchError If the existing file uses another format.
 */
function openMarkDB(
    context: MarkDBStorageContext,
    path: string,
    options: MarkDBOptions & { format: "json" },
): Promise<JsonMarkDB>;

/**
 * Opens an existing database MarkDB file or creates it when permitted.
 *
 * A record schema is mandatory for this format.
 *
 * @param context Storage context used to access the file.
 * @param path Path to the MarkDB file.
 * @param options Database options, including the record schema.
 * @returns An initialized Database MarkDB instance.
 */
function openMarkDB(
    context: MarkDBStorageContext,
    path: string,
    options: MarkDBOptions & { format: "database"; schema: RecordSchema },
): Promise<DatabaseMarkDB>;

/**
 * Opens an existing file MarkDB file or creates it when permitted.
 *
 * @param context Storage context used to access the file.
 * @param path Path to the MarkDB file.
 * @param options Opening and creation options.
 * @returns An initialized File MarkDB instance.
 */
function openMarkDB(
    context: MarkDBStorageContext,
    path: string,
    options: MarkDBOptions & { format: "file" },
): Promise<FileMarkDB>;


/**
 * Opens or creates a MarkDB file.
 *
 * Opening follows this sequence:
 *
 * 1. Validate the supplied arguments and format-specific options.
 * 2. Resolve the storage adapter and normalize the path.
 * 3. Reuse a compatible instance if the file is already open.
 * 4. Create the file when it is missing and creation is enabled.
 * 5. Verify that the target is a regular file.
 * 6. Read and validate its header and requested format.
 * 7. Construct the appropriate implementation.
 * 8. Check the instance's health before registering it.
 *
 * The registry contains only successfully initialized instances.
 *
 * @param context Storage context used to access the file.
 * @param path Path to the MarkDB file.
 * @param options Opening and creation options.
 * @returns The initialized MarkDB instance matching the requested format.
 */
async function openMarkDB(
    context: MarkDBStorageContext,
    path: string,
    options: MarkDBOptions,
): Promise<JsonMarkDB | DatabaseMarkDB | FileMarkDB> {

    // 1. Validate arguments.
    if (!context || typeof context !== "object") {
        throw new MarkDBInvalidPathError(
            "A valid MarkDB storage context is required."
        );
    }

    if (typeof path !== "string" || path.trim() === "") {
        throw new MarkDBInvalidPathError(
            "A non-empty MarkDB path is required.",
        );
    }

    if (!options || typeof options !== "object") {
        throw new MarkDBError(
            "MarkDB options are required.",
        );
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

    // 2. Resolve the adapter and normalize the path.
    const adapter = resolveAdapter(context);
    const resolved_path = normalizeMarkDBPath(path);

    if (!resolved_path.endsWith(".mdb")) {
        throw new MarkDBInvalidPathError(
            `MarkDB files must use the .mdb extension: ${path}`,
            path
        )
    } 

    // 3. Reuse an instance already opened for this context and path.
    const existing = markDBRegistry.get(resolved_path);

    if (existing) {
        const matchesFormat = 
            (options.format === "json" && existing instanceof JsonMarkDB) ||
            (options.format === "database" && existing instanceof DatabaseMarkDB) ||
            (options.format === "file" && existing instanceof FileMarkDB);

        if (!matchesFormat) {
            throw new MarkDBFormatMismatchError(
                `The requested format "${options.format}" does not match the already-open instance.`
            );
        }
        return existing;
    }

    // 4. Create a missing file only when explicitly allowed.
    const exist = await adapter.exists(resolved_path);

    if (!exist) {
        if (options.create !== true) {
            throw new MarkDBFileNotFoundError(
                `MarkDB file not found: ${resolvedPath}`,
            );
        }

        await writeContents(
            adapter,
            resolved_path,
            makeInitialContents(options.format)
        )
    }

    // 5. Ensure the target is a regular file.
    // 6. Read the file and validate its header.
    await assertRegularFile(adapter, resolved_path);
    const content = await readContents(adapter, resolved_path);
    const { header } = parseHeader(content);

    if (header.format !== options.format) {
        throw new MarkDBFormatMismatchError(
            `Expected format "${options.format}", but found "${header.format}" in "${resolvedPath}".`,
        );
    }

    // 7. Construct the implementation for the requested format.
    let instance: MarkDBInstance;

    if (options.format === "json") {
        instance = new JsonMarkDB(adapter, resolved_path);
    } else if (options.format === "database") {
        instance = new DatabaseMarkDB(adapter, resolved_path, options.schema!);
    } else {
        instance = new FileMarkDB(adapter, resolved_path);
    }

    // 8. Register only after initialization succeeds.
    await instance.checkHealth();
    registry.set(resolved_path, instance);
    return instance;    
}

export { openMarkDB };