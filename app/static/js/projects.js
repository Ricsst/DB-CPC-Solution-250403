
console.log("projects.js wurde geladen!");

// Global variable to hold the selected project ID
let selectedProjectId = null;
console.log('projects.js wurde geladen');
// #########################################################################################################
// Funktion: Projekt auswählen
// Diese Funktion wird aufgerufen, wenn ein Projekt ausgewählt wird. onclick in html 
// Das projekt wird grau hinterlegt und die todos werden für das Projekt gefiltert; onklick auf Projekt
function selectProject(projectId) {
    console.log(`Project with ID ${projectId} selected`);

    // Entferne die Markierung von allen Projektreihen
    const projectRows = document.querySelectorAll('.project-row');
    projectRows.forEach(row => row.classList.remove('bg-gray-100'));

    // Markiere die ausgewählte Projektreihe
    const selectedRow = document.querySelector(`.project-row[data-project-id="${projectId}"]`);
    if (selectedRow) {
        selectedRow.classList.add('bg-gray-100');
    }

    // Speichere die ausgewählte Projekt-ID im LocalStorage
    selectedProjectId = projectId;
    localStorage.setItem('selectedProjectId', projectId);
  
    // Gib den Inhalt des localStorage aus
    console.log("Gespeicherte Projekt-ID im localStorage:", localStorage.getItem('selectedProjectId'));
    
    // Filtere die Todos basierend auf dem Projekt
    filterTodos(projectId);

    // Notiz-Button aktivieren
    document.getElementById('create-note-button').disabled = false;
}
//############################################################################################################
//Anzeigen der aktuellen Wochennummer
function getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDays = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDays + firstDayOfYear.getDay() + 1) / 7);
}

function updateWeekNumber() {
    const currentWeek = getWeekNumber(new Date());
    document.getElementById("wochenanzeige").textContent = `Woche ${currentWeek}`;
}

updateWeekNumber(); // Initial setzen
// "#########################################################################################################
// Funktion: Todos filtern
// Diese Funktion zeigt nur die Todos des ausgewählten Projekts an.
function filterTodos(projectId) {
    console.log(`Todos with ID ${projectId} selected`);

    const todoRows = document.querySelectorAll('#todo-list tbody tr');
    todoRows.forEach(todo => {
        const todoProjectId = todo.getAttribute('data-project-id');
        todo.style.display = todoProjectId === String(projectId) ? '' : 'none';
    });
}

// "#########################################################################################################
// Funktion zur optischen Hervorhebung des ausgewählten Projekts
// wird vermutlich nicht gebraucht!
function highlightSelectedProject() {
    let selectedProject = localStorage.getItem("selectedProject");
    document.querySelectorAll('.project-row').forEach(row => {
        if (row.dataset.projectId === selectedProject) {
            row.classList.add("selected");
        } else {
            row.classList.remove("selected");
        }
    });
}

// "#########################################################################################################
// Funktion: Neues Projekt erstellen
// Diese Funktion wird ausgeführt, wenn der Benutzer ein neues Projekt erstellt.
// Daten abfragen; route projects/create aufrufen; Projektliste aktualisieren
document.addEventListener('DOMContentLoaded', () => {
    const createButton = document.getElementById('create-project-button');
    if (!createButton) {
        console.error("❌ Button mit ID 'create-project-button' nicht gefunden!");
        return;
    }

    createButton.addEventListener('click', async () => {
        //alert("✅ eventlistener gestartet");
        const title = prompt("Enter project title:");
        const description = prompt("Enter project description:");
        const projectLocation = prompt("Enter project location:");

        if (title && description && projectLocation) {
            try {
                const response = await fetch('/projects/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, description, location: projectLocation }),
                });

                if (!response.ok) {
                    throw new Error(`Failed to create project: ${response.statusText}`);
                }

                const data = await response.json();
                alert('✅ Neues Projekt erstellt!');

                //Projektliste aktualisieren
                console.log("📥 Aktualisiere Projektliste...");
                await fetchAndUpdateProjects();

            } catch (error) {
                console.error('❌ Fehler beim Erstellen des Projekts:', error);
                alert(`Fehler beim Erstellen des Projekts: ${error.message}`);
            }
        } else {
            alert('⚠️ Bitte alle Felder ausfüllen.');
        }

    });
});

