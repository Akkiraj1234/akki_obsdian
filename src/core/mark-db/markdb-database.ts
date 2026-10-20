import { DataAdapter } from "obsidian"
import { RecordSchema } from "./types"



class DatabaseMarkDB {
    constructor (adapter:DataAdapter, Path: string, schema: RecordSchema) {}

    async checkHealth() {
        
    }
}

function makeDatabaseBody(data: unknown[], schema?: RecordSchema) {

}


export {
    DatabaseMarkDB,
    makeDatabaseBody
}


    