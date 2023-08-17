import { useEffect, useState } from "react";
import Database from "tauri-plugin-sql-api";
import { addNoteDB, getSearch, removeNoteDB } from "./functions/db";
import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";

function App() {

  const [notes, setNotes] = useState([]);
  const [db, setDB] = useState("");
  const [listOfOpenWindows, setListOfOpenWindows] = useState([]);

  useEffect(() => {
    createDB();
  }, [])

  useEffect(() => {
    if (db === "") {
      return;
    }
    const unlistenPromises = [];

    unlistenPromises.push(listen("db", (e) => {
      loadNotes(db)
    }))

    unlistenPromises.push(listen("tauri://close-requested", (e) => {
      setListOfOpenWindows(listOfOpenWindows.filter((items) => items != e.windowLabel))
    }))

    return () => {
      unlistenPromises.forEach(unlistenPromises => {
        unlistenPromises.then(resolvedUnlisten => typeof resolvedUnlisten === "function" && resolvedUnlisten())
      })
    }

  }, [db, listOfOpenWindows])


  async function createDB() {
    const loadedDB = await Database.load("sqlite:test.db");
    const _first_load = await loadedDB.execute(
      "CREATE TABLE IF NOT EXISTS notes (note_id CHAR NOT NULL PRIMARY KEY, note_text TEXT DEFAULT NULL);"
    );
    setDB(loadedDB);
    loadNotes(loadedDB);
  }

  async function loadNotes(db) {
    const result = await db.select("SELECT * FROM notes");
    setNotes(result)
  }

  async function handleSearch(event) {
    const result = await getSearch(db, event.target.value);
    setNotes(result);
  }

  async function handleRemoveNote(uuid)  {
    await removeNoteDB(db, uuid);
    await loadNotes(db);
  }

  async function addNote() {
    const newID = crypto.randomUUID();
    await addNoteDB(db, newID, "");
    await loadNotes(db);
  }

  async function handleOpenWindow(uuid) {
    if (listOfOpenWindows.includes(uuid)) {
      return;
    }

    setListOfOpenWindows([...listOfOpenWindows, uuid])
    await invoke("open_editor", {editorId: String(uuid)})
  }

  return (
    <div className="bg-gray-700 h-screen p-2">
      <div className="flex flex-row justify-between items-center">
        <h1 className="text-white font-bold text-xl">All notes</h1>
        <button className="btn btn-sm btn-square btn-ghost" onClick={() => {addNote()}}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg></button>
      </div>
      <input onChange={async (e) => {await handleSearch(e)}} className="my-2 w-full input input-sm"></input>
      {
        notes.map((item) => (
          <div key={item.note_id} className="px-2 flex flex-row justify-between items-center bg-green-200 border-4 border-green-500 my-2">
            <div onClick={async () => {await handleOpenWindow(item.note_id)}} className="cursor-pointer w-full h-full min-h-6"><h2>{item.note_text}</h2></div>
            <button onClick={async () => {await handleRemoveNote(item.note_id)}} className="btn btn-sm btn-ghost btn-square"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg></button>
          </div>

        ))
      }
    </div>
  );
}

export default App;
