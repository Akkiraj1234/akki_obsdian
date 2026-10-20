/* eslint-disable import/no-nodejs-modules */
import assert from "node:assert/strict";
import test from "node:test";
import type { DataAdapter } from "obsidian";
import { z } from "zod";
import { MarkDBCorruptionError, MarkDBError, MarkDBInvalidHeaderError, MarkDBSchemaError } from "../error";
import { DatabaseMarkDB, makeDatabaseBody, parseDatabaseBody } from "../markdb-database";
import { FileMarkDB, makeFileBody } from "../markdb-file";
import { JsonMarkDB } from "../markdb-json";
import { makeHeader } from "../parser";

class MemoryAdapter {
    readonly files = new Map<string, string>();
    reads = 0;
    writes = 0;
    failWrite = false;

    asDataAdapter(): DataAdapter { return this as unknown as DataAdapter; }
    set(path: string, contents: string): void { this.files.set(path, contents); }
    async stat(path: string): Promise<{ type: "file"; ctime: number; mtime: number; size: number } | null> {
        const data = this.files.get(path);
        return data === undefined ? null : { type: "file", ctime: 0, mtime: 0, size: data.length };
    }
    async read(path: string): Promise<string> {
        this.reads += 1;
        const data = this.files.get(path);
        if (data === undefined) throw new Error("missing file");
        return data;
    }
    async write(path: string, contents: string): Promise<void> {
        this.writes += 1;
        if (this.failWrite) throw new Error("write failed");
        this.files.set(path, contents);
    }
}

void test("JsonMarkDB caches reads and keeps writes in memory until saved", async () => {
    const memory = new MemoryAdapter();
    const adapter = memory.asDataAdapter();
    memory.set("json.mdb", makeHeader("json") + '{"one":1,"two":2}\n');
    const database = new JsonMarkDB<Record<string, number>>(adapter, "json.mdb");

    assert.deepEqual(await database.read(), { one: 1, two: 2 });
    const readsAfterLoad = memory.reads;
    assert.deepEqual(await database.read(), { one: 1, two: 2 });
    assert.equal(memory.reads, readsAfterLoad);
    await database.update((value) => ({ ...value, three: 3 }));
    await database.delete("two");
    assert.deepEqual(await database.read(), { one: 1, three: 3 });
    assert.equal(memory.writes, 0);
    await database.force_save();
    assert.equal(memory.files.get("json.mdb"), makeHeader("json") + '{\n    "one": 1,\n    "three": 3\n}\n');
    const writesAfterSave = memory.writes;
    await database.force_save();
    assert.equal(memory.writes, writesAfterSave);
});

void test("JsonMarkDB deletes arrays and rejects invalid data or file contents", async () => {
    const memory = new MemoryAdapter();
    const adapter = memory.asDataAdapter();
    memory.set("array.mdb", makeHeader("json") + "[1,2,3]\n");
    const array = new JsonMarkDB<number[]>(adapter, "array.mdb");
    await array.delete(1);
    assert.deepEqual(await array.read(), [1, 3]);
    await assert.rejects(() => array.delete(-1), MarkDBError);
    await assert.rejects(() => array.delete(0.5), MarkDBError);
    await assert.rejects(() => array.delete(2), MarkDBError);

    const scalar = new JsonMarkDB<number>(adapter, "array.mdb");
    await scalar.write(1);
    await assert.rejects(() => scalar.delete(0), MarkDBError);
    await assert.rejects(() => scalar.write(undefined as never), MarkDBCorruptionError);

    memory.set("bad.mdb", makeHeader("file") + "raw");
    await assert.rejects(() => new JsonMarkDB(adapter, "bad.mdb").checkHealth(), MarkDBInvalidHeaderError);
    memory.set("bad.mdb", "not a header");
    await assert.rejects(() => new JsonMarkDB(adapter, "bad.mdb").read(), MarkDBInvalidHeaderError);
    memory.set("bad.mdb", makeHeader("json") + "{");
    await assert.rejects(() => new JsonMarkDB(adapter, "bad.mdb").read(), MarkDBCorruptionError);
    await assert.rejects(() => new JsonMarkDB(adapter, "bad.mdb").checkHealth(), MarkDBCorruptionError);
});

void test("JsonMarkDB preserves dirty data after a failed save", async () => {
    const memory = new MemoryAdapter();
    const database = new JsonMarkDB<{ saved: boolean }>(memory.asDataAdapter(), "json.mdb");
    memory.set("json.mdb", makeHeader("json") + "{}\n");
    await database.write({ saved: true });
    memory.failWrite = true;
    await assert.rejects(() => database.force_save(), /write failed/);
    memory.failWrite = false;
    await database.force_save();
    assert.match(memory.files.get("json.mdb")!, /"saved": true/);
});

void test("FileMarkDB caches raw data, updates it, and deletes only the requested line", async () => {
    const memory = new MemoryAdapter();
    const adapter = memory.asDataAdapter();
    memory.set("file.mdb", makeHeader("file") + "one\ntwo\nthree\n");
    const database = new FileMarkDB(adapter, "file.mdb");
    assert.equal(await database.read(), "one\ntwo\nthree\n");
    const readsAfterLoad = memory.reads;
    assert.equal(await database.read(), "one\ntwo\nthree\n");
    assert.equal(memory.reads, readsAfterLoad);
    await database.update((data) => `${data}four\n`);
    await database.delete(1);
    assert.equal(await database.read(), "one\nthree\nfour\n");
    await assert.rejects(() => database.delete(-1), MarkDBError);
    await assert.rejects(() => database.delete(1.5), MarkDBError);
    await assert.rejects(() => database.delete(9), MarkDBError);
    await database.force_save();
    assert.equal(memory.files.get("file.mdb"), makeHeader("file") + "one\nthree\nfour\n");
    const writesAfterSave = memory.writes;
    await database.force_save();
    assert.equal(memory.writes, writesAfterSave);
    assert.equal(makeFileBody("exact\ntext"), "exact\ntext");
});

