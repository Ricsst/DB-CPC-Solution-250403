// Erstellen einer Liste aller Todos
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('list-pendenzen-button').addEventListener('click', async () => {
        console.log("Button ok");  // ✅ Log wenn Button geklickt wurde
        try {
            const response = await fetch('/todos/alltodos');
            if (!response.ok) {
                throw new Error(`HTTP-Error: ${response.status}`);
            }
            const html = await response.text();

            // Öffne einen neuen Tab und setze den HTML-Inhalt dynamisch
            const newTab = window.open('', '_blank');
            newTab.document.open();
            newTab.document.write(html);  // Alternative, indem die Antwort ins Dokument geschrieben wird
            newTab.document.close(); // Wichtig für das Schließen des Dokuments im neuen Tab
        } catch (error) {
            console.error('Fehler beim Laden der Todos:', error);
        }
    });
});


// #################################################################################################
// Erstellen einer Liste aller Todos
document.addEventListener("DOMContentLoaded", function () {
    const weekFilter = document.getElementById("week-filter");
    if (!weekFilter) return;

    weekFilter.addEventListener("input", function () {
        const filterValue = this.value;
        const rows = document.querySelectorAll("#todos-table-body tr");

        let currentProjectRow = null;

        rows.forEach(row => {
            // Projekt-Titel-Row
            if (row.classList.contains("bg-gray-200")) {
                currentProjectRow = row;
                row.style.display = "";
                return;
            }

            const weekCell = row.querySelector("td[data-field='week']");
            if (!weekCell) return;

            const week = weekCell.textContent.trim();
            const shouldShow = !filterValue || week === filterValue;

            row.style.display = shouldShow ? "" : "none";
        });

        // Projektgruppen ein-/ausblenden je nach Inhalt
        document.querySelectorAll("#todos-table-body tr.bg-gray-200").forEach(projectRow => {
            let next = projectRow.nextElementSibling;
            let showProjectRow = false;

            while (next && !next.classList.contains("bg-gray-200")) {
                if (next.style.display !== "none") {
                    showProjectRow = true;
                    break;
                }
                next = next.nextElementSibling;
            }

            projectRow.style.display = showProjectRow ? "" : "none";
        });
    });
});

// #################################################################################################
// Funktion: Neues Todo erstellen
// Diese Funktion wird ausgeführt, wenn der Benutzer ein neues Todo erstellt.
document.addEventListener('DOMContentLoaded', () => {
    // Überprüfen, ob der Button existiert, bevor das Event hinzugefügt wird
    const createButton = document.getElementById('create-pendenzen-button');
    
    if (!createButton) {
        console.log('Button "create-pendenzen-button" ist auf dieser Seite nicht vorhanden.');
        return; // Kein Event hinzufügen, wenn der Button nicht existiert
    }

    // Event-Listener für den Button hinzufügen
    createButton.addEventListener('click', () => {
        if (selectedProjectId !== null) {
            const todo = prompt("Enter todo:");
            const week = prompt("Enter week:");

            if (todo) {
                const createdAt = new Date().toISOString();
                fetch(`/todos/create`, {  // Falls nötig, passe den API-Endpoint an
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        todo,
                        week,
                        project_id: selectedProjectId,
                        created_at: createdAt,
                    }),
                })
                    .then(response => {
                        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                        return response.json();
                    })
                    .then(data => {
                        console.log("Antwort aus dem Backend:", data);

                        if (!data.todo || !data.todo.id) {
                            console.error("Fehler: Ungültiges Todo-Objekt erhalten:", data);
                            alert("Fehler: Das zurückgegebene Todo-Objekt ist ungültig.");
                            return;
                        }

                        alert('Neue Todo erstellt!');
                        addTodoToTable(data.todo);
                    })
                    .catch(error => {
                        console.error('Error creating todo:', error);
                        alert('Fehler beim Erstellen der Todo.');
                    });
            } else {
                alert('Bitte eine Todo eingeben.');
            }
        } else {
            alert('Bitte zuerst ein Projekt auswählen.');
        }
    });
});


