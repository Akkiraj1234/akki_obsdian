import type { DataAdapter } from "obsidian";
import { MarkDBFile } from "./markdb-file";
import { MARKDB_VERSION, parseHeader } from "./parser";
import { MarkDBCorruptionError, MarkDBFormatMismatchError, MarkDBIncompatibleVersionError } from "./types";
import type { FileIndexManager, FileMetadata } from "./types";

export const DEFAULT_BLOCK_SIZE = 16 * 1024;
const METADATA_FOOTER = /^<!-- markdb-file-metadata: v(\d+); (.+) -->$/;

export class FileMarkDB extends MarkDBFile {
	private managers: FileIndexManager[] = [];

	constructor(adapter: DataAdapter, path: string, readonly blockSize: number) {
		super(adapter, path, "file");
	}

	protected async validate(contents: string): Promise<void> {
		const metadata = parseFileBody(parseHeader(contents).body);
		if (metadata.blockSize !== this.blockSize) throw new MarkDBFormatMismatchError(`Block size does not match this file (${metadata.blockSize} bytes).`, this.path);
		validateIndexManagers(metadata);
		this.managers = metadata.indexManagers;
	}

	getIndexManagers(): readonly FileIndexManager[] {
		return this.managers;
	}
}

export function makeFileBody(blockSize: number): string {
	const metadata: FileMetadata = { version: 1, blockSize, indexManagers: [{ id: 0, next: null, entries: [] }] };
	return `\n<!-- markdb-file-metadata: v1; ${JSON.stringify(metadata)} -->\n`;
}

function parseFileBody(body: string): FileMetadata {
	const trimmed = body.endsWith("\n") ? body.slice(0, -1) : body;
	const boundary = trimmed.lastIndexOf("\n");
	if (boundary < 0) throw new MarkDBCorruptionError("Missing file metadata footer.");
	if (trimmed.slice(0, boundary) !== "") throw new MarkDBCorruptionError("Block data is not supported by this MarkDB version.");
	const match = METADATA_FOOTER.exec(trimmed.slice(boundary + 1));
	if (!match) throw new MarkDBCorruptionError("Invalid file metadata footer.");
	if (Number(match[1]) !== MARKDB_VERSION) throw new MarkDBIncompatibleVersionError(`Unsupported file metadata version: v${match[1]}.`);
	try {
		const metadata = JSON.parse(match[2]) as FileMetadata;
		if (metadata.version !== 1 || !Number.isSafeInteger(metadata.blockSize) || metadata.blockSize <= 0 || !Array.isArray(metadata.indexManagers)) throw new MarkDBCorruptionError("Invalid file metadata.");
		return metadata;
	} catch (error) {
		if (error instanceof MarkDBCorruptionError) throw error;
		throw new MarkDBCorruptionError("Invalid JSON in file metadata.");
	}
}

function validateIndexManagers(metadata: FileMetadata): void {
	if (metadata.indexManagers.length === 0 || metadata.indexManagers[0]?.id !== 0) throw new MarkDBCorruptionError("File index must start with manager 0.");
	const ids = new Set<number>();
	for (const manager of metadata.indexManagers) {
		if (!Number.isSafeInteger(manager.id) || ids.has(manager.id) || !Array.isArray(manager.entries)) throw new MarkDBCorruptionError("Invalid file index manager.");
		ids.add(manager.id);
		for (const entry of manager.entries) if (!entry.key || !Number.isSafeInteger(entry.block) || entry.block < 0 || !Number.isSafeInteger(entry.length) || entry.length < 0) throw new MarkDBCorruptionError("Invalid file index entry.");
	}
	for (const manager of metadata.indexManagers) if (manager.next !== null && (!Number.isSafeInteger(manager.next) || !ids.has(manager.next))) throw new MarkDBCorruptionError("File index manager references a missing successor.");
}