void test("FileMarkDB rejects wrong headers and retains changes after a failed save", async () => {
    const memory = new MemoryAdapter();
    const adapter = memory.asDataAdapter();
    memory.set("file.mdb", makeHeader("json") + "{}\n");
    await assert.rejects(() => new FileMarkDB(adapter, "file.mdb").checkHealth(), MarkDBInvalidHeaderError);
    memory.set("file.mdb", "not a header");
    await assert.rejects(() => new FileMarkDB(adapter, "file.mdb").read(), MarkDBInvalidHeaderError);
    memory.set("file.mdb", makeHeader("file"));
    const database = new FileMarkDB(adapter, "file.mdb");
    await database.write("pending");
    memory.failWrite = true;
    await assert.rejects(() => database.force_save(), /write failed/);
    memory.failWrite = false;
    await database.force_save();
    assert.equal(memory.files.get("file.mdb"), makeHeader("file") + "pending");
});

void test("FileMarkDB treats an empty body as having no deletable lines", async () => {
    const memory = new MemoryAdapter();
    memory.set("empty-file.mdb", makeHeader("file"));
    const database = new FileMarkDB(memory.asDataAdapter(), "empty-file.mdb");

    await assert.rejects(() => database.delete(0), MarkDBError);
    assert.equal(await database.read(), "");
});

void test("DatabaseMarkDB caches, validates, updates, deletes, and saves structured records", async () => {
    const memory = new MemoryAdapter();
    const schema = z.object({ id: z.string(), done: z.boolean() });
    const adapter = memory.asDataAdapter();
    memory.set("database.mdb", makeHeader("database") + makeDatabaseBody([{ id: "one", done: false }], schema));
    const database = new DatabaseMarkDB(adapter, "database.mdb", schema);
    assert.deepEqual(await database.read(), [{ id: "one", done: false }]);
    const readsAfterLoad = memory.reads;
    assert.deepEqual(await database.read(), [{ id: "one", done: false }]);
    assert.equal(memory.reads, readsAfterLoad);
    await database.update((records) => [...records, { id: "two", done: true }]);
    await database.delete((record) => record.id === "one");
    assert.deepEqual(await database.read(), [{ id: "two", done: true }]);
    await assert.rejects(() => database.write([{ id: 1, done: true }] as never), MarkDBSchemaError);
    await database.force_save();
    const parsed = parseDatabaseBody(memory.files.get("database.mdb")!.slice(makeHeader("database").length));
    assert.deepEqual(parsed.records, [{ id: "two", done: true }]);
    assert.equal(parsed.metadata.recordCount, 1);
    const writesAfterSave = memory.writes;
    await database.force_save();
    assert.equal(memory.writes, writesAfterSave);
});

void test("DatabaseMarkDB rejects invalid data and preserves dirty records after save failures", async () => {
    const memory = new MemoryAdapter();
    const schema = z.object({ id: z.string() });
    const adapter = memory.asDataAdapter();
    memory.set("database.mdb", makeHeader("database") + makeDatabaseBody([], schema));
    const database = new DatabaseMarkDB(adapter, "database.mdb", schema);
    await assert.rejects(() => database.update(() => [{ id: 1 }] as never), MarkDBSchemaError);
    await database.write([{ id: "pending" }]);
    memory.failWrite = true;
    await assert.rejects(() => database.force_save(), /write failed/);
    memory.failWrite = false;
    await database.force_save();
    assert.equal(parseDatabaseBody(memory.files.get("database.mdb")!.slice(makeHeader("database").length)).metadata.recordCount, 1);

    memory.set("bad.mdb", makeHeader("file"));
    await assert.rejects(() => new DatabaseMarkDB(adapter, "bad.mdb", schema).checkHealth(), MarkDBInvalidHeaderError);
    memory.set("bad.mdb", makeHeader("database") + "[\n<!-- markdb-database-metadata: v1; {\"version\":1,\"recordCount\":1} -->\n");
    await assert.rejects(() => new DatabaseMarkDB(adapter, "bad.mdb", schema).checkHealth(), MarkDBCorruptionError);
    memory.set("bad.mdb", makeHeader("database") + "[]\n<!-- markdb-database-metadata: v1; {\"version\":1,\"recordCount\":1} -->\n");
    await assert.rejects(() => new DatabaseMarkDB(adapter, "bad.mdb", schema).checkHealth(), MarkDBCorruptionError);
    memory.set("bad.mdb", makeHeader("database") + makeDatabaseBody([{ id: 1 }]));
    await assert.rejects(() => new DatabaseMarkDB(adapter, "bad.mdb", schema).checkHealth(), MarkDBSchemaError);
    assert.throws(() => parseDatabaseBody("[]"), MarkDBCorruptionError);
    assert.throws(() => parseDatabaseBody("[]\nnot a footer"), MarkDBCorruptionError);
});
