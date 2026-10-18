/* eslint-disable import/no-nodejs-modules, obsidianmd/ui/sentence-case -- Node's harness and fixed file-format fixtures are test-only. */
/* Test-only Node imports. Runtime MarkDB modules use only Obsidian adapters. */
import assert from "node:assert/strict";
import test from "node:test";
import type { DataAdapter } from "obsidian";
import { z } from "zod";
import { MarkDB } from "../markdb";
import { MarkDBCorruptionError, MarkDBFileNotFoundError, MarkDBFormatMismatchError, MarkDBInvalidHeaderError, MarkDBSchemaError } from "../types";

class MemoryAdapter {
	private readonly files = new Map<string, string>();
	asDataAdapter(): DataAdapter { return this as unknown as DataAdapter; }
	setText(path: string, value: string): void { this.files.set(path, value); }
	async exists(path: string): Promise<boolean> { return this.files.has(path); }
	async stat(path: string): Promise<{ type: "file"; ctime: number; mtime: number; size: number } | null> {
		const contents = this.files.get(path);
		return contents === undefined ? null : { type: "file", ctime: 0, mtime: 0, size: contents.length };
	}
	async read(path: string): Promise<string> {
		const contents = this.files.get(path);
		if (contents === undefined) throw new Error(`Missing test file: ${path}`);
		return contents;
	}
	async write(path: string, data: string): Promise<void> { this.files.set(path, data); }
	async readBinary(path: string): Promise<ArrayBuffer> { return new TextEncoder().encode(await this.read(path)).buffer; }
	async writeBinary(path: string, data: ArrayBuffer): Promise<void> { this.files.set(path, new TextDecoder().decode(data)); }
}

function testAdapter(): DataAdapter { return new MemoryAdapter().asDataAdapter(); }
function mutableAdapter(adapter: DataAdapter): MemoryAdapter { return adapter as unknown as MemoryAdapter; }

void test("creates and reopens JSON through a vault adapter", async () => {
	const adapter = testAdapter();
	const json = await MarkDB.open(adapter, "markdb/data.mdb", { format: "json", create: true });
	await json.write({ enabled: true });
	assert.deepEqual(await json.read(), { enabled: true });
	const reopened = await MarkDB.open(adapter, "markdb/data.mdb", { format: "json" });
	assert.deepEqual(await reopened.read(), { enabled: true });
});

void test("creates and schema-validates database records", async () => {
	const adapter = testAdapter();
	const schema = z.object({ id: z.string() });
	const database = await MarkDB.open(adapter, "data.mdb", { format: "database", schema, create: true });
	await database.update({ id: "one" });
	assert.deepEqual(await database.read(), [{ id: "one" }]);
	await assert.rejects(() => database.forceUpdate([{ id: 3 } as unknown as { id: string }]), MarkDBSchemaError);
});

void test("creates a file with a 16 KiB index manager", async () => {
	const file = await MarkDB.open(testAdapter(), "data.mdb", { format: "file", create: true });
	assert.equal(file.blockSize, 16 * 1024);
	assert.deepEqual(file.getIndexManagers(), [{ id: 0, next: null, entries: [] }]);
});

void test("rejects missing, incompatible, invalid header, and corrupt files", async () => {
	const adapter = testAdapter();
	const memory = mutableAdapter(adapter);
	await assert.rejects(() => MarkDB.open(adapter, "data.mdb", { format: "json" }), MarkDBFileNotFoundError);
	memory.setText("data.mdb", "not a MarkDB file\n");
	await assert.rejects(() => MarkDB.open(adapter, "data.mdb", { format: "json" }), MarkDBInvalidHeaderError);
	memory.setText("data.mdb", "<!-- markdb: v1; type: json -->\nnull\n");
	await assert.rejects(() => MarkDB.open(adapter, "data.mdb", { format: "database", schema: z.object({}) }), MarkDBFormatMismatchError);
	memory.setText("data.mdb", "<!-- markdb: v1; type: database -->\n[]\n<!-- markdb-database-metadata: v1; {\"version\":1,\"recordCount\":2} -->\n");
	await assert.rejects(() => MarkDB.open(adapter, "data.mdb", { format: "database", schema: z.object({}) }), MarkDBCorruptionError);
	memory.setText("data.mdb", "<!-- markdb: v1; type: database -->\n[{\"id\":3}]\n<!-- markdb-database-metadata: v1; {\"version\":1,\"recordCount\":1} -->\n");
	await assert.rejects(() => MarkDB.open(adapter, "data.mdb", { format: "database", schema: z.object({ id: z.string() }) }), MarkDBSchemaError);
	memory.setText("data.mdb", "<!-- markdb: v1; type: file -->\n<!-- markdb-file-metadata: v1; {\"version\":1,\"blockSize\":16384,\"indexManagers\":[{\"id\":0,\"next\":9,\"entries\":[]}]} -->\n");
	await assert.rejects(() => MarkDB.open(adapter, "data.mdb", { format: "file" }), MarkDBCorruptionError);
});
