// import { hobbySchema, type Hobby } from "./scema"
// import { MarkDB, type MarkDBType } from "@/core/markdb/index"

// const INDEX_FILE_NAME = 'HobbyList.md'


// class HobbyDB {
//     hobbydb: MarkDBType | null = null
//     root_path: string = ''
//     cashed = null;
//     database = null;

//     constructor(root_path: string) {
//         this.root_path = root_path
//         this.initializeMarkDbInstance()
//     }

//     initializeMarkDbInstance() {
//         path = `${this.root_path}/${INDEX_FILE_NAME}`
//         this.hobbydb = new MarkDB(path, hobbySchema, type = "db")
//     }

//     isHobbyIndexExists() {
//         return this.database.exists(this.index_file_name);
//     }

//     LoadHobbyList() {
//         if (!this.isHobbyIndexExists()) {
//             this.database.create(INDEX_FILE_NAME)
//         }
//         this.cashed = this.database.readall(this.index_file_name)
//     }

//     add_hobby(
//         name: string,
        
//     ) {
//         if (!this.cashed){
//             return
//         }

//         if this.cashed.exists(name){
//             return "already exists"
//         }

//         cashed
//     }
// }