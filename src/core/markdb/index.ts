/** Public MarkDB API. */
export { openMarkDB, openMarkDB as markdb } from "./markdb";
export { DatabaseMarkDB } from "./markdb-database";
export { FileMarkDB } from "./markdb-file";
export { JsonMarkDB } from "./markdb-json";
export {
    MarkDBCorruptionError,
    MarkDBError,
    MarkDBFileNotFoundError,
    MarkDBFormatMismatchError,
    MarkDBIncompatibleVersionError,
    MarkDBInvalidHeaderError,
    MarkDBInvalidPathError,
    MarkDBSchemaError,
} from "./error";
export type {
    DatabaseMetadata,
    FileIndexEntry,
    FileIndexManager,
    FileMetadata,
    MarkDBFormat,
    MarkDBHeader,
    MarkDBStorageContext,
    RecordSchema,
} from "./types";

export type { MarkDBOptions } from "./markdb";
