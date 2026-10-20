/* eslint-disable import/no-nodejs-modules */
import assert from "node:assert/strict";
import test from "node:test";
import type { DataAdapter } from "obsidian";
import { z } from "zod";
import {
    MarkDBFileNotFoundError,
    MarkDBFormatMismatchError,
    MarkDBIncompatibleVersionError,
    MarkDBInvalidHeaderError,
    MarkDBInvalidPathError,
    MarkDBSchemaError,
} from "../error";
import {
    assertRegularFile,
    normalizeMarkDBPath,
    readBinaryContents,
    readContents,
    resolveAdapter,
    writeBinaryContents,
    writeContents,
} from "../helper";
import { DatabaseMarkDB } from "../markdb-database";
import { FileMarkDB } from "../markdb-file";
import { JsonMarkDB } from "../markdb-json";
import { openMarkDB } from "../markdb";
import { makeHeader, parseHeader } from "../parser";
import { markDBRegistry } from "../registry";

class MemoryAdapter {
    readonly files = new Map<string, string>();
    readonly binaryFiles = new Map<string, Uint8Array>();
    readonly directories = new Set<string>();
    readCount = 0;
    failRead = false;
    failWrite = false;

    asDataAdapter(): DataAdapter {
        return this as unknown as DataAdapter;
    }

    set(path: string, contents: string): void {
        this.files.set(path, contents);
    }

    async exists(path: string): Promise<boolean> {
        return this.files.has(path) || this.directories.has(path);
    }

    async stat(path: string): Promise<{ type: "file" | "folder"; ctime: number; mtime: number; size: number } | null> {
        if (this.files.has(path)) return { type: "file", ctime: 0, mtime: 0, size: this.files.get(path)!.length };
        if (this.directories.has(path)) return { type: "folder", ctime: 0, mtime: 0, size: 0 };
        return null;
    }

    async read(path: string): Promise<string> {
        this.readCount += 1;
        if (this.failRead) throw new Error("read failed");
        const contents = this.files.get(path);
        if (contents === undefined) throw new Error("missing file");
        return contents;
    }

    async write(path: string, contents: string): Promise<void> {
        if (this.failWrite) throw new Error("write failed");
        this.binaryFiles.delete(path);
        this.files.set(path, contents);
    }

    async readBinary(path: string): Promise<ArrayBuffer> {
        this.readCount += 1;
        if (this.failRead) throw new Error("read failed");
        const binary = this.binaryFiles.get(path);
        if (binary) return binary.slice().buffer;
        const contents = this.files.get(path);
        if (contents === undefined) throw new Error("missing file");
        return new TextEncoder().encode(contents).buffer;
    }

    async writeBinary(path: string, contents: ArrayBuffer): Promise<void> {
        if (this.failWrite) throw new Error("write failed");
        const binary = new Uint8Array(contents).slice();
        this.binaryFiles.set(path, binary);
        this.files.set(path, new TextDecoder().decode(binary));
    }
}

let pathNumber = 0;
function uniquePath(label: string): string {
    pathNumber += 1;
    return `test-${label}-${pathNumber}.mdb`;
}

void test("storage helpers resolve contexts and normalize only safe vault paths", () => {
    const memory = new MemoryAdapter();
    const adapter = memory.asDataAdapter();
    assert.equal(resolveAdapter(adapter), adapter);
    assert.equal(resolveAdapter({ adapter } as never), adapter);
    assert.equal(resolveAdapter({ vault: { adapter } } as never), adapter);
    assert.throws(() => resolveAdapter({} as never), MarkDBInvalidPathError);
    assert.equal(normalizeMarkDBPath("./data\\//today.mdb"), "data/today.mdb");

    for (const path of ["", "/absolute.mdb", "C:\\vault\\data.mdb", "../outside.mdb", "data/../outside.mdb"]) {
        assert.throws(() => normalizeMarkDBPath(path), MarkDBInvalidPathError);
    }
});

void test("storage helpers handle regular, text, binary, and adapter failure cases", async () => {
    const memory = new MemoryAdapter();
    const adapter = memory.asDataAdapter();
    memory.set("data.mdb", "old");
    memory.directories.add("directory");

    await assert.rejects(() => assertRegularFile(adapter, "missing"), MarkDBFileNotFoundError);
    await assert.rejects(() => assertRegularFile(adapter, "directory"), MarkDBInvalidPathError);
    assert.equal(await readContents(adapter, "data.mdb"), "old");
    await writeContents(adapter, "data.mdb", "new");
    assert.equal(await readContents(adapter, "data.mdb"), "new");
    const binary = new Uint8Array([0, 255, 16, 128]);
    await writeBinaryContents(adapter, "data.mdb", binary.buffer);
    assert.deepEqual(new Uint8Array(await readBinaryContents(adapter, "data.mdb")), binary);

    memory.failRead = true;
    await assert.rejects(() => readContents(adapter, "data.mdb"), /read failed/);
    await assert.rejects(() => readBinaryContents(adapter, "data.mdb"), /read failed/);
    memory.failRead = false;
    memory.failWrite = true;
    await assert.rejects(() => writeContents(adapter, "data.mdb", "nope"), /write failed/);
    await assert.rejects(() => writeBinaryContents(adapter, "data.mdb", new ArrayBuffer(0)), /write failed/);
});

