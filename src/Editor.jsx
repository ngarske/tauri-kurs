import { invoke } from "@tauri-apps/api";
import { useEffect, useState } from "react";
import { writeText } from "@tauri-apps/api/clipboard";
import {
    isPermissionGranted,
    requestPermission,
    sendNotification
} from "@tauri-apps/api/notification"
import { useLoaderData } from "react-router-dom";
import { updateNoteDB } from "./functions/db";
import { listen } from "@tauri-apps/api/event";
import {save} from "@tauri-apps/api/dialog"
import {writeTextFile} from "@tauri-apps/api/fs"
import { supabase } from "./functions/supabaseClient";


export async function loader({ params }){
    const noteID = params.noteID;
    return { noteUUID: noteID}
}

function Editor() {
    const { noteUUID } = useLoaderData();
    const [note, setNote] = useState("No text");
    const [isRendered, setRender] = useState(false);
    const [markdownHTML, setMarkdownHTML] = useState("");
    const [menuEventPayload, setEventPayload] = useState("");

    useEffect(() => {
        loadNoteFromDB()

        let unlisten;

        unlisten = listen("tauri://menu", (e) => {
            setEventPayload({payload: e.payload, id: e.id})
        })

        return() => {
            if (unlisten) {
                unlisten.then(resolvedUnlisten => typeof resolvedUnlisten === "function" && resolvedUnlisten())
            }
        };

    }, [])

    useEffect(() => {
        if (menuEventPayload === "") {
            return;
        }
        const menuPayload = menuEventPayload.payload
        switch (menuPayload) {
            case "export":
                saveToFile();
                break;
            default:
                break;
        }
    }, [menuEventPayload])

    async function saveToFile() {
        try { 
            let filepath = await save({
                filters: [{name: "Markdown", extensions: ["md"]}]
            });
            await writeTextFile({contents: note, path: filepath});
        } catch(e) {
            console.log(e)
        }
    }

    async function loadNoteFromDB() {
        const {data, error} = await supabase.from("notes").select().eq("note_id", noteUUID)
        setNote(data[0].note_text)
      }

    async function renderMarkdown() {
        if (!isRendered) {
            const response = await invoke("convert_markdown", {text: note});
            setMarkdownHTML({__html: response});
        }
        setRender(!isRendered);
    }

    return(
        <div className="m-2">
            <div className="flex justify-between items-center pb-2">
                <h1>Editor</h1>
                <div className="join">
                    <label className="btn btn-sm join-item swap">
                        <input
                            onChange={async () => {
                                await renderMarkdown();
                            }}
                            type="checkbox"
                        >
                        </input>
                        <div className="swap-on">HTML</div>
                        <div className="swap-off">MD</div>
                    </label>
                    <button className="btn btn-sm join-item" onClick={async () => {
                        await writeText(note);
                        let permissionGranted = await isPermissionGranted()
                        if (!permissionGranted) {
                            const permission = await requestPermission()
                            permissionGranted = permission === "granted";
                        }
                        if (permissionGranted) {
                            sendNotification({title: "notes", body:"Copy text!"})
                        }
                    }}>Copy</button>
                    <button className="btn btn-sm join-item" onClick={async () => {
                        await updateNoteDB(noteUUID, note)
                    }}>Save</button>
                </div>
            </div>
            {isRendered ?
            <div className="prose" dangerouslySetInnerHTML={markdownHTML}></div>
            :
                <textarea value={note} onChange={(e) => {setNote(e.target.value)}} className="w-full" rows={20} />
            }
        </div>
    )
}

export default Editor;