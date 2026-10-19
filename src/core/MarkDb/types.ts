import type { z } from "zod";
import type { App, DataAdapter, Vault } from "obsidian";

export type MarkDBFormat = "json" | "database" | "file";
export type RecordSchema<T = unknown> = z.ZodType<T>;

/** An Obsidian storage context accepted by {@link MarkDB.open}. */
export type MarkDBStorageContext = App | Vault | DataAdapter;

export interface MarkDBOptions<T = unknown> {
    /** Existing files must have this format; missing files use it at creation. */
    format: MarkDBFormat;
    create?: boolean;
    /** Required for `database`. Every stored record is checked against it. */
    schema?: RecordSchema<T>;
    /** Used only to create or open a `file` database; defaults to 16 KiB. */
    blockSize?: number;
}

export interface MarkDBHeader { version: Number; format: MarkDBFormat; }
export interface DatabaseMetadata { version: 1; recordCount: number; }
export interface FileIndexEntry { key: string; block: number; length: number; }
export interface FileIndexManager { id: number; next: number | null; entries: FileIndexEntry[]; }
export interface FileMetadata { version: 1; blockSize: number; indexManagers: FileIndexManager[]; }

export class MarkDBError extends Error {
    constructor(message: string, public readonly path?: string) { super(message); this.name = new.target.name; }
}
export class MarkDBFileNotFoundError extends MarkDBError {}
export class MarkDBInvalidPathError extends MarkDBError {}
export class MarkDBInvalidHeaderError extends MarkDBError {}
export class MarkDBFormatMismatchError extends MarkDBError {}
export class MarkDBIncompatibleVersionError extends MarkDBError {}
export class MarkDBSchemaError extends MarkDBError {}
export class MarkDBCorruptionError extends MarkDBError {}
