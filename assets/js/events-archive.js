// =======================================================================
// SCRIPT: Archivio Eventi per Associazioni (tutti-eventi.html)
// =======================================================================

document.addEventListener('DOMContentLoaded', () => {
    const archiveContainer = document.getElementById('archive-container');
    
    // Si attiva solo se ci troviamo nella pagina corretta
    if (archiveContainer) {
        fetch('data/events.json')
            .then(response => {
                if (!response.ok) throw new Error('Errore nel caricamento degli eventi archiviati');
                return response.json();
            })
            .then(events => {
                archiveContainer.innerHTML = ''; // Rimuovi spinner caricamento
                
                if (events.length === 0) {
                    archiveContainer.innerHTML = '<p>Nessun evento presente in archivio.</p>';
                    return;
                }

                // STEP 1: Analizziamo tutti gli eventi per trovare l'elenco delle Associazioni Uniche
                // Usiamo un Set() perché garantisce che non ci siano nomi duplicati
                const allAssociations = new Set();
                events.forEach(event => {
                    if (event.associations && event.associations.length > 0) {
                        event.associations.forEach(assoc => allAssociations.add(assoc));
                    }
                });

                // Non ci sono eventi con associazioni registrate
                if (allAssociations.size === 0) {
                    archiveContainer.innerHTML = '<p>Nessuna associazione organizzatrice registrata nel database.</p>';
                    return;
                }

                // Convertiamo il Set in Array e lo ordiniamo in ordine alfabetico
                const assocArray = Array.from(allAssociations).sort();

                // STEP 2: Renderizziamo le Sezioni Dinamiche per ogni Associazione Trovata
                assocArray.forEach(assoc => {
                    // Rendiamo il nome sicuro per usarlo come ID e Nome-Classe CSS
                    const safeClass = assoc.toLowerCase().replace(/\s+/g, '-');
                    
                    // Creiamo il nuovo blocco contenitore (La "Categoria" Proloco, o Avis...)
                    const groupSection = document.createElement('div');
                    groupSection.style.marginBottom = '80px';
                    groupSection.style.textAlign = 'left';

                    // Intestazione Categoria con Tag dedicato e la Griglia vuota da riempire sotto
                    groupSection.innerHTML = `
                        <h3 style="color: var(--dark-blue); font-size: 2.2rem; border-bottom: 2px solid #ccc; padding-bottom: 15px; margin-bottom: 40px; display:flex; align-items:center; gap: 15px;">
                            <span class="tag-badge tag-${safeClass}" style="font-size: 1.2rem; padding: 5px 15px;">${assoc}</span> Eventi in programma
                        </h3>
                        <div class="events-grid" id="grid-${safeClass}"></div>
                    `;

                    archiveContainer.appendChild(groupSection);
                    
                    // Cerchiamo la griglia appena "iniettata" nel DOM
                    const grid = groupSection.querySelector(`#grid-${safeClass}`);

                    // STEP 3: Filtriamo tutti gli eventi e teniamo SOLO quelli in cui compare QUESTA associazione
                    const assocEvents = events.filter(e => e.associations && e.associations.includes(assoc));

                    // Costruiamo e agganciamo le Cards (Se ci sono collaborazioni, le vedrai multiple in varie sezioni!)
                    assocEvents.forEach(event => {
                        
                        // Generiamo le targhette dell'evento. (Così l'utente capisce visivamente la collaborazione)
                        const tagsHTML = event.associations.map(a => {
                            const sc = a.toLowerCase().replace(/\s+/g, '-');
                            return `<span class="tag-badge tag-${sc}">${a}</span>`;
                        }).join('');

                        const card = document.createElement('div');
                        card.className = 'event-card';
                        card.innerHTML = `
                            <div class="event-image-wrapper">
                                <img src="${event.image}" alt="${event.title}" class="event-image" onerror="this.src='assets/img/Monasterolo.jpg'">
                                <div class="event-tags-container">${tagsHTML}</div>
                            </div>
                            <div class="event-content" style="text-align: left;">
                                <div class="event-date"><i class="fa-regular fa-calendar"></i> ${event.date}</div>
                                <h3 style="color: var(--primary-blue); font-size: 1.4rem;">${event.title}</h3>
                                <p style="font-size:1rem;">${event.short_desc}</p>
                                <a href="evento.html?id=${event.id}" class="btn-outline">Scopri di più</a>
                            </div>
                        `;
                        grid.appendChild(card);
                    });
                });
            })
            .catch(error => {
                console.error("Errore Caricamento Archivio Associazioni:", error);
                archiveContainer.innerHTML = '<p>Impossibile comunicare con il database JSON per caricare l\'archivio eventi.</p>';
            });
    }
});
