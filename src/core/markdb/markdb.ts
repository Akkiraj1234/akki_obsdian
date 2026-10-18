import { DatabaseMarkDB, makeDatabaseBody } from "./databasemarkdb";
import { DEFAULT_BLOCK_SIZE, FileMarkDB, makeFileBody } from "./filemarkdb";
import { JsonMarkDB } from "./jsonmarkdb";
import { makeHeader, parseHeader } from "./parser";
import { assertRegularFile, normalizeMarkDBPath, readContents, resolveAdapter, writeContents } from "./storage";
import { MarkDBCorruptionError, MarkDBFileNotFoundError, MarkDBFormatMismatchError, MarkDBInvalidPathError, MarkDBSchemaError } from "./types";
import type { MarkDBOptions, MarkDBStorageContext, RecordSchema } from "./types";

/** Creates the appropriate format-specific MarkDB object for a vault file. */
export class MarkDB {
	/**
	 * Opens a vault-relative `.mdb` path using an Obsidian App, Vault, or adapter.
	 * Creation and writes use DataAdapter.write, which is serialized per MarkDB
	 * object but is not claimed to be atomic or crash-safe across the vault.
	 */
	static async open(context: MarkDBStorageContext, path: string, options: MarkDBOptions & { format: "json" }): Promise<JsonMarkDB>;
	static async open<T>(context: MarkDBStorageContext, path: string, options: MarkDBOptions<T> & { format: "database"; schema: RecordSchema<T> }): Promise<DatabaseMarkDB<T>>;
	static async open(context: MarkDBStorageContext, path: string, options: MarkDBOptions & { format: "file" }): Promise<FileMarkDB>;
	static async open<T>(context: MarkDBStorageContext, requestedPath: string, options: MarkDBOptions<T>): Promise<JsonMarkDB | DatabaseMarkDB<T> | FileMarkDB> {
		const adapter = resolveAdapter(context);
		const path = normalizeMarkDBPath(requestedPath);
		if (!path.endsWith(".mdb")) throw new MarkDBInvalidPathError(`MarkDB files must use the .mdb extension: ${path}`, path);
		if (options.format === "database" && !options.schema) throw new MarkDBSchemaError("A Zod schema is required for database files.", path);
		const blockSize = options.blockSize ?? DEFAULT_BLOCK_SIZE;
		if (options.format === "file" && (!Number.isSafeInteger(blockSize) || blockSize <= 0)) throw new MarkDBCorruptionError("Block size must be a positive integer.", path);

		if (!(await adapter.exists(path))) {
			if (!options.create) throw new MarkDBFileNotFoundError(`MarkDB file does not exist: ${path}`, path);
			await writeContents(adapter, path, makeInitialContents(options.format, blockSize));
		}

		await assertRegularFile(adapter, path);
		const contents = await readContents(adapter, path);
		const header = parseHeader(contents).header;
		if (header.format !== options.format) throw new MarkDBFormatMismatchError(`Expected ${options.format} MarkDB file, found ${header.format}.`, path);

		const database = options.format === "json"
			? new JsonMarkDB(adapter, path)
			: options.format === "database"
				? new DatabaseMarkDB(adapter, path, options.schema as RecordSchema<T>)
				: new FileMarkDB(adapter, path, blockSize);
		await database.checkHealth();
		return database;
	}
}

function makeInitialContents(format: MarkDBOptions["format"], blockSize: number): string {
	if (format === "json") return makeHeader(format) + "null\n";
	if (format === "database") return makeHeader(format) + makeDatabaseBody([]);
	return makeHeader(format) + makeFileBody(blockSize);
}