// Funktion zum Projektliste aktualisieren
// Projekte abfragen; Funktion tabelle erstellen aufrufen
async function fetchAndUpdateProjects() {
    console.log("✅ fetchAndUpdateProjects ist geladen");

    try {
        const token = localStorage.getItem('access_token'); // Token aus Login
        if (!token) {
            console.error("❌ Kein Token gefunden. Bitte einloggen.");
            return;
        }

        const response = await fetch('/projects/get-projects', { // Korrigierter Endpunkt
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`, // Authentifizierung hinzufügen
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const text = await response.text();
            console.error("❌ Fehlerhafte Antwort:", text);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const projects = await response.json();

        const tableBody = document.getElementById('projects-table-body');
        if (!tableBody) {
            console.error("❌ Tabelle 'projects-table-body' nicht gefunden!");
            return;
        }

        tableBody.innerHTML = ''; // Tabelle leeren

        projects.forEach(project => {
            addProjectToTable(project); // Projekte zur Tabelle hinzufügen
        });

        console.log('✅ Projekte erfolgreich aktualisiert');
    } catch (error) {
        console.error('❌ Fehler beim Aktualisieren der Projekte:', error);
    }
}

// Funktion für Tabellenerstellung Projekte
function addProjectToTable(project) {
    console.log("📁 Projekt-Objekt:", project);

    if (!project || !project.id) {
        console.error("❌ Ungültiges Projekt-Objekt:", project);
        return;
    }

    const tableBody = document.getElementById('projects-table-body');
    if (!tableBody) {
        console.error("❌ Tabelle 'projects-table-body' nicht gefunden!");
        return;
    }

    const tr = document.createElement('tr');
    tr.setAttribute('data-id', project.id);
    tr.className = 'cursor-pointer hover:bg-gray-100 project-row';
    tr.dataset.projectId = project.id;
    tr.onclick = () => selectProject(project.id);

    tr.innerHTML = `
        <td class="px-2 py-1 whitespace-nowrap" contenteditable="true" data-field="id">${project.id}</td>
        <td class="px-2 py-1 whitespace-nowrap" contenteditable="true" data-field="nr">${project.nr || '–'}</td>
        <td class="px-2 py-1 whitespace-nowrap" contenteditable="true" data-field="title">${project.title || '–'}</td>
        <td class="px-2 py-1 whitespace-nowrap" contenteditable="true" data-field="location">${project.location || '–'}</td>
        <td class="px-2 py-1 whitespace-nowrap">${new Date(project.created_at).toLocaleDateString()}</td>
        <td class="px-2 py-1 whitespace-nowrap">
            <button class="delete-button project-delete-button" onclick="deleteProject(${project.id})">
                <i class="fa-solid fa-trash"></i>
            </button>
        </td>
    `;

    tableBody.appendChild(tr);
}

// #########################################################################################################
//Sortieren der Tabelle projekte nach Spaltenüberschrift
// Diese Funktion wird aufgerufen, wenn der Benutzer auf eine Spaltenüberschrift klickt.
document.addEventListener("DOMContentLoaded", function () {
    const table = document.getElementById("sortableTable");
    const headers = table.querySelectorAll("th.sortable");
    let sortDirection = 1; // 1 = A-Z, -1 = Z-A

    headers.forEach((header, columnIndex) => {
        header.addEventListener("click", function () {
            const tbody = table.querySelector("tbody");
            const rows = Array.from(tbody.querySelectorAll("tr"));

            rows.sort((rowA, rowB) => {
                const cellA = rowA.cells[columnIndex].textContent.trim().toLowerCase();
                const cellB = rowB.cells[columnIndex].textContent.trim().toLowerCase();

                return cellA.localeCompare(cellB) * sortDirection;
            });

            rows.forEach(row => tbody.appendChild(row));

            // Sortierrichtung umkehren
            sortDirection *= -1;
        });
    });
});

// #########################################################################################################
// Funktion: Filter für PL-Spalte   
document.addEventListener("DOMContentLoaded", function () {
    const table = document.getElementById("sortableTable");
    const tbody = table.querySelector("tbody");
    const rows = Array.from(tbody.querySelectorAll("tr"));
    const leaderFilter = document.getElementById("leader-filter");

    // 🔹 Die PL-Spalte (Leader) ist jetzt die **5. Spalte** (Index 4)
    let uniqueLeaders = [...new Set(rows.map(row => row.cells[5].textContent.trim()))];

    // Sortierte Werte ins Dropdown einfügen
    uniqueLeaders.sort().forEach(value => {
        let option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        leaderFilter.appendChild(option);
    });

    // 🔹 Tabelle nach Leader ("PL") filtern
    leaderFilter.addEventListener("change", function () {
        const selectedLeader = this.value;
        rows.forEach(row => {
            let cellValue = row.cells[4].textContent.trim(); // Holt den PL-Wert
            row.style.display = (selectedLeader === "" || cellValue === selectedLeader) ? "" : "none";
        });
    });
});

// #########################################################################################################
// Funktion: Projekt löschen
// Diese Funktion wird ausgeführt, wenn der Benutzer ein Projekt löschen möchte.
document.addEventListener('DOMContentLoaded', () => {
    const projectList = document.querySelector('#projects-table-body');
    //const projectList = document.getElementById('project-list');
    projectList.addEventListener('click', event => {
        const target = event.target.closest('.delete-button, .project-delete-button');
        if (target) {
            const projectId = target.closest('tr').dataset.projectId;
            deleteProject(projectId); // Lösche das Projekt
        }
    });
});

// Funktion: Projekt löschen
// Diese Funktion löscht ein Projekt, indem sie einen DELETE-Request an den Server sendet.
function deleteProject(projectId) {
    fetch(`/projects/${projectId}`, { method: 'DELETE' })
        .then(response => {
            if (response.ok) {
                console.log(`Projekt mit ID ${projectId} gelöscht`);
                const row = document.querySelector(`[data-project-id="${projectId}"]`);
                if (row) row.remove();
               // window.location.reload();
            } else {
                console.error(`Fehler: Projekt ${projectId} konnte nicht gelöscht werden.`);
            }
        })
        .catch(err => {
            console.error("Fehler:", err);
        });
}

// "#########################################################################################################
// Funktion: Notizen abrufen
// Diese Funktion wird ausgeführt, um eine Notiz für das ausgewählte Projekt zu erstellen oder abzurufen.
document.getElementById('create-note-button').addEventListener('click', () => {
    if (selectedProjectId !== null) {
        fetch(`/notes/project/${selectedProjectId}`)
            .then(response => {
                if (!response.ok) return response.text().then(errorText => { throw new Error(errorText); });
                return response.json();
            })
            .then(data => {
                if (data.note_id) {
                    window.location.href = `/notes/${data.note_id}`;
                } else {
                    alert('Unerwartete Antwort vom Server.');
                }
            })
            .catch(error => {
                console.error('Fehler:', error);
                alert(`Fehler beim Abrufen oder Erstellen der Notiz: ${error.message}`);
            });
    } else {
        alert('Bitte zuerst ein Projekt auswählen.');
    }
});


// #########################################################################################################
// DOMContentLoaded: Initialisierungen
// Wenn die Seite geladen wird, wird das zuletzt ausgewählte Projekt (falls vorhanden) automatisch ausgewählt.
document.addEventListener('DOMContentLoaded', () => {
    const storedProjectId = localStorage.getItem('selectedProjectId');
    if (storedProjectId) {
        selectProject(storedProjectId);
    } else {
        filterTodos(null);
    }
});

// "#########################################################################################################
// Übernimmt Änderungen in den Daten der Projektliste 
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM vollständig geladen!");

    const projectTableBody = document.getElementById('projects-table-body');
    if (!projectTableBody) {
        console.error("FEHLER: 'projects-table-body' nicht gefunden!");
        return;
    }
    console.log("Projekt-Tabelle gefunden:", projectTableBody);

    // Event Delegation: Änderungen in allen Zellen erfassen; blur ereignis, wenn ein element den fokus verliert
    projectTableBody.addEventListener('blur', async (event) => {
        if (event.target.matches('[contenteditable="true"]')) {
            console.log("Änderung erkannt:", event.target);

            const field = event.target.getAttribute('data-field');
            const newValue = event.target.innerText.trim();
            const projectId = event.target.closest('tr').dataset.projectId;

            if (!projectId) {
                console.error("FEHLER: Keine Projekt-ID gefunden!");
                return;
            }

            if (newValue) {
                try {
                    const response = await fetch('/projects/update-project', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: projectId, field: field, value: newValue }),
                    });

                    const data = await response.json();
                    if (response.ok) {
                        console.log('Daten erfolgreich gespeichert:', data);
                    } else {
                        console.error('Fehler beim Speichern:', data);
                    }
                } catch (error) {
                    console.error('Fehler beim Senden der Anfrage:', error);
                }
            }
        }
    }, true);
});


// "#########################################################################################################
// Doppelklick öffnet Explorer
function handleDoubleClick(event, projectNr) {
    if (!projectNr) {
        alert("Project number is missing.");
        return;
    }

    // API-Endpunkt-URL
    const apiUrl = `/projects/open-file/${projectNr}`;

    // Sende eine GET-Anfrage an den Endpunkt
    fetch(apiUrl)
    ////    .then((response) => {
     //       if (response.ok) {
       //         alert("File opened successfully!"); // Erfolgsmeldung
     //       } else {
     //           throw new Error("File not found or an error occurred.");
     //       }
     //   })
     //   .catch((error) => {
     //       console.error(error);
     //       alert("Error: " + error.message);
     //   });
    ////()
}

// "#########################################################################################################
// Filterung der Projekte über Filterfeld

document.addEventListener('DOMContentLoaded', function () {
    const filterInput = document.getElementById('project-filter');
    if (!filterInput) {
        console.error("Filter-Input nicht gefunden!");
        return;
    }

    filterInput.addEventListener('input', function () {
        const filterValue = this.value.toLowerCase();
        const projectRows = document.querySelectorAll('#projects-table-body tr');

        projectRows.forEach(function (row) {
            const locationCell = row.querySelector('td:nth-child(4)');
            const locationText = locationCell ? locationCell.textContent.toLowerCase() : '';

            row.style.display = locationText.startsWith(filterValue) ? '' : 'none';
        });
    });
});

// "#########################################################################################################

