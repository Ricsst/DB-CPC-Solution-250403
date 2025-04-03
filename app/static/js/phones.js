// Globale Variable zur Speicherung der ausgewählten Telefon-ID
let selectedPhoneId = null;

// Funktion: Telefon auswählen
function selectPhone(phoneId) {
    console.log(`Telefon mit ID ${phoneId} ausgewählt`);

    // Entferne die Markierung von allen Telefon-Reihen
    const phoneRows = document.querySelectorAll('.phone-row');
    phoneRows.forEach(row => row.classList.remove('bg-gray-100'));

    // Markiere die ausgewählte Telefonreihe
    const selectedRow = document.querySelector(`.phone-row[data-phone-id="${phoneId}"]`);
    if (selectedRow) {
        selectedRow.classList.add('bg-gray-100');
    }

    // Speichere die ausgewählte Phone-ID im LocalStorage
    selectedPhoneId = phoneId;
    localStorage.setItem('selectedPhoneId', phoneId);
}

// ----------------------------------------
// Funktion: Neues Phone erstellen
// Diese Funktion wird ausgeführt, wenn der Benutzer ein neues Telefon erstellt.
document.getElementById('create-phone-button').addEventListener('click', () => {
    console.log("Button wurde geklickt!");  // Prüfen, ob der Event-Listener funktioniert

    const name = prompt("Enter name:");
    const beschreibung = prompt("Enter beschreibung:");
    const number = prompt("Enter nummer");

    const projectId = localStorage.getItem("selectedProjectId");

    if (!name || !beschreibung || !number) {
        alert('Bitte alle Felder ausfüllen.');
        return;
    }

    console.log("Daten werden gesendet:", { name, beschreibung, number });

    fetch(`/phones/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, beschreibung, number }),
    })
    .then(response => {
        console.log("Antwort erhalten:", response.status);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        return response.json();
    })
    .then(data => {
        console.log("Antwort aus dem Backend:", data);

        if (!data.phone || !data.phone.id) {
            console.error("Fehler: Ungültiges Telefonobjekt erhalten:", data);
            alert("Fehler: Das zurückgegebene Telefonobjekt ist ungültig.");
            return;
        }

        alert('Neues Telefon im Backend erstellt!');
        addPhoneToTable(data.phone);

        if (projectId) {
            console.log(`Projekt ${projectId} erneut markieren.`);
            selectProject(projectId);
        } else {
            alert('Kein Projekt ausgewählt!');
        }
    })
    .catch(error => {
        console.error('Fehler beim Erstellen des Telefons:', error);
        alert('Fehler beim Erstellen des Telefons.');
    });
});


// ✅ Funktion, um das neue Telefon zur Liste hinzuzufügen
function addPhoneToTable(phone) {
    console.log("Telefon-Objekt:", phone); // Prüfen, was ankommt

    if (!phone || !phone.id) {
        console.error("Ungültiges Telefonobjekt:", phone);
        return;
    }
    
    const tableBody = document.getElementById('phones-table-body'); // Korrekte ID verwenden
    const tr = document.createElement('tr');

    // Klassenname und Dataset setzen
    tr.className = 'cursor-pointer hover:bg-gray-100 phone-row';
    tr.dataset.phoneId = phone.id;
    tr.onclick = () => selectPhone(phone.id);

    tr.innerHTML = `
        <td class="px-4 py-2 text-sm text-gray-700" contenteditable="true">${phone.id}</td>
        <td class="px-4 py-2 text-sm text-gray-700" contenteditable="true">${phone.name}</td>
        <td class="px-4 py-2 text-sm text-gray-700" contenteditable="true">${phone.beschreibung}</td>
        <td class="px-4 py-2 text-sm text-gray-700" contenteditable="true">${phone.number}</td>
        <td class="px-2 py-1 whitespace-nowrap">
            <button class="delete-button phone-delete-button" data-phone-id="${phone.id}">
                <i class="fa-solid fa-trash"></i>
            </button>
        </td>
    `;

    tableBody.appendChild(tr);
}



// ----------------------------------------
// Funktion: Phone löschen
// Diese Funktion wird ausgeführt, wenn der Benutzer ein Telefon löschen möchte.
document.addEventListener('DOMContentLoaded', () => {
    const phoneList = document.getElementById('phone-list'); // Korrekte Zuweisung und Verwendung von 'phoneList'

    // Überprüfen, ob das Element existiert
    if (!phoneList) {
        console.error("Element mit ID 'phone-list' nicht gefunden.");
        return;
    }

    phoneList.addEventListener('click', event => {
        // Überprüfen, ob auf einen der Lösch-Buttons geklickt wurde
        const target = event.target.closest('.delete-button, .phone-delete-button');
        if (target) {
            const phoneId = target.closest('tr')?.dataset.phoneId; // ID des Telefons holen
            if (phoneId) {
                deletePhone(phoneId); // Lösche das Telefon
            } else {
                console.warn("Telefon-ID konnte nicht ermittelt werden.");
            }
        }
    });
});

// ----------------------------------------
// Funktion: Telefon löschen
// Diese Funktion löscht ein Telefon, indem sie einen DELETE-Request an den Server sendet.
function deletePhone(phoneId) {
    fetch(`/phones/${phoneId}`, { method: 'DELETE' })
        .then(response => {
            if (response.ok) {
                console.log(`Telefon mit ID ${phoneId} gelöscht.`);
                const row = document.querySelector(`[data-phone-id="${phoneId}"]`);
                if (row) row.remove();
               // window.location.reload();
            } else {
                console.error(`Fehler: Telefon ${phoneId} konnte nicht gelöscht werden.`);
            }
        })
        .catch(err => {
            console.error("Fehler:", err);
        });
}

// Event Listener für die "phones"-Tabelle
const phoneTable = document.querySelector('#phone-list');
if (phoneTable) {
    phoneTable.querySelectorAll('[contenteditable="true"]').forEach(cell => {
        console.log("Event Listener wurde für eine Phone-Zelle hinzugefügt");
        cell.addEventListener('blur', async (event) => {
            const field = event.target.getAttribute('data-field');
            const newValue = event.target.innerText.trim();
            const phoneId = event.target.getAttribute('data-id');

            if (newValue) {
                try {
                    // Sende die geänderten Daten an den Server für "phone"
                    const response = await fetch('/phones/update-phone', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            id: phoneId,
                            field: field,
                            value: newValue,
                        }),
                    });

                    const data = await response.json();
                    if (response.ok) {
                        console.log('Telefon erfolgreich gespeichert:', data);
                    } else {
                        console.error('Fehler beim Speichern des Telefons:', data);
                    }
                } catch (error) {
                    console.error('Fehler beim Senden der Anfrage für Phone:', error);
                }
            }
        });
    });
}

