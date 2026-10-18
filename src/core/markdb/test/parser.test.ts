
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { 
	MARKDB_VERSION, 
	SUPPORTED_VERSIONS, 
	makeHeader,
	parseHeader
} from "@/core/markdb/parser"

import { 
	MarkDBIncompatibleVersionError, 
	MarkDBInvalidHeaderError 
} from "@/core/markdb/types";


describe("MarkDB version configuration", () => {

	it("should define MARKDB_VERSION as a number", () => {
		assert.equal(typeof MARKDB_VERSION, "number");
	});

	it("should have at least one supported version", () => {
		assert.ok(SUPPORTED_VERSIONS.length > 0);
	});

	it("should set MARKDB_VERSION to the first supported version", () => {
		assert.equal(MARKDB_VERSION, SUPPORTED_VERSIONS[0]);
	});

	it("should list supported versions in descending order", () => {
		assert.deepEqual(
			[...SUPPORTED_VERSIONS].sort((a, b) => b - a),
			SUPPORTED_VERSIONS,
		);
	});
    
	it("should contain only positive integers", () => {
		for (const version of SUPPORTED_VERSIONS) {
			assert.ok(Number.isInteger(version));
			assert.ok(version > 0);
		}
	});
});

describe("makeHeader", () => {
	it("should use the latest MarkDB version", () => {
		assert.equal(
			makeHeader("json"),
			`<!-- markdb: v${MARKDB_VERSION}; type: json -->\n`,
		);
	});
});


describe("parseHeader", () => {
	it("should accept the latest supported version", () => {
		const contents = makeHeader("json") + '{"name":"Akki"}';
		const result = parseHeader(contents);

		assert.equal(result.header.version, MARKDB_VERSION);
		assert.equal(result.header.format, "json");
		assert.equal(result.body, '{"name":"Akki"}');
	});

	it("should reject an unsupported version", () => {
		const contents = "<!-- markdb: v999; type: json -->\n{}";

		assert.throws(
			() => parseHeader(contents),
			MarkDBIncompatibleVersionError,
		);
	});

	it("should reject an invalid header", () => {
		assert.throws(
			() => parseHeader("This is not a MarkDB file"),
			MarkDBInvalidHeaderError,
		);
	});
});