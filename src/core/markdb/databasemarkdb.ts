import { 
	MarkDBCorruptionError, 
	MarkDBIncompatibleVersionError, 
	MarkDBSchemaError 
} from "./types";

import { MarkDBFile } from "./markdb-file";
import { readContents, writeContents } from "./storage";
import { MARKDB_VERSION, makeHeader, parseHeader } from "./parser";

import type { DataAdapter } from "obsidian";
import type { DatabaseMetadata, RecordSchema } from "./types";

const METADATA_FOOTER = /^<!-- markdb-database-metadata: v(\d+); (.+) -->$/;


export class DatabaseMarkDB<T> extends MarkDBFile {

	constructor(
		adapter: DataAdapter, 
		path: string, 
		readonly schema: RecordSchema<T>
	) {
		super(adapter, path, "database");
	}

	protected async validate(contents: string): Promise<void> {
		const { records } = parseDatabaseBody(
			parseHeader(contents).body
		);

		for (let index = 0; index < records.length; index += 1) {
			const result = this.schema.safeParse(records[index]);

			if (!result.success) {
				throw new MarkDBSchemaError(
					`Record ${index} does not match the supplied schema: ${result.error.message}`, 
					this.path
				);
			}
		}
	}

	async read(): Promise<T[]> {
		return parseDatabaseBody(
			parseHeader(
				await readContents(this.adapter, this.path)
			).body
		).records as T[];
	}

	/** 
	 * First-version update appends one schema-validated record. 
	**/
	async update(record: T): Promise<void> {
		this.assertRecord(record);
		
		await this.writes.run(async () => {
			const records = await this.read();
			records.push(record);
			await writeContents(this.adapter, this.path, makeHeader("database") + makeDatabaseBody(records));
		});
	}

	/** Rebuilds all records and their footer metadata. */
	async forceUpdate(records: T[]): Promise<void> {
		records.forEach((record) => this.assertRecord(record));
		await this.writes.run(() => writeContents(this.adapter, this.path, makeHeader("database") + makeDatabaseBody(records)));
	}

	private assertRecord(record: unknown): asserts record is T {
		const result = this.schema.safeParse(record);
		if (!result.success) throw new MarkDBSchemaError(`Record does not match the supplied schema: ${result.error.message}`, this.path);
	}
}

export function makeDatabaseBody(records: unknown[]): string {
	const metadata: DatabaseMetadata = { version: 1, recordCount: records.length };
	return `${JSON.stringify(records)}\n<!-- markdb-database-metadata: v1; ${JSON.stringify(metadata)} -->\n`;
}

function parseDatabaseBody(body: string): { records: unknown[]; metadata: DatabaseMetadata } {
	const trimmed = body.endsWith("\n") ? body.slice(0, -1) : body;
	const boundary = trimmed.lastIndexOf("\n");
	if (boundary < 0) throw new MarkDBCorruptionError("Missing database metadata footer.");
	const match = METADATA_FOOTER.exec(trimmed.slice(boundary + 1));
	if (!match) throw new MarkDBCorruptionError("Invalid database metadata footer.");
	if (Number(match[1]) !== MARKDB_VERSION) throw new MarkDBIncompatibleVersionError(`Unsupported database metadata version: v${match[1]}.`);
	let metadata: DatabaseMetadata;
	try {
		metadata = JSON.parse(match[2]) as DatabaseMetadata;
	} catch {
		throw new MarkDBCorruptionError("Invalid JSON in database metadata.");
	}
	if (metadata.version !== 1 || !Number.isSafeInteger(metadata.recordCount) || metadata.recordCount < 0) throw new MarkDBCorruptionError("Invalid database metadata.");
	try {
		const records: unknown = JSON.parse(trimmed.slice(0, boundary));
		if (!Array.isArray(records)) throw new Error("not an array");
		if (records.length !== metadata.recordCount) throw new MarkDBCorruptionError("Database metadata record count does not match its records.");
		return { records, metadata };
	} catch (error) {
		if (error instanceof MarkDBCorruptionError) throw error;
		throw new MarkDBCorruptionError("Database records are not valid JSON.");
	}
}
