// Globale Variable zur Speicherung der ausgewählten Rapports
let selectedRapportId = null;

//##########################################################################################################
// Markieren der gewählten Rapprotzeile
function selectRapport(rapportId) {
    console.log(`Rapport mit ID ${rapportId} wurde ausgewählt`);

    // Entferne die Markierung von allen Rapportzeilen
    const rapportRows = document.querySelectorAll('.rapport-row');
    rapportRows.forEach(row => row.classList.remove('bg-gray-100'));

    // Markiere die ausgewählte Rapportzeile
    const selectedRow = document.querySelector(`.rapport-row[data-rapport-id="${rapportId}"]`);
    if (selectedRow) {
        selectedRow.classList.add('bg-gray-100');
    }

    // Speichere die ausgewählte Rapport-ID im LocalStorage
    localStorage.setItem('selectedRapportId', rapportId);

    // Weitere Aktionen hier
    console.log(`Aktionen für Rapport ID ${rapportId}`);
}

///##########################################################################################################
// Diese Funktion wird ausgeführt, wenn der Benutzer ein neuer Rapport erstellt.
// Event-Listener für den Button
document.getElementById('create-rapport-button').addEventListener('click', (event) => {

    const project = prompt("Enter project:");

    if (project && project.trim() !== '') {
        const createdAt = new Date().toISOString();

        fetch("/rapports/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                project,
                date: createdAt,
            }),
        })
            .then(response => {
                console.log("Antwort erhalten:", response.status);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(data => { // Korrektur: `data` wird übergeben
                console.log("Antwort aus dem Backend:", data);

                alert("Neuer Rapport erstellt!");
                addRapportToTable(data); // Neuer Rapport wird zur Tabelle hinzugefügt
            })
            .catch(error => {
                console.error("Error creating rapport:", error);
                alert("Fehler beim Erstellen des Rapports.");
            });
    } else {
        alert("Bitte ein gültiges Projekt eingeben.");
    }
});
// Funktion zum Aktualisieren der Rapport-Tabelle gehört zum obigen Ereignis
function safeValue(value) {
    return value == null ? '' : value;
}
// Funktion um Tabelle Rapport neu zu erstellen
function addRapportToTable(rapport) {
    console.log("Rapport-Objekt:", rapport); // Prüfen, was ankommt

    if (!rapport || !rapport.id) {
        console.error("Ungültiges Rapportobjekt:", rapport);
        return;
    }

    const tableBody = document.getElementById("rapport-table-body"); 
    const tr = document.createElement("tr");

    // ✅ Setze die Rapport-ID direkt im <tr>
    tr.dataset.rapportId = rapport.id;

    tr.innerHTML = `
        <td contenteditable="true" data-field="id">${rapport.id}</td>
        <td contenteditable="true" data-field="date">${rapport.date ? new Date(rapport.date).toLocaleDateString("de-DE") : ''}</td>                        
        <td contenteditable="true" data-field="project">${safeValue(rapport.project)}</td>
        <td contenteditable="true" data-field="done">${safeValue(rapport.done)}</td>
        <td contenteditable="true" data-field="priority">${safeValue(rapport.priority)}</td>
        <td contenteditable="true" data-field="plan">${safeValue(rapport.plan)}</td>
        <td contenteditable="true" data-field="effektiv">${safeValue(rapport.effektiv)}</td>
        <td contenteditable="true" data-field="bemerkung">${safeValue(rapport.bemerkung)}</td>
        <td>
        <button class="delete-button" onclick="deleteRapport(${rapport.id})">
            <i class="fa-solid fa-trash"></i>
        </button>
        </td>
    `;

    tableBody.appendChild(tr);
    console.log("Neue Zeile hinzugefügt:", tr);
}

//##########################################################################################################
// Event Listener für die Änderungen an den editierbaren Zellen
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM vollständig geladen!");

    const rapportTableBody = document.getElementById('rapport-table-body'); // Korrekte ID sicherstellen
    if (!rapportTableBody) {
        console.error("FEHLER: 'rapport-table-body' nicht gefunden!");
        return;
    }
    console.log("Rapport-Tabelle gefunden:", rapportTableBody);

    // Event Delegation für Änderungen an allen editierbaren Zellen
    rapportTableBody.addEventListener('blur', async (event) => {
        if (event.target.matches('[contenteditable="true"]')) {
            console.log("Änderung erkannt:", event.target);

            const field = event.target.getAttribute('data-field');
            const newValue = event.target.innerText.trim();
            const rapportId = event.target.closest('tr').dataset.rapportId;
            
            if (!rapportId) {
                console.error("FEHLER: Keine Rapport-ID gefunden!");
                return;
            }
            
            if (newValue) {
                try {
                    const response = await fetch(`/rapports/update-rapport`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: rapportId, field: field, value: newValue }),
                    });
            
                    const data = await response.json();
                    if (response.ok) {
                        console.log('Rapport erfolgreich gespeichert:', data);
                    } else {
                        console.error('Fehler beim Speichern des Rapports:', data);
                    }
                } catch (error) {
                    console.error('Fehler beim Senden der Anfrage für Rapport:', error);
                }
            }
         
        calculateSums()   
        }
    }, true);
});

//##########################################################################################################
// Funktion: Rapport löschen
function deleteRapport(rapportId) {
    fetch(`/rapports/${rapportId}`, { method: 'DELETE' })
        .then(response => {
            if (response.ok) {
                console.log(`Rapport mit ID ${rapportId} gelöscht`);
                const row = document.querySelector(`[data-rapport-id="${rapportId}"]`);
                if (row) row.remove();
            } else {
                console.error(`Fehler: Rapport ${rapportId} konnte nicht gelöscht werden.`);
            }
        })
        .catch(err => {
            console.error("Fehler:", err);
        });
}
//##########################################################################################################