// ✅ Funktion, um das neue Todo zur Liste hinzuzufügen
function addTodoToTable(todo) {
    console.log("Todo-Objekt:", todo); // Prüfen, was ankommt

    if (!todo || !todo.id) {
        console.error("Ungültiges Todo-Objekt:", todo);
        return;
    }
    
    const tableBody = document.getElementById('todos-table-body'); // Korrekte ID verwenden
    const tr = document.createElement('tr');

    // Klassenname und Dataset setzen
    tr.className = 'cursor-pointer hover:bg-gray-100 todo-row';
    tr.dataset.todoId = todo.id;
    tr.onclick = () => selectTodo(todo.id); // Korrektur: `selectTodo(todo.id)`

    tr.innerHTML = `
       <td class="px-2 py-1 whitespace-nowrap w-2/3" contenteditable="true" data-field="todo">${todo.todo}</td>
       <td class="px-2 py-1 whitespace-nowrap w-1/3" contenteditable="true" data-field="week">${todo.week}</td>
       <td class="px-2 py-1 whitespace-nowrap">
           <button class="delete-button" onclick="deleteTodo(${todo.id})">
               <i class="fa-solid fa-trash"></i>
           </button>
       </td>
    `;

    tableBody.appendChild(tr);
}

// #################################################################################################
// Funktion: Todo auswählen und wenn angeklickt grau hinterlegen
// brauchte vielleich nicht?
function selectTodo(todoId) {
    console.log(`Telefon mit ID ${todoId} ausgewählt`);

    // Entferne die Markierung von allen Telefon-Reihen
    const todoRows = document.querySelectorAll('.phone-row');
    todoRows.forEach(row => row.classList.remove('bg-gray-100'));

    // Markiere die ausgewählte Telefonreihe
    const selectedRow = document.querySelector(`.todo-row[data-todo-id="${todoId}"]`);
    if (selectedRow) {
        selectedRow.classList.add('bg-gray-100');
    }

    // Speichere die ausgewählte Phone-ID im LocalStorage
    selectedTodoId = todoId;
    localStorage.setItem('selectedTodoId', todoId);
}

// #################################################################################################
// Funktion: Todo löschen
// Diese Funktion löscht ein Todo, indem sie einen DELETE-Request an den Server sendet.
document.addEventListener("click", function (event) {
    const button = event.target.closest(".delete-button-todo"); // Klick auf einen Delete-Button?
    if (!button) return; // Falls kein Button, beende Funktion

    const todoId = button.getAttribute("data-id"); // ID aus Attribut holen
    
    if (!todoId) {
        console.error("Kein Todo-ID gefunden");
        return;
    }
    console.log(`Gefunden: ${todoId}`);
    deleteTodo(todoId);
});

