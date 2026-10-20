// import { DatabaseMarkDB, makeDatabaseBody } from "./databasemarkdb";
// import { DEFAULT_BLOCK_SIZE, FileMarkDB, makeFileBody } from "./filemarkdb";
// import { JsonMarkDB } from "./jsonmarkdb";
// import { makeHeader, parseHeader } from "./parser";
// import {
// 	assertRegularFile,
// 	normalizeMarkDBPath,
// 	readContents,
// 	resolveAdapter,
// 	writeContents,
// } from "./storage";
// import {
// 	MarkDBCorruptionError,
// 	MarkDBFileNotFoundError,
// 	MarkDBFormatMismatchError,
// 	MarkDBInvalidPathError,
// 	MarkDBSchemaError,
// } from "./types";
// import type {
// 	MarkDBOptions,
// 	MarkDBStorageContext,
// 	RecordSchema,
// } from "./types";






// export class MarkDB {
// 	static async open(
// 		context: MarkDBStorageContext,
// 		path: string,
// 		options: MarkDBOptions & { format: "json" },
// 	): Promise<JsonMarkDB>;

// 	static async open<T>(
// 		context: MarkDBStorageContext,
// 		path: string,
// 		options: MarkDBOptions<T> & {
// 			format: "database";
// 			schema: RecordSchema<T>;
// 		},
// 	): Promise<DatabaseMarkDB<T>>;

// 	static async open(
// 		context: MarkDBStorageContext,
// 		path: string,
// 		options: MarkDBOptions & { format: "file" },
// 	): Promise<FileMarkDB>;

// 	static async open<T>(
// 		context: MarkDBStorageContext,
// 		requestedPath: string,
// 		options: MarkDBOptions<T>,
// 	): Promise<JsonMarkDB | DatabaseMarkDB<T> | FileMarkDB> {
// 		const adapter = resolveAdapter(context);
// 		const path = normalizeMarkDBPath(requestedPath);

// 		if (!path.endsWith(".mdb")) {
// 			throw new MarkDBInvalidPathError(
// 				`MarkDB files must use the .mdb extension: ${path}`,
// 				path,
// 			);
// 		}

// 		if (options.format === "database" && !options.schema) {
// 			throw new MarkDBSchemaError(
// 				"A Zod schema is required for database files.",
// 				path,
// 			);
// 		}

// 		const blockSize = options.blockSize ?? DEFAULT_BLOCK_SIZE;

// 		if (
// 			options.format === "file" &&
// 			(!Number.isSafeInteger(blockSize) || blockSize <= 0)
// 		) {
// 			throw new MarkDBCorruptionError(
// 				"Block size must be a positive integer.",
// 				path,
// 			);
// 		}

// 		if (!(await adapter.exists(path))) {
// 			if (!options.create) {
// 				throw new MarkDBFileNotFoundError(
// 					`MarkDB file does not exist: ${path}`,
// 					path,
// 				);
// 			}

// 			await writeContents(
// 				adapter,
// 				path,
// 				makeInitialContents(options.format, blockSize),
// 			);
// 		}

// 		await assertRegularFile(adapter, path);

// 		const contents = await readContents(adapter, path);
// 		const { header } = parseHeader(contents);

// 		if (header.format !== options.format) {
// 			throw new MarkDBFormatMismatchError(
// 				`Expected ${options.format} MarkDB file, found ${header.format}.`,
// 				path,
// 			);
// 		}

// 		let database: JsonMarkDB | DatabaseMarkDB<T> | FileMarkDB;

// 		if (options.format === "json") {
// 			database = new JsonMarkDB(adapter, path);
// 		} else if (options.format === "database") {
// 			database = new DatabaseMarkDB(
// 				adapter,
// 				path,
// 				options.schema as RecordSchema<T>,
// 			);
// 		} else {
// 			database = new FileMarkDB(adapter, path, blockSize);
// 		}

// 		await database.checkHealth();

// 		return database;
// 	}
// }

// function makeInitialContents(
// 	format: MarkDBOptions["format"],
// 	blockSize: number,
// ): string {
// 	if (format === "json") {
// 		return makeHeader(format) + "null\n";
// 	}

// 	if (format === "database") {
// 		return makeHeader(format) + makeDatabaseBody([]);
// 	}

// 	return makeHeader(format) + makeFileBody(blockSize);
// }



import {
    assertRegularFile,
    normalizeMarkDBPath,
    readContents,
    resolveAdapter,
    writeContents,
} from "./helper";

import {
    MarkDBError,
    MarkDBFileNotFoundError,
    MarkDBFormatMismatchError,
    MarkDBInvalidPathError,
    MarkDBSchemaError,
    MarkDBStorageContext,
} from "./types";

