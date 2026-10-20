import { MarkDBIncompatibleVersionError, MarkDBInvalidHeaderError } from "./error";
import type { MarkDBFormat, MarkDBHeader } from "./types";

/**
 * MarkDB file format versions supported by this implementation,
 * ordered from newest to oldest.
 *
 * Versions omitted from this list are considered unsupported,
 * even if they fall between supported versions.
*/
const SUPPORTED_VERSIONS = [1] as const;
const MARKDB_VERSION = 1;
const HEADER_PATTERN = /^<!-- markdb: v(\d+); type: (json|database|file) -->\n/;

/**
 * The generated header uses the latest MarkDB version and ends
 * with a newline separating the header from the body.
 * // Returns: "<!-- markdb: v1; type: json -->\n"
 */
function makeHeader(format: MarkDBFormat): string {
	return `<!-- markdb: v${MARKDB_VERSION}; type: ${format} -->\n`;
}

/**
 * Parses and validates the common MarkDB header.
 *
 * Extracts the header metadata and returns the remaining content
 * without parsing or modifying the format-specific body.
 *
 * Only versions listed in SUPPORTED_VERSIONS are accepted.
 *
 * @param contents - Complete MarkDB file contents.
 * @returns The parsed header and the remaining body.
 *
 * @throws {MarkDBInvalidHeaderError}
 * If the contents do not begin with a valid MarkDB header.
 *
 * @throws {MarkDBIncompatibleVersionError}
 * If the header specifies an unsupported MarkDB version.
 *
 * @example
 * const result = parseHeader(
 *     "<!-- markdb: v1; type: json -->\n{\"name\":\"Akki\"}"
 * );
 *
 * // result.header -> { version: 1, format: "json" }
 * // result.body   -> '{"name":"Akki"}'
 */
function parseHeader( contents: string ): { header: MarkDBHeader; body: string } {
	const match = HEADER_PATTERN.exec(contents);

	if (!match) {
		throw new MarkDBInvalidHeaderError(
			"Invalid MarkDB header. Expected '<!-- markdb: vN; type: json|database|file -->'.",
		);
	}

	const version = Number(match[1]);
	if (!(SUPPORTED_VERSIONS as readonly number[]).includes(version)) {
		throw new MarkDBIncompatibleVersionError(
			`Unsupported MarkDB file version: v${version}.`,
		);
	}

	const format = match[2] as MarkDBFormat;
	return {
		header: { version, format },
		body: contents.slice(match[0].length),
	};
}

export {
	MARKDB_VERSION,
	SUPPORTED_VERSIONS,
	makeHeader,
	parseHeader
}