function deleteTodo(todoId) {
    console.log(`deleteTodo gestartet mit ID: ${todoId}`);

    fetch(`/todos/${todoId}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
            console.log(`Antwort von Server:`, data);

            if (data.detail === "Todo erfolgreich gelöscht") {
                console.log(`Pendenz mit ID ${todoId} gelöscht`);

                // Zeile im Frontend entfernen
                const row = document.querySelector(`[data-todo-id="${todoId}"]`);
                if (row) {
                    row.remove();
                    console.log(`Zeile mit ID ${todoId} entfernt.`);
                }
            } else {
                console.error(`Fehler: ${data.detail}`);
            }
        })
        .catch(err => {
            console.error("Fehler:", err);
        });
}



// #################################################################################################
// Event Listener für die Änderungen an den editierbaren Zellen
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM vollständig geladen!");

    const todosTableBody = document.getElementById('todos-table-body');
    if (!todosTableBody) {
        console.error("FEHLER: 'todos-table-body' nicht gefunden!");
        return;
    }
    console.log("Todo-Tabelle gefunden:", todosTableBody);

    // Event Delegation: Änderungen in allen Zellen erfassen
    todosTableBody.addEventListener('blur', async (event) => {
        if (event.target.matches('[contenteditable="true"]')) {
            console.log("Änderung erkannt:", event.target);

            const field = event.target.getAttribute('data-field');
            const newValue = event.target.innerText.trim();
            const todoId = event.target.closest('tr').dataset.todoId;

            if (!todoId) {
                console.error("FEHLER: Keine Todo-ID gefunden!");
                return;
            }

            if (newValue) {
                try {
                    const response = await fetch('/todos/update-todo', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: todoId, field: field, value: newValue }),
                    });

                    const data = await response.json();
                    if (response.ok) {
                        console.log('Todo erfolgreich gespeichert:', data);
                    } else {
                        console.error('Fehler beim Speichern des Todos:', data);
                    }
                } catch (error) {
                    console.error('Fehler beim Senden der Anfrage für Todo:', error);
                }
            }
        }
    }, true);
});

// #################################################################################################
// Funktion, um Anhänge basierend auf dem ausgewählten Todo zu filtern
function filterAttachments(todoId) {
    // Zeige in der Konsole die `todoId`, um sicherzustellen, dass sie korrekt übergeben wird
    console.log('Gefilterte Anhänge für Todo-ID:', todoId);

     // Speichere die Todo-ID im Local Storage
     localStorage.setItem('selectedTodoId', todoId);
    // console.log('gespeicherte selectedTodo:', selectedTodoId);
    // Hole alle Anhangs-Zeilen (tr)
    const attachmentRows = document.querySelectorAll('#attachment-list tbody tr');

    // Iteriere durch alle Anhangs-Zeilen und filtere nach `todo_id`
    attachmentRows.forEach(row => {
        const attachmentTodoId = row.getAttribute('data-todo-id');

        // Wenn der Anhang nicht zur `todoId` passt, verstecke ihn
        if (attachmentTodoId !== String(todoId)) {
            row.style.display = 'none';
        } else {
            // Andernfalls zeige den Anhang
            row.style.display = 'table-row';
        }
    });
}

// #################################################################################################
// Event Listener für das Klick-Event auf jedes Todo hinzufügen
// brauchte ev. nicht?
document.querySelectorAll(".todo-row").forEach(row => {
    row.addEventListener("click", function() {
        document.querySelectorAll(".todo-row").forEach(r => r.classList.remove("selected-todo"));
        this.classList.add("selected-todo");

        // Speichere die Todo-ID in localStorage
        const todoId = this.dataset.todoId;
        //localStorage.setItem("selectedTodoId", todoId);
        console.log("📌 Gespeicherte Todo-ID:", todoId);
    });
});

// #################################################################################################
// Plus eine Woche aller Todos wenn Button gelickt
document.addEventListener("DOMContentLoaded", function () {
    const pluswoche = document.getElementById("pluswoche");
    if (!pluswoche) return;

    pluswoche.addEventListener("click", async () => {  // async hier hinzufügen
        // Wochennummer vom Benutzer abfragen
        const weekNumber = prompt('Bitte geben Sie die Wochennummer ein:');
        
        if (!weekNumber || isNaN(weekNumber)) {
            alert('Bitte eine gültige Wochennummer eingeben.');
            return;
        }

        try {
            // API-Aufruf zum Aktualisieren der Todos
            const response = await fetch('/todos/update-week-todos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ week: parseInt(weekNumber) }),
            });

            if (response.ok) {
                alert('Todos erfolgreich aktualisiert.');
                location.reload(); // Seite aktualisieren
            } else {
                const error = await response.json();
                alert(`Fehler: ${error.message}`);
            }
        } catch (error) {
            alert('Ein Fehler ist aufgetreten: ' + error.message);
        }
    });
});


// #################################################################################################
// Funktion zum Filtern von Todos basierend auf dem ausgewählten Woche
async function fetchData() {
    const response = await fetch('/todos/week'); // Backend-URL
    const data = await response.json();
    return data.data; // Zugriff auf das Array mit Daten
} 


//####################################################################################################
// PDF erstellen von todo liste
  // todos.js
  document.addEventListener('DOMContentLoaded', () => {
    const { jsPDF } = window.jspdf;
    
    // PDF-Button Event Listener
    document.getElementById('pdf-button').addEventListener('click', () => {
        generatePDF();
    });

    // Woche-Filter Event Listener
    document.getElementById('week-filter').addEventListener('input', () => {
        filterTodos();
    });

    function filterTodos() {
        const weekFilter = document.getElementById('week-filter').value;
        const rows = document.querySelectorAll('#todos-table-body tr:not(.project-row)');
        
        rows.forEach(row => {
            const week = row.getAttribute('data-week');
            if (weekFilter === '' || week === weekFilter) {
                row.classList.remove('hidden');
            } else {
                row.classList.add('hidden');
            }
        });

        // Verstecke Projekt-Überschriften wenn keine sichtbaren Todos vorhanden
        const projectRows = document.querySelectorAll('.project-row');
        projectRows.forEach(projectRow => {
            const nextTodos = getNextTodos(projectRow);
            const hasVisibleTodos = Array.from(nextTodos).some(row => 
                !row.classList.contains('hidden')
            );
            projectRow.classList.toggle('hidden', !hasVisibleTodos);
        });
    }

    function getNextTodos(projectRow) {
        const nextRows = [];
        let nextSibling = projectRow.nextElementSibling;
        while (nextSibling && !nextSibling.classList.contains('project-row')) {
            nextRows.push(nextSibling);
            nextSibling = nextSibling.nextElementSibling;
        }
        return nextRows;
    }

    function generatePDF() {
        const doc = new jsPDF();
        const weekFilter = document.getElementById('week-filter').value;
        let currentY = 10;

        // Titel
        doc.setFontSize(16);
        doc.text('Pendenzen nach Projekt', 10, currentY);
        currentY += 10;

        // Gruppiere Todos nach Projekt
        const projects = {};
        const rows = document.querySelectorAll('#todos-table-body tr');
        let currentProject = null;

        rows.forEach(row => {
            if (row.classList.contains('project-row')) {
                currentProject = row.querySelector('td').textContent.trim();
                projects[currentProject] = [];
            } else if (currentProject && !row.classList.contains('hidden')) {
                const cells = row.querySelectorAll('td');
                projects[currentProject].push([
                    cells[0].textContent, // Projekt-Nr
                    cells[1].textContent, // Pendenz
                    cells[2].textContent, // Ort
                    cells[3].textContent  // Woche
                ]);
            }
        });

         // Erstelle Tabellen für jedes Projekt
    for (const [projectName, todos] of Object.entries(projects)) {
        if (todos.length > 0) {
            // Projekt-Überschrift
            doc.setFontSize(8);
            doc.text(projectName, 10, currentY);
            currentY += 2;

            // Tabelle mit fixen Spaltenbreiten
            doc.autoTable({
                startY: currentY,
                head: [['Projekt-Nr', 'Pendenz', 'Ort', 'Woche']],
                body: todos,
                theme: 'grid',
                styles: { 
                    fontSize: 9,
                    cellPadding: 1, // Weniger Innenabstand für Kompaktheit
                    overflow: 'linebreak' // Textumbruch bei langen Inhalten
                },
                headStyles: { 
                    fillColor: [244, 244, 244], 
                    textColor: 0,
                    fontSize: 7
                },
                columnStyles: {
                    0: { cellWidth: 20 }, // Projekt-Nr: 20mm
                    1: { cellWidth: 90 }, // Pendenz: 90mm
                    2: { cellWidth: 40 }, // Ort: 40mm
                    3: { cellWidth: 20 }  // Woche: 20mm
                },
                margin: { top: 5 }
            });

            currentY = doc.lastAutoTable.finalY + 5;
        }
    }

        // Wenn Filter aktiv, im Titel anzeigen
        const filename = weekFilter 
            ? `pendenzen_woche_${weekFilter}.pdf`
            : 'pendenzen_alle.pdf';
        
        // PDF als Blob erstellen und öffnen
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        window.open(pdfUrl); // Öffnet das PDF in einem neuen Tab
        doc.save(filename);  // Speichert das PDF zusätzlich
    }

    // Beispiel für deleteTodo-Funktion (muss an dein Backend angepasst werden)
    window.deleteTodoo = function(id) {
        // Hier würde normalerweise ein API-Call zum Löschen stattfinden
        const row = document.querySelector(`tr[data-todo-id="${id}"]`);
        if (row) {
            row.remove();
            filterTodos(); // Nach dem Löschen Filter neu anwenden
        }
    };
});