import { Plugin } from 'obsidian';


export default class AkkiObsidianApp{

    constructor(private plugin: Plugin, private features: any) {
    }

    async on_load(): Promise<void> {
        console.log("AkkiObsidianApp: on_load");
    }
    
    async on_unload(): Promise<void> {
        console.log("AkkiObsidianApp: on_unload");
    }

    async load_data(): Promise<void> {}
    async load_features(): Promise<void> {}
    async load_settings(): Promise<void> {}
    async load_commands(): Promise<void> {}
    async save_data(): Promise<void> {}
    async save_settings(): Promise<void> {}
    async unload_settings(): Promise<void> {}
    async unload_features(): Promise<void> {}
}