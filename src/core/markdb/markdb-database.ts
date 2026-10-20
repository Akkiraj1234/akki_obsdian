import type { DataAdapter } from "obsidian";
import { MarkDBCorruptionError, MarkDBInvalidHeaderError, MarkDBSchemaError } from "./error";
import { readContents, writeContents } from "./helper";
import { makeHeader, parseHeader } from "./parser";
import type { DatabaseMetadata, RecordSchema } from "./types";

const METADATA_FOOTER = /^<!-- markdb-database-metadata: v1; (.+) -->$/;

/**
 * Stores schema-validated records in a structured MarkDB file.
 *
 * Obsidian reads and writes the entire file, while this class maintains its
 * records and metadata in memory between explicit saves.
 */
class DatabaseMarkDB<T = unknown> {
    private records: T[] | undefined;
    private loaded = false;
    private dirty = false;

    constructor(
        private readonly adapter: DataAdapter,
        private readonly path: string,
        private readonly schema: RecordSchema<T>,
    ) {}

    /** Reads the cached records, loading and schema-validating them once. */
    async read(): Promise<readonly T[]> {
        await this.load();
        return this.records as readonly T[];
    }

    /** Replaces every cached record after validating it against the schema. */
    async write(records: readonly T[]): Promise<void> {
        const next = [...records];
        next.forEach((record, index) => this.assertRecord(record, index));
        this.records = next;
        this.loaded = true;
        this.dirty = true;
    }

    /** Replaces records with the result of an updater function after validation. */
    async update(updater: (records: readonly T[]) => readonly T[] | Promise<readonly T[]>): Promise<void> {
        await this.write(await updater(await this.read()));
    }

    /** Removes every record for which the predicate returns true. */
    async delete(predicate: (record: T, index: number) => boolean): Promise<void> {
        const records = await this.read();
        await this.write(records.filter((record, index) => !predicate(record, index)));
    }

    /** Writes pending records and rebuilt metadata to disk immediately. */
    async force_save(): Promise<void> {
        await this.load();
        if (!this.dirty) return;
        await writeContents(
            this.adapter,
            this.path,
            makeHeader("database") + makeDatabaseBody(this.records as readonly T[], this.schema),
        );
        this.dirty = false;
    }

    /** Validates the database header, records, metadata, and schema. */
    async checkHealth(): Promise<void> {
        const { header, body } = parseHeader(await readContents(this.adapter, this.path));
        if (header.format !== "database") {
            throw new MarkDBInvalidHeaderError(`Expected a database MarkDB file: "${this.path}".`, this.path);
        }
        this.validateRecords(parseDatabaseBody(body).records);
    }

    private async load(): Promise<void> {
        if (this.loaded) return;
        const { header, body } = parseHeader(await readContents(this.adapter, this.path));
        if (header.format !== "database") {
            throw new MarkDBInvalidHeaderError(`Expected a database MarkDB file: "${this.path}".`, this.path);
        }
        const records = parseDatabaseBody(body).records;
        this.validateRecords(records);
        this.records = records as T[];
        this.loaded = true;
    }

    private validateRecords(records: readonly unknown[]): void {
        records.forEach((record, index) => this.assertRecord(record, index));
    }

    private assertRecord(record: unknown, index?: number): asserts record is T {
        const result = this.schema.safeParse(record);
        if (!result.success) {
            const prefix = index === undefined ? "Record" : `Record ${index}`;
            throw new MarkDBSchemaError(`${prefix} does not match the supplied schema: ${result.error.message}`, this.path);
        }
    }
}

/** Serializes validated records and their record-count metadata. */
function makeDatabaseBody<T>(records: readonly T[], schema?: RecordSchema<T>): string {
    if (schema) {
        records.forEach((record, index) => {
            const result = schema.safeParse(record);
            if (!result.success) {
                throw new MarkDBSchemaError(`Record ${index} does not match the supplied schema: ${result.error.message}`);
            }
        });
    }
    const metadata: DatabaseMetadata = { version: 1, recordCount: records.length };
    return `${JSON.stringify(records, null, 4)}\n<!-- markdb-database-metadata: v1; ${JSON.stringify(metadata)} -->\n`;
}

function parseDatabaseBody(body: string): { records: unknown[]; metadata: DatabaseMetadata } {
    const trimmed = body.endsWith("\n") ? body.slice(0, -1) : body;
    const boundary = trimmed.lastIndexOf("\n");
    if (boundary < 0) throw new MarkDBCorruptionError("Missing database metadata footer.");

    const footer = METADATA_FOOTER.exec(trimmed.slice(boundary + 1));
    if (!footer?.[1]) throw new MarkDBCorruptionError("Invalid database metadata footer.");

    let metadata: DatabaseMetadata;
    let records: unknown;
    try {
        metadata = JSON.parse(footer[1]) as DatabaseMetadata;
        records = JSON.parse(trimmed.slice(0, boundary));
    } catch {
        throw new MarkDBCorruptionError("Database body contains invalid JSON.");
    }
    if (
        metadata.version !== 1 ||
        !Number.isSafeInteger(metadata.recordCount) ||
        metadata.recordCount < 0 ||
        !Array.isArray(records) ||
        records.length !== metadata.recordCount
    ) {
        throw new MarkDBCorruptionError("Database records and metadata do not match.");
    }
    return { records, metadata };
}

export { DatabaseMarkDB, makeDatabaseBody, parseDatabaseBody };
