import {MarkDBInvalidPathError, MarkDBFileNotFoundError} from "./error"
import type { MarkDBStorageContext } from "./types";
import type { DataAdapter } from "obsidian";


/**
 * Resolves a storage context to its underlying Obsidian data adapter.
 *
 * Accepts a vault, an object containing an adapter, or a `DataAdapter`
 * directly. This allows MarkDB to work with different storage contexts
 * without importing desktop-only Node.js APIs.
 *
 * @param context - The storage context containing or representing a data adapter.
 * @returns The resolved Obsidian data adapter.
 */
export function resolveAdapter(context: MarkDBStorageContext): DataAdapter {
    if (!context || typeof context !== "object") {
        throw new MarkDBInvalidPathError("A valid MarkDB storage context is required.");
    }

    const adapter = "vault" in context
        ? context.vault?.adapter
        : "adapter" in context
            ? context.adapter
            : context;
    if (
        !adapter ||
        typeof adapter !== "object" ||
        typeof adapter.exists !== "function" ||
        typeof adapter.stat !== "function" ||
        typeof adapter.read !== "function" ||
        typeof adapter.write !== "function"
    ) {
        throw new MarkDBInvalidPathError("A valid MarkDB storage context is required.");
    }
    return adapter;
}

/**
 * Normalizes and validates a relative path within an Obsidian vault.
 *
 * Converts Windows-style path separators to forward slashes, removes
 * redundant separators and current-directory (`.`) segments, and rejects
 * empty paths, absolute paths, and paths containing parent-directory (`..`)
 * segments.
 *
 * This function validates the path string only; it does not check whether
 * the target exists or whether the path resolves to a file or directory.
 *
 * @param path - The relative vault path to normalize.
 * @returns The normalized path using forward slashes.
 * @throws {MarkDBInvalidPathError} If the path is empty, absolute, or contains
 * a parent-directory segment, or has no remaining path segments after normalization.
 */
export function normalizeMarkDBPath(path: string): string {
    const slashPath = path.replace(/\\/g, "/");

    if (!slashPath || slashPath.startsWith("/") || /^[A-Za-z]:\//.test(slashPath)) {
        throw new MarkDBInvalidPathError(
            `MarkDB path must be a relative vault path: ${path}`,
            path,
        );
    }

    const parts = slashPath.split("/").filter(
        (part) => part !== "" && part !== ".",
    );

    if (parts.length === 0 || parts.some((part) => part === "..")) {
        throw new MarkDBInvalidPathError(
            `MarkDB path must be a relative vault path: ${path}`,
            path,
        );
    }

    return parts.join("/");
}

/**
 * Verifies that a path exists and refers to a regular file.
 *
 * Uses the Obsidian data adapter to inspect the target without reading
 * its contents.
 *
 * @param adapter - The Obsidian data adapter used to inspect the path.
 * @param path - The path to validate.
 * @returns A promise that resolves when the path is confirmed to be a file.
 * @throws {MarkDBFileNotFoundError} If the path does not exist.
 * @throws {MarkDBInvalidPathError} If the path exists but refers to something
 * other than a regular file.
 */
export async function assertRegularFile( adapter: DataAdapter, path: string ): Promise<void> {
    const info = await adapter.stat(path);

    if (!info) {
        throw new MarkDBFileNotFoundError(
            `MarkDB file does not exist: ${path}`,
            path,
        );
    }

    if (info.type !== "file") {
        throw new MarkDBInvalidPathError(
            `Path is not a regular file: ${path}`,
            path,
        );
    }
}

/**
 * Reads the complete text contents of an existing MarkDB file.
 *
 * Validates that the target exists and is a regular file before reading it.
 *
 * @param adapter - The Obsidian data adapter used to access the file.
 * @param path - The path of the file to read.
 * @returns A promise that resolves to the file contents as a string.
 * @throws {MarkDBFileNotFoundError} If the file does not exist.
 * @throws {MarkDBInvalidPathError} If the target is not a regular file.
 * @throws If the underlying adapter fails to read the file.
 */
export async function readContents( 
    adapter: DataAdapter, 
    path: string 
): Promise<string> {

    await assertRegularFile(adapter, path);
    return adapter.read(path);
}

/**
 * Writes text contents to a file, replacing any existing contents.
 *
 * This function delegates directly to the Obsidian data adapter. It does not
 * verify that the target exists or create missing parent directories.
 * The operation is not guaranteed to be atomic or crash-safe.
 *
 * @param adapter - The Obsidian data adapter used to write the file.
 * @param path - The destination path.
 * @param contents - The complete text contents to write.
 * @returns A promise that resolves when the adapter completes the write.
 * @throws If the underlying adapter fails to write the file.
 */
export async function writeContents(
    adapter: DataAdapter, 
    path: string, 
    contents: string 
): Promise<void> {

    return adapter.write(path, contents);
}

/**
 * Reads the complete binary contents of an existing file.
 *
 * Validates that the target exists and is a regular file before reading it.
 * Unlike {@link readContents}, this function returns binary data rather than
 * decoded text.
 *
 * @param adapter - The Obsidian data adapter used to access the file.
 * @param path - The path of the file to read.
 * @returns A promise that resolves to the file contents as an ArrayBuffer.
 * @throws {MarkDBFileNotFoundError} If the file does not exist.
 * @throws {MarkDBInvalidPathError} If the target is not a regular file.
 * @throws If the underlying adapter fails to read the file.
 */
export async function readBinaryContents(
    adapter: DataAdapter,
    path: string,
): Promise<ArrayBuffer> {

    await assertRegularFile(adapter, path);
    return adapter.readBinary(path);
}

/**
 * Writes binary data to a file, replacing any existing contents.
 *
 * This function delegates directly to the Obsidian data adapter. It does not
 * verify that the target exists or create missing parent directories.
 * The operation is not guaranteed to be atomic or crash-safe.
 *
 * @param adapter - The Obsidian data adapter used to write the file.
 * @param path - The destination path.
 * @param contents - The binary data to write.
 * @returns A promise that resolves when the adapter completes the write.
 * @throws If the underlying adapter fails to write the file.
 */
export async function writeBinaryContents(
    adapter: DataAdapter,
    path: string,
    contents: ArrayBuffer,
): Promise<void> {

    return adapter.writeBinary(path, contents);
}
