import type { MarkDBFormat } from "./types";

/**
 * MarkDB Instance Registry
 *
 * Maintains a shared registry of opened MarkDB instances, indexed by path.
 * Each entry stores the instance alongside its associated data format.
 *
 * Provides methods to register instances, retrieve existing instances
 * and formats, and check whether a path is already registered.
 *
 * The registry is shared across the module to prevent duplicate
 * registrations and allow consistent access to opened instances.
 */

type MarkDBInstance = object;
interface RegistryEntry {
    instance: MarkDBInstance;
    format: MarkDBFormat;
}


/**
 * Manages opened MarkDB instances and their associated formats.
 *
 * Each instance is registered by path, allowing it to be retrieved
 * or checked without creating a duplicate entry.
 */
class MarkDBRegistry {
    private readonly instances = new Map<string, RegistryEntry>();

    /** Returns the instance registered at the given path. */
    get(path: string): MarkDBInstance | undefined {
        return this.instances.get(path)?.instance;
    }

    /** Returns the format of the instance registered at the given path. */
    getFormat(path: string): MarkDBFormat | undefined {
        return this.instances.get(path)?.format;
    }

    /** Checks whether an instance is registered at the given path. */
    has(path: string): boolean {
        return this.instances.has(path);
    }

    /** Registers an instance and its format for the given path. */
    register(path: string, format: MarkDBFormat, instance: MarkDBInstance ): void {
        this.instances.set(path, { instance, format });
    }
}


const registry = new MarkDBRegistry();

export const markDBRegistry = Object.freeze({
    get: (path: string) => registry.get(path),
    getFormat: (path: string) => registry.getFormat(path),
    has: (path: string) => registry.has(path),
    register: (path: string, format: MarkDBFormat, instance: MarkDBInstance ) => registry.register(path, format, instance),
});

export default markDBRegistry