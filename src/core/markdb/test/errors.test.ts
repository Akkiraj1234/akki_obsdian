/* eslint-disable import/no-nodejs-modules */
import assert from "node:assert/strict";
import test from "node:test";
import { MarkDBFileNotFoundError, MarkDBError } from "../error";

void test("specialized MarkDB errors preserve their identity and details", () => {
    const error = new MarkDBFileNotFoundError("Missing database", "data/example.mdb");

    assert.equal(error.message, "Missing database");
    assert.equal(error.path, "data/example.mdb");
    assert.equal(error.name, "MarkDBFileNotFoundError");
    assert.ok(error instanceof MarkDBFileNotFoundError);
    assert.ok(error instanceof MarkDBError);
    assert.ok(error instanceof Error);
});
