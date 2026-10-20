/**
 * @file types.ts
 * Defines the shared types, interfaces, and error classes used by MarkDB.
 *
 * Provides type definitions for supported storage formats, storage contexts,
 * opening options, file headers, and format-specific metadata.
 *
 * Also defines the MarkDB error hierarchy for reporting file access,
 * path validation, format mismatches, version incompatibilities,
 * schema validation, and data corruption.
 *
 * @module types
 */

import type { z } from "zod";
import type { App, DataAdapter, Vault } from "obsidian";


export type MarkDBFormat = "json" | "database" | "file";
export type MarkDBStorageContext = App | Vault | DataAdapter;
export type RecordSchema<T = unknown> = z.ZodType<T>;

export interface MarkDBHeader {
    version: number;
    format: MarkDBFormat;
}

export interface DatabaseMetadata {
    version: 1;
    recordCount: number;
}

export interface FileIndexEntry {
    key: string;
    length: number;
}

export interface FileIndexManager {
    id: number;
    next: number | null;
    entries: FileIndexEntry[];
}

export interface FileMetadata {
    version: 1;
    blockSize: number;
    indexManagers: FileIndexManager[];
}