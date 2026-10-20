import type { DataAdapter } from "obsidian";
import { MarkDBCorruptionError, MarkDBError, MarkDBInvalidHeaderError } from "./error";
import { readContents, writeContents } from "./helper";
import { makeHeader, parseHeader } from "./parser";

/** Stores one JSON-serializable value in a MarkDB file. Changes remain cached until force_save(). */
class JsonMarkDB<T = unknown> {
    private data: T | undefined;
    private loaded = false;
    private dirty = false;

    constructor(private readonly adapter: DataAdapter, private readonly path: string) {}

    /** Reads the cached value, loading and validating it from disk once. */
    async read(): Promise<T> {
        await this.load();
        return this.data as T;
    }

    /** Replaces the cached JSON value. Call force_save() to persist it. */
    async write(value: T): Promise<void> {
        this.assertSerializable(value);
        this.data = value;
        this.loaded = true;
        this.dirty = true;
    }

    /** Replaces the cached value with the result of an updater function. */
    async update(updater: (value: T) => T | Promise<T>): Promise<void> {
        await this.write(await updater(await this.read()));
    }

    /** Removes a top-level object property or zero-based array item from the cached value. */
    async delete(key: string | number): Promise<void> {
        const value = await this.read();
        if (Array.isArray(value)) {
            if (typeof key !== "number" || !Number.isInteger(key) || key < 0 || key >= value.length) {
                throw new MarkDBError(`Invalid JSON array index: ${String(key)}`, this.path);
            }
            value.splice(key, 1);
        } else if (typeof value === "object" && value !== null) {
            if (typeof key !== "string") {
                throw new MarkDBError("JSON object keys must be strings.", this.path);
            }
            delete (value as Record<string, unknown>)[key];
        } else {
            throw new MarkDBError("Cannot delete a value from a JSON scalar.", this.path);
        }
        this.dirty = true;
    }

    /** Writes pending changes to disk immediately. */
    async force_save(): Promise<void> {
        await this.load();
        if (!this.dirty) return;
        await writeContents(this.adapter, this.path, makeHeader("json") + makeJsonBody(this.data));
        this.dirty = false;
    }

    /** Validates that the backing file has a JSON MarkDB header and body. */
    async checkHealth(): Promise<void> {
        const { header, body } = parseHeader(await readContents(this.adapter, this.path));
        if (header.format !== "json") {
            throw new MarkDBInvalidHeaderError(`Expected a JSON MarkDB file: "${this.path}".`, this.path);
        }
        this.parse(body);
    }

    private async load(): Promise<void> {
        if (this.loaded) return;
        const { header, body } = parseHeader(await readContents(this.adapter, this.path));
        if (header.format !== "json") {
            throw new MarkDBInvalidHeaderError(`Expected a JSON MarkDB file: "${this.path}".`, this.path);
        }
        this.data = this.parse(body) as T;
        this.loaded = true;
    }

    private parse(body: string): unknown {
        try {
            return JSON.parse(body);
        } catch {
            throw new MarkDBCorruptionError(`Invalid JSON body in MarkDB file: "${this.path}".`, this.path);
        }
    }

    private assertSerializable(value: unknown): void {
        try {
            if (JSON.stringify(value) === undefined) throw new Error("not serializable");
        } catch {
            throw new MarkDBCorruptionError("JSON MarkDB values must be JSON-serializable.", this.path);
        }
    }
}

/** Serializes a JSON value as a readable MarkDB body. */
function makeJsonBody(data: unknown): string {
    const serialized = JSON.stringify(data, null, 4);
    if (serialized === undefined) throw new MarkDBCorruptionError("JSON MarkDB values must be JSON-serializable.");
    return `${serialized}\n`;
}

export { JsonMarkDB, makeJsonBody };
