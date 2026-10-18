import type { DataAdapter } from "obsidian";
import { MarkDBFile } from "./markdb-file";
import { makeHeader, parseHeader } from "./parser";
import { readContents, writeContents } from "./storage";
import { MarkDBCorruptionError } from "./types";

export class JsonMarkDB extends MarkDBFile {
	constructor(adapter: DataAdapter, path: string) {
		super(adapter, path, "json");
	}

	protected async validate(contents: string): Promise<void> {
		const { body } = parseHeader(contents);
		this.parse(body);
	}

	async read(): Promise<unknown> {
		const { body } = parseHeader(await readContents(this.adapter, this.path));
		return this.parse(body);
	}

	async write(value: unknown): Promise<void> {
		const encoded = this.stringify(value);
		await this.writes.run(() => writeContents(this.adapter, this.path, makeHeader("json") + encoded + "\n"));
	}

	async update(updater: (value: unknown) => unknown): Promise<void> {
		await this.writes.run(async () => {
			const encoded = this.stringify(updater(await this.read()));
			await writeContents(this.adapter, this.path, makeHeader("json") + encoded + "\n");
		});
	}

	async forceUpdate(value: unknown): Promise<void> {
		await this.write(value);
	}

	private parse(body: string): unknown {
		try {
			return JSON.parse(body);
		} catch {
			throw new MarkDBCorruptionError("JSON MarkDB content is not valid JSON.", this.path);
		}
	}

	private stringify(value: unknown): string {
		const encoded = JSON.stringify(value);
		if (encoded === undefined) throw new MarkDBCorruptionError("JSON MarkDB values must be JSON-serializable.", this.path);
		return encoded;
	}
}
