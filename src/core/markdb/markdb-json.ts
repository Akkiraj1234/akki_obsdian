import type { DataAdapter } from "obsidian";
import { readContents } from "./helper";
import { parseHeader } from "./parser";
import { MarkDBCorruptionError, MarkDBInvalidHeaderError } from "./error";


class JsonMarkDB {
    private let virtual_data: object
    private let dirty: boolean

    constructor(
        private readonly adapter: DataAdapter,
        private readonly path: string,
    ) {}

    async read() : Promise<unknown> {
        const { body } = parseHeader(await readContents(this.adapter, this.path));
    }
    
    async checkHealth(): Promise<void> {
        let contents: string;

        try {
            contents = await readContents(this.adapter, this.path);
        } catch (error) {
            throw error;
        }

        let body: string;

        try {
            const parsed = parseHeader(contents);

            if (parsed.header.format !== "json") {
                throw new MarkDBInvalidHeaderError(
                    `Expected a JSON MarkDB file: "${this.path}".`,
                    this.path,
                );
            }

            body = parsed.body;

        } catch (error) {
            if (error instanceof MarkDBInvalidHeaderError) {
                throw error;
            }

            throw error;
        }

        try {
            JSON.parse(body);
        } catch {
            throw new MarkDBCorruptionError(
                `Invalid JSON body in MarkDB file: "${this.path}".`,
                this.path,
            );
        }
    }
}

function makeJsonBody(data: object): string {
    return JSON.stringify(data, null, 4) + "\n";
}

export { JsonMarkDB, makeJsonBody };