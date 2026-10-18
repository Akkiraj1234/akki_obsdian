import type { DataAdapter } from "obsidian";

import { readContents } from "./storage";
import { parseHeader } from "./parser";
import { MarkDBFormatMismatchError } from "./types";
import type { MarkDBFormat } from "./types";
import { WriteQueue } from "./write-queue";


/**
 * Base class for MarkDB files, providing shared file metadata,
 * write coordination, and health-check behavior.
 *
 * Concrete implementations define their own content validation
 * through {@link validate}, while this class handles common
 * header and format validation.
 *
 * Each instance represents a MarkDB file identified by its
 * adapter and vault-relative path.
 */
export abstract class MarkDBFile {
	protected readonly writes = new WriteQueue();

	protected constructor(
		public readonly adapter: DataAdapter,
		public readonly path: string,
		public readonly format: MarkDBFormat,
		public readonly create: boolean = true,
	) {}

	async checkHealth(): Promise<void> {
		try {
			const contents = await readContents(this.adapter, this.path);
		} catch (MarkDBFileNotFoundError){
			if (!this.create) throw MarkDBFileNotFoundError
			create
		}
		const { header } = parseHeader(contents);

		if (header.format !== this.format) {
			throw new MarkDBFormatMismatchError(
				`Expected ${this.format} MarkDB file, found ${header.format}.`,
				this.path,
			);
		}

		await this.validate(contents);
	}

	protected abstract validate(contents: string): Promise<void>;
}