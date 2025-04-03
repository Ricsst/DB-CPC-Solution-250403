console.log("attachments.js wurde geladen!");

//#######################################################################################
// 2️⃣ Event Listener für den "Attachment erstellen"-Button
document.getElementById("create-attachment-button").addEventListener("click", async function () {
    const selectedTodoId = localStorage.getItem("selectedTodoId");
    const attachmentInput = document.getElementById("attachment-input")?.value || null; // Optionaler Wert

    console.log("📌 Gesendete todo_id:", selectedTodoId);
    console.log("📎 Gesendetes attachment:", attachmentInput);

    // Validierung der todo_id
    const todoId = parseInt(selectedTodoId);
    if (!selectedTodoId || isNaN(todoId)) {
        alert("⚠️ Kein gültiges Todo ausgewählt! Bitte wähle zuerst ein Todo aus.");
        return;
    }

    // Datenobjekt, attachment kann null sein
    const data = {
        todo_id: todoId,
        attachment: attachmentInput // Kann null oder ein String sein
    };

    try {
        const response = await fetch("/attachments/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        console.log("📩 Server Response:", result);

        if (!response.ok) {
            const errorMsg = result.detail || "Unbekannter Fehler";
            alert("⚠️ Fehler: " + errorMsg);
            return;
        }

        alert("📎 Attachment erfolgreich erstellt!");
        //addAttachmentToTable(result);

        // Attachments neu abrufen und Tabelle aktualisieren
        await fetchAndUpdateAttachments(todoId);

    } catch (error) {
        console.error("❌ Fehler beim Hochladen:", error);
        alert("Fehler beim Hochladen! Siehe Konsole für Details.");
    }
});


async function fetchAndUpdateAttachments(todoId) {
    try {
        const response = await fetch('/attachments/attachments', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
            throw new Error('Fehler beim Abrufen der Daten');
        }

        const attachments = await response.json();
        
        const tableBody = document.getElementById('attachments-table-body');
        if (!tableBody) {
            console.error("❌ Tabelle 'attachments-table-body' nicht gefunden!");
            return;
        }
        tableBody.innerHTML = '';

        attachments.forEach(attachment => {
            addAttachmentToTable(attachment);
        });

        console.log(`✅ todoID ist ${todoId}`);

        filterAttachments(todoId); // ✅ richtig geschrieben

        console.log('✅ Attachments erfolgreich aktualisiert');
    } catch (error) {
        console.error('❌ Fehler beim Aktualisieren der Attachments:', error);
    }
}


function addAttachmentToTable(attachment) {
    console.log("📎 Attachment-Objekt:", attachment);

    if (!attachment || !attachment.id) {
        console.error("❌ Ungültiges Attachment-Objekt:", attachment);
        return;
    }

    const tableBody = document.getElementById('attachments-table-body');
    if (!tableBody) {
        console.error("❌ Tabelle 'attachments-table-body' nicht gefunden!");
        return;
    }

    const tr = document.createElement('tr');
    tr.setAttribute('data-id', attachment.id); 
    tr.setAttribute('data-todo-id', attachment.todo_id); // ✅ das fehlte
    tr.className = 'hover:bg-gray-100';
    tr.dataset.attachmentId = attachment.id;
    
    tr.innerHTML = `
        <td class="px-4 py-2">${attachment.id}</td>
        <td class="px-4 py-2" contenteditable="true">${attachment.attachment || '–'}</td>
        <td class="px-1 py-1">
            <button class="delete-button" onclick="deleteAttachment(${attachment.id})">
                <i class="fa-solid fa-trash"></i>
            </button>
        </td>
    `;

    tableBody.appendChild(tr);
}

 //####################################################################################### 
// Löschfunktion hinzufügen
async function deleteAttachment(id) {
    try {
        const response = await fetch(`/attachments/${id}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "Löschen fehlgeschlagen");
        }

        // Korrigierter Selector: data-attachment-id statt data-id
        const row = document.querySelector(`tr[data-attachment-id="${id}"]`);
        if (row) {
            row.remove();
            console.log(`🗑️ Attachment ${id} aus Tabelle entfernt`);
        } else {
            console.warn(`⚠️ Zeile mit ID ${id} nicht im DOM gefunden`);
        }

        console.log(`🗑️ Attachment ${id} erfolgreich gelöscht`);
    } catch (error) {
        console.error("❌ Fehler beim Löschen:", error);
        alert("Fehler beim Löschen: " + error.message);
    }
}

function getSelectedTodoId() {
    const selectedTodo = document.querySelector('.todo-selected'); 
    return selectedTodo ? parseInt(selectedTodo.dataset.todoId, 10) : null;  // Sicherstellen, dass eine Zahl gesendet wird
}

function renderAttachmentsTable(attachments) {
    const attachmentsTbody = document.getElementById('attachments-table-body');
    attachmentsTbody.innerHTML = '';

    attachments.forEach(attachment => {
        const tr = document.createElement('tr');
        tr.dataset.attachmentId = attachment.id;

        tr.innerHTML = `
            <td class="px-2 py-1" contenteditable="true" data-field="attachment">${attachment.attachment || ''}</td>
            <td class="px-2 py-1">
                <button class="delete-button" onclick="deleteAttachment(${attachment.id})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;

        attachmentsTbody.appendChild(tr);
    });
}

//#######################################################################################
// Event Listener für Änderungen an editierbaren Zellen
document.addEventListener('DOMContentLoaded', () => {
    console.log("🔄 DOM vollständig geladen!");

    const attachmentsTableBody = document.getElementById('attachments-table-body');
    if (!attachmentsTableBody) {
        console.error("❌ FEHLER: 'attachments-table-body' nicht gefunden!");
        return;
    }
    console.log("✅ Attachments-Tabelle gefunden:", attachmentsTableBody);

    // Event Delegation für Änderungen in Attachments
    attachmentsTableBody.addEventListener('blur', async (event) => {
        if (event.target.matches('[contenteditable="true"]')) {
            console.log("📌 Änderung erkannt:", event.target);

            const field = event.target.getAttribute('data-field');
            const newValue = event.target.innerText.trim();
            const attachmentId = event.target.closest('tr').dataset.attachmentId;
            console.log("📌 attachmentid:", attachmentId);

            if (!attachmentId) {
                console.error("⚠️ FEHLER: Keine gültige Attachment-ID gefunden!");
                return;
            }

            if (newValue) {
                try {
                    const response = await fetch('/attachments/update', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: attachmentId, field: field, value: newValue }),
                    });

                    const data = await response.json();
                    if (response.ok) {
                        console.log('✅ Attachment erfolgreich gespeichert:', data);
                    } else {
                        console.error('❌ Fehler beim Speichern des Attachments:', data);
                    }
                } catch (error) {
                    console.error('❌ Fehler beim Senden der Anfrage:', error);
                }
            }
        }
    }, true);
});

//#######################################################################################
function handleAttachmentDoubleClick(event, attachmentID) {
    if (!attachmentID) { // Fehlende schließende Klammer ergänzt
        alert("Anhang fehlt.");
        return;
    }
    console.log(`Doppelklick aufgerufen: ${attachmentID}`);
    // API-Endpunkt-URL
    const apiUrl = `/attachments/open-file/${attachmentID}`;

    // Sende eine GET-Anfrage an den Endpunkt
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Fehler: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Datei erfolgreich geöffnet:", data);
            // Führe hier eine Aktion aus, z. B. das Öffnen der Datei
        })
        .catch(error => {
            console.error("Fehler beim Öffnen der Datei:", error);
        });
}
//#######################################################################################

document.getElementById('replaceNameBtn').addEventListener('click', async () => {
    console.log("aufgerufen")
    const username = prompt("Welcher User soll ersetzt werden?"); // Eingabefeld im Browser
    if (!username) return;

    try {
        const response = await fetch('/attachments/replace_names', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user: username })  // <- ganz wichtig
        });

        console.log ("aufruf2")
        const data = await response.json();
        if (data.status === 'success') {
            alert('Namen wurden erfolgreich ersetzt!');
        } else {
            alert('Fehler: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
    }
});