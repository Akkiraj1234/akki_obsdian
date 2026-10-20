/**
 * @file errors.ts
 * Defines the base error class and specialized error types used by MarkDB.
 *
 * Provides a common `MarkDBError` class that supports descriptive error
 * messages and optional file paths, along with specialized subclasses
 * for file access failures, invalid paths or headers, format mismatches,
 * incompatible versions, schema validation failures, and data corruption.
 *
 * Each error subclass has its own error name, allowing callers to identify
 * and handle specific failure conditions using `instanceof` or the error name.
 *
 * @module errors
 */

export class MarkDBError extends Error {
    constructor(
        message: string,
        public readonly path?: string,
    ) {
        super(message);
        this.name = new.target.name;
    }
}

// errors
export class MarkDBFileNotFoundError extends MarkDBError {}
export class MarkDBInvalidPathError extends MarkDBError {}
export class MarkDBInvalidHeaderError extends MarkDBError {}
export class MarkDBFormatMismatchError extends MarkDBError {}
export class MarkDBIncompatibleVersionError extends MarkDBError {}
export class MarkDBSchemaError extends MarkDBError {}
export class MarkDBCorruptionError extends MarkDBError {}