import { emit } from "@tauri-apps/api/event";
import { supabase } from "./supabaseClient";

export async function getSearch(searchInput) {
    const { data, error } = await supabase.from("notes").select().like("note_text", `%${searchInput}%`)
    return data;
}

export async function addNoteDB() {    
    const userID = (await supabase.auth.getUser()).data.user.id
    const { data, error } = await supabase
    .from('notes')
    .insert([{user_id: userID}])
    .select();

    console.log(data)

    return data;
}

export async function updateNoteDB(uuid, text) {
    
    const { data, error } = await supabase
    .from('notes')
    .update({ note_text: text })
    .eq("note_id", uuid)
    .select()

    await emit("db", {message: "save"});
    return data;
}

export async function removeNoteDB(uuid) {
    
    const { error } = await supabase
    .from('notes')
    .delete()
    .eq("note_id", uuid)
}



