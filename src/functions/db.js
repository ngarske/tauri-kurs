import { emit } from "@tauri-apps/api/event";

export async function getSearch(db, searchInput) {
    const result = await db.select(
        `SELECT * FROM notes WHERE note_text like '%${searchInput}%'`
    );
    return result;
}

export async function addNoteDB(db, uuid, text) {
    const result = await db.execute(
        "INSERT into notes (note_id, note_text) VALUES ($1, $2);", 
        [uuid, text]
    )
    return result;
}

export async function updateNoteDB(db, uuid, text) {
    const result = await db.execute(
        "UPDATE notes SET note_text = $2 WHERE note_id = $1;", 
        [uuid, text]
    );
    await emit("db", {message: "save"});
    return result;
}

export async function removeNoteDB(db, uuid) {
    const result = await db.execute(
        "DELETE FROM notes WHERE note_id = $1;", 
        [uuid]
    )
    return result;
}