void test("registry stores, replaces, isolates, and protects entries", () => {
    const first = uniquePath("registry");
    const second = uniquePath("registry");
    const original = {};
    const replacement = {};
    markDBRegistry.register(first, "json", original);
    assert.equal(markDBRegistry.get(first), original);
    assert.equal(markDBRegistry.getFormat(first), "json");
    assert.equal(markDBRegistry.has(first), true);
    assert.equal(markDBRegistry.get(second), undefined);
    assert.equal(markDBRegistry.has(second), false);
    markDBRegistry.register(first, "file", replacement);
    markDBRegistry.register(second, "database", {});
    assert.equal(markDBRegistry.get(first), replacement);
    assert.equal(markDBRegistry.getFormat(first), "file");
    assert.equal(markDBRegistry.getFormat(second), "database");
    assert.equal(Reflect.set(markDBRegistry, "get", () => undefined), false);
    assert.equal(Reflect.set(markDBRegistry, "register", () => undefined), false);
    assert.equal(Object.isFrozen(markDBRegistry), true);
});

void test("headers serialize supported formats and reject invalid headers", () => {
    for (const format of ["json", "database", "file"] as const) {
        const body = "body\nkept exactly";
        const parsed = parseHeader(makeHeader(format) + body);
        assert.equal(makeHeader(format), `<!-- markdb: v1; type: ${format} -->\n`);
        assert.deepEqual(parsed.header, { version: 1, format });
        assert.equal(parsed.body, body);
    }
    for (const contents of [
        "", "<!-- markdb: v1; type: other -->\n{}", "<!-- markdb: v1; type: json -->{}",
    ]) {
        assert.throws(() => parseHeader(contents), MarkDBInvalidHeaderError);
    }
    assert.throws(() => parseHeader("<!-- markdb: v9; type: json -->\n{}"), MarkDBIncompatibleVersionError);
});

void test("openMarkDB validates options, creates files, and selects implementations", async () => {
    const memory = new MemoryAdapter();
    const adapter = memory.asDataAdapter();
    const schema = z.object({ id: z.string() });

    await assert.rejects(() => openMarkDB(null as never, "data.mdb", { format: "json" }), MarkDBInvalidPathError);
    await assert.rejects(() => openMarkDB({} as never, "data.mdb", { format: "json" }), MarkDBInvalidPathError);
    await assert.rejects(() => openMarkDB(adapter, "", { format: "json" }), MarkDBInvalidPathError);
    await assert.rejects(() => openMarkDB(adapter, "../data.mdb", { format: "json" }), MarkDBInvalidPathError);
    await assert.rejects(() => openMarkDB(adapter, "data.txt", { format: "json" }), MarkDBInvalidPathError);
    await assert.rejects(() => openMarkDB(adapter, uniquePath("missing"), { format: "json" }), MarkDBFileNotFoundError);
    await assert.rejects(() => openMarkDB(adapter, uniquePath("bad-format"), { format: "other" as never }), /Unsupported MarkDB format/);
    await assert.rejects(() => openMarkDB(adapter, uniquePath("no-schema"), { format: "database" } as never), MarkDBSchemaError);

    const jsonPath = uniquePath("json");
    const databasePath = uniquePath("database");
    const filePath = uniquePath("file");
    const json = await openMarkDB(adapter, jsonPath, { format: "json", create: true });
    const database = await openMarkDB(adapter, databasePath, { format: "database", schema, create: true });
    const file = await openMarkDB(adapter, filePath, { format: "file", create: true });
    assert.ok(json instanceof JsonMarkDB);
    assert.ok(database instanceof DatabaseMarkDB);
    assert.ok(file instanceof FileMarkDB);
    assert.equal(memory.files.get(jsonPath), makeHeader("json") + "{}\n");
    assert.ok(memory.files.get(databasePath)?.startsWith(makeHeader("database") + "[]\n"));
    assert.equal(memory.files.get(filePath), makeHeader("file"));
    assert.equal(await openMarkDB(adapter, jsonPath, { format: "json" }), json);
    await assert.rejects(() => openMarkDB(adapter, jsonPath, { format: "file" }), MarkDBFormatMismatchError);
});

void test("openMarkDB rejects invalid stored files before registry registration", async () => {
    const memory = new MemoryAdapter();
    const adapter = memory.asDataAdapter();
    const mismatchPath = uniquePath("mismatch");
    const corruptPath = uniquePath("corrupt");
    memory.set(mismatchPath, makeHeader("file"));
    memory.set(corruptPath, makeHeader("json") + "{");

    await assert.rejects(() => openMarkDB(adapter, mismatchPath, { format: "json" }), MarkDBFormatMismatchError);
    await assert.rejects(() => openMarkDB(adapter, corruptPath, { format: "json" }), /Invalid JSON body/);
    assert.equal(markDBRegistry.has(mismatchPath), false);
    assert.equal(markDBRegistry.has(corruptPath), false);
});

void test("openMarkDB does not register a file when creating it fails", async () => {
    const memory = new MemoryAdapter();
    const path = uniquePath("create-write-failure");
    memory.failWrite = true;

    await assert.rejects(
        () => openMarkDB(memory.asDataAdapter(), path, { format: "json", create: true }),
        /write failed/,
    );
    assert.equal(markDBRegistry.has(path), false);
});
