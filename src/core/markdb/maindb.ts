import type { Vault } from 'obsidian';
import { z } from 'zod';
import { openMarkDB, type DatabaseMarkDB } from './index';

const hobbySchema = z.strictObject({
    id: z.number().int().positive(),
    name: z.string().trim().min(1).max(100),
    category: z.enum(['hobby', 'skill']),
    description: z.string(),
    unit: z.string(),
    target: z.number(),
});

export type Hobby = z.infer<typeof hobbySchema>;
export type HobbyInput = Omit<Hobby, 'id'>;

/** Hobby-specific operations stored in one MarkDB database file. */
export class MarkDb {
    private database?: DatabaseMarkDB<Hobby>;
    private storagePath: string;

    constructor(private readonly vault: Vault, storagePath: string) {
        this.storagePath = storagePath;
    }

    setStoragePath(storagePath: string): void {
        this.storagePath = storagePath;
        this.database = undefined;
    }

    async loadHobbies(): Promise<Hobby[]> {
        const hobbies = await (await this.getDatabase()).read();
        return [...hobbies].sort((left, right) => left.id - right.id);
    }

    async createHobby(input: HobbyInput): Promise<Hobby> {
        const database = await this.getDatabase();
        const hobbies = await database.read();
        const hobby = hobbySchema.parse({
            ...input,
            id: hobbies.reduce((maximum, current) => Math.max(maximum, current.id), 0) + 1,
        });
        await database.write([...hobbies, hobby]);
        await database.force_save();
        return hobby;
    }

    async deleteHobby(id: number): Promise<void> {
        const database = await this.getDatabase();
        const hobbies = await database.read();
        await database.write(hobbies.filter((hobby) => hobby.id !== id));
        await database.force_save();
    }

    private async getDatabase(): Promise<DatabaseMarkDB<Hobby>> {
        if (this.database) return this.database;

        const folderPath = this.storagePath.trim().replace(/\\/g, '/').replace(/\/$/, '');
        if (folderPath) await this.ensureFolder(folderPath);
        const path = folderPath ? `${folderPath}/hobbies.mdb` : 'hobbies.mdb';
        this.database = await openMarkDB(this.vault, path, {
            format: 'database',
            schema: hobbySchema,
            create: true,
        });
        return this.database;
    }

    private async ensureFolder(path: string): Promise<void> {
        let current = '';
        for (const part of path.split('/').filter(Boolean)) {
            current = current ? `${current}/${part}` : part;
            if (!await this.vault.adapter.exists(current)) await this.vault.createFolder(current);
        }
    }
}