import type {
    MarkDBFormat,
    RecordSchema,
} from "./types";

import { JsonMarkDB } from "./json-markdb";
import { DatabaseMarkDB } from "./database-markdb";
import { FileMarkDB } from "./file-markdb";

import { parseHeader } from "../markdb/parser";

/**
 * Options accepted when opening or creating a MarkDB file.
 */
export interface MarkDBOptions {
    /**
     * Expected file format.
     *
     * Existing files must use this format. Newly created files
     * are initialized using this format.
     */
    format: MarkDBFormat;

    /**
     * Whether a missing file may be created.
     *
     * Defaults to false.
     */
    create?: boolean;

    /**
     * Schema used to validate database records.
     *
     * Required when format is "database".
     */
    schema?: RecordSchema;
}

/**
 * Represents any supported MarkDB implementation.
 */
type MarkDBInstance =
    | JsonMarkDB
    | DatabaseMarkDB
    | FileMarkDB;

/**
 * Stores successfully opened instances so repeated calls can
 * reuse an existing instance instead of opening the same file again.
 *
 * The key must include the storage context and normalized path.
 * This implementation assumes the context has a stable identity.
 */
const openInstances = new WeakMap<
    object,
    Map<string, MarkDBInstance>
>();

/**
 * Returns the registry associated with a storage context.
 */
function getRegistry(
    context: MarkDBStorageContext,
): Map<string, MarkDBInstance> {
    const key = context as object;

    let registry = openInstances.get(key);

    if (!registry) {
        registry = new Map<string, MarkDBInstance>();
        openInstances.set(key, registry);
    }

    return registry;
}

/**
 * Creates the initial contents for a new MarkDB file.
 *
 * The file header records its format so that opening the file
 * later can verify that the requested format matches.
 */
function makeInitialContents(format: MarkDBFormat): string {
    switch (format) {
        case "json":
            return makeHeader(format) + "null\n";

        case "database":
            return makeHeader(format) + makeDatabaseBody([]);

        case "file":
            return makeHeader(format) + makeFileBody();

        default: {
            const unsupported: never = format;
            throw new MarkDBError(
                `Unsupported MarkDB format: ${unsupported}`,
            );
        }
    }
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
export function openMarkDB(
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
export function openMarkDB(
    context: MarkDBStorageContext,
    path: string,
    options: MarkDBOptions & {
        format: "database";
        schema: RecordSchema;
    },
): Promise<DatabaseMarkDB>;

/**
 * Opens an existing file MarkDB file or creates it when permitted.
 *
 * @param context Storage context used to access the file.
 * @param path Path to the MarkDB file.
 * @param options Opening and creation options.
 * @returns An initialized File MarkDB instance.
 */
export function openMarkDB(
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
export async function openMarkDB(
    context: MarkDBStorageContext,
    path: string,
    options: MarkDBOptions,
): Promise<MarkDBInstance> {
    // 1. Validate arguments.
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

    if (
        options.format === "database" &&
        !options.schema
    ) {
        throw new MarkDBSchemaError(
            'The "database" format requires a record schema.',
        );
    }

    // 2. Resolve the adapter and normalize the path.
    const adapter = resolveAdapter(context);
    const resolvedPath = normalizeMarkDBPath(path);

    if (!resolvedPath.endsWith(".mdb")) {
        throw new MarkDBInvalidPathError(
            'MarkDB paths must end with ".mdb".',
        );
    }

    // 3. Reuse an instance already opened for this context and path.
    const registry = getRegistry(context);
    const existing = registry.get(resolvedPath);

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

    // 4. Create a missing file only when explicitly allowed.
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
            makeInitialContents(options.format),
        );
    }

    // 5. Ensure the target is a regular file.
    await assertRegularFile(adapter, resolvedPath);

    // 6. Read the file and validate its header.
    const contents = await readContents(adapter, resolvedPath);
    const { header } = parseHeader(contents);

    if (header.format !== options.format) {
        throw new MarkDBFormatMismatchError(
            `Expected format "${options.format}", but found "${header.format}" in "${resolvedPath}".`,
        );
    }

    // 7. Construct the implementation for the requested format.
    let instance: MarkDBInstance;

    switch (options.format) {
        case "json":
            instance = new JsonMarkDB(adapter, resolvedPath);
            break;

        case "database":
            instance = new DatabaseMarkDB(
                adapter,
                resolvedPath,
                options.schema!,
            );
            break;

        case "file":
            instance = new FileMarkDB(adapter, resolvedPath);
            break;
    }

    // 8. Register only after initialization succeeds.
    await instance.checkHealth();
    registry.set(resolvedPath, instance);

    return instance;
}
