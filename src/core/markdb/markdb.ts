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



import { DatabaseMarkDB, makeDatabaseBody } from "./databasemarkdb";
import { DEFAULT_BLOCK_SIZE, FileMarkDB, makeFileBody } from "./filemarkdb";
import { JsonMarkDB } from "./jsonmarkdb";
import { makeHeader, parseHeader } from "./parser";
import {
    assertRegularFile,
    normalizeMarkDBPath,
    readContents,
    resolveAdapter,
    writeContents,
} from "./storage";
import {
    MarkDBCorruptionError,
    MarkDBFileNotFoundError,
    MarkDBFormatMismatchError,
    MarkDBInvalidPathError,
    MarkDBSchemaError,
} from "./types";
import type {
    MarkDBOptions,
    MarkDBStorageContext,
    RecordSchema,
} from "./types";


export function openMarkDB(
    context: MarkDBStorageContext,
    path: string,
    options: MarkDBOptions & { format: "json" },
): Promise<JsonMarkDB>;

export function openMarkDB<T>(
    context: MarkDBStorageContext,
    path: string,
    options: MarkDBOptions<T> & {
        format: "database";
        schema: RecordSchema<T>;
    },
): Promise<DatabaseMarkDB<T>>;

export function openMarkDB(
    context: MarkDBStorageContext,
    path: string,
    options: MarkDBOptions & { format: "file" },
): Promise<FileMarkDB>;

export async function openMarkDB<T>(
    context: MarkDBStorageContext,
    requestedPath: string,
    options: MarkDBOptions<T>,
): Promise<JsonMarkDB | DatabaseMarkDB<T> | FileMarkDB> {
    const adapter = resolveAdapter(context);
    const path = normalizeMarkDBPath(requestedPath);

    if (!path.endsWith(".mdb")) {
        throw new MarkDBInvalidPathError(
            `MarkDB files must use the .mdb extension: ${path}`,
            path,
        );
    }

    if (options.format === "database" && !options.schema) {
        throw new MarkDBSchemaError(
            "A Zod schema is required for database files.",
            path,
        );
    }

    const blockSize = options.blockSize ?? DEFAULT_BLOCK_SIZE;

    if (
        options.format === "file" &&
        (!Number.isSafeInteger(blockSize) || blockSize <= 0)
    ) {
        throw new MarkDBCorruptionError(
            "Block size must be a positive integer.",
            path,
        );
    }

    if (!(await adapter.exists(path))) {
        if (!options.create) {
            throw new MarkDBFileNotFoundError(
                `MarkDB file does not exist: ${path}`,
                path,
            );
        }

        await writeContents(
            adapter,
            path,
            makeInitialContents(options.format, blockSize),
        );
    }

    await assertRegularFile(adapter, path);

    const contents = await readContents(adapter, path);
    const { header } = parseHeader(contents);

    if (header.format !== options.format) {
        throw new MarkDBFormatMismatchError(
            `Expected ${options.format} MarkDB file, found ${header.format}.`,
            path,
        );
    }

    let database: JsonMarkDB | DatabaseMarkDB<T> | FileMarkDB;

    if (options.format === "json") {
        database = new JsonMarkDB(adapter, path);
    } else if (options.format === "database") {
        database = new DatabaseMarkDB(
            adapter,
            path,
            options.schema as RecordSchema<T>,
        );
    } else {
        database = new FileMarkDB(adapter, path, blockSize);
    }

    await database.checkHealth();

    return database;
}

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