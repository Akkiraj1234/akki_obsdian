import type { DataAdapter } from "obsidian";
import { MarkDBError, MarkDBInvalidHeaderError } from "./error";
import { readContents, writeContents } from "./helper";
import { makeHeader, parseHeader } from "./parser";

/** Stores unmodified text after the MarkDB header. Changes remain cached until force_save(). */
class FileMarkDB {
    private data: string | undefined;
    private loaded = false;
    private dirty = false;

    constructor(private readonly adapter: DataAdapter, private readonly path: string) {}

    /** Reads the cached raw file body, loading it from disk once. */
    async read(): Promise<string> {
        await this.load();
        return this.data as string;
    }

    /** Replaces the cached raw file body. Call force_save() to persist it. */
    async write(data: string): Promise<void> {
        this.data = data;
        this.loaded = true;
        this.dirty = true;
    }

    /** Replaces the cached body with the value returned by an updater function. */
    async update(updater: (data: string) => string | Promise<string>): Promise<void> {
        await this.write(await updater(await this.read()));
    }

    /** Removes one zero-based line from the cached raw body. */
    async delete(line: number): Promise<void> {
        const data = await this.read();
        if (!Number.isInteger(line) || line < 0) {
            throw new MarkDBError(`Invalid file line index: ${line}`, this.path);
        }
        const lines = data.split("\n");
        const lineCount = data === "" ? 0 : data.endsWith("\n") ? lines.length - 1 : lines.length;
        if (line >= lineCount) {
            throw new MarkDBError(`File line index is out of range: ${line}`, this.path);
        }
        lines.splice(line, 1);
        await this.write(lines.join("\n"));
    }

    /** Writes pending raw content to disk immediately. */
    async force_save(): Promise<void> {
        await this.load();
        if (!this.dirty) return;
        await writeContents(this.adapter, this.path, makeHeader("file") + this.data);
        this.dirty = false;
    }

    /** Validates that the file has a file-format MarkDB header. */
    async checkHealth(): Promise<void> {
        const { header } = parseHeader(await readContents(this.adapter, this.path));
        if (header.format !== "file") {
            throw new MarkDBInvalidHeaderError(`Expected a file MarkDB file: "${this.path}".`, this.path);
        }
    }

    private async load(): Promise<void> {
        if (this.loaded) return;
        const { header, body } = parseHeader(await readContents(this.adapter, this.path));
        if (header.format !== "file") {
            throw new MarkDBInvalidHeaderError(`Expected a file MarkDB file: "${this.path}".`, this.path);
        }
        this.data = body;
        this.loaded = true;
    }
}

/** Returns raw text unchanged for a new file-format MarkDB body. */
function makeFileBody(data: string): string {
    return data;
}

export { FileMarkDB, makeFileBody };
