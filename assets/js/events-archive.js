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
                const allAssociations = new Set();
                events.forEach(event => {
                    if (event.associations && event.associations.length > 0) {
                        event.associations.forEach(assoc => allAssociations.add(assoc));
                    }
                });

                if (allAssociations.size === 0) {
                    archiveContainer.innerHTML = '<p>Nessuna associazione organizzatrice registrata nel database.</p>';
                    return;
                }

                const assocArray = Array.from(allAssociations).sort();

                // Funzione per creare la card di un evento (prossimo o passato)
                const createCard = (event) => {
                    const isPast = Boolean(event.past);
                    let tagsHTML = event.associations.map(a => {
                        const sc = a.toLowerCase().replace(/\s+/g, '-');
                        return `<span class="tag-badge tag-${sc}">${a}</span>`;
                    }).join('');

                    if (isPast) {
                        tagsHTML += `<span class="tag-badge tag-concluso"><i class="fa-solid fa-check"></i> Concluso</span>`;
                    }

                    const card = document.createElement('div');
                    card.className = isPast ? 'event-card past-card' : 'event-card';
                    card.innerHTML = `
                        <div class="event-image-wrapper">
                            <img src="${event.image}" alt="${event.title}" class="event-image" onerror="this.src='assets/img/Monasterolo.jpg'">
                            <div class="event-tags-container">${tagsHTML}</div>
                        </div>
                        <div class="event-content" style="text-align: left;">
                            <div class="event-date">
                                <i class="fa-regular fa-calendar"></i> ${event.date}
                                ${isPast ? '<strong style="color: #6c757d; font-size:0.85rem; margin-left: 5px;">[Concluso]</strong>' : ''}
                            </div>
                            <h3 style="color: ${isPast ? '#555' : 'var(--primary-blue)'}; font-size: 1.4rem;">${event.title}</h3>
                            <p style="font-size:1rem;">${event.short_desc}</p>
                            <a href="${event.custom_link || 'evento.html?id=' + event.id}" class="btn-outline">${isPast ? 'Vedi Dettagli' : 'Scopri di più'}</a>
                        </div>
                    `;
                    return card;
                };

                // STEP 2: Renderizziamo le Sezioni Dinamiche per ogni Associazione Trovata
                assocArray.forEach(assoc => {
                    const safeClass = assoc.toLowerCase().replace(/\s+/g, '-');
                    
                    const groupSection = document.createElement('div');
                    groupSection.style.marginBottom = '70px';
                    groupSection.style.textAlign = 'left';

                    const assocEvents = events.filter(e => e.associations && e.associations.includes(assoc));
                    const upcomingEvents = assocEvents.filter(e => !e.past);
                    const pastEvents = assocEvents.filter(e => e.past);

                    let sectionHTML = `
                        <h3 style="color: var(--dark-blue); font-size: 2.2rem; border-bottom: 2px solid #ccc; padding-bottom: 15px; margin-bottom: 25px; display:flex; align-items:center; gap: 15px;">
                            <span class="tag-badge tag-${safeClass}" style="font-size: 1.2rem; padding: 5px 15px;">${assoc}</span> Catalogo Eventi
                        </h3>
                    `;

                    if (upcomingEvents.length > 0) {
                        sectionHTML += `
                            <h4 class="archive-subheading"><i class="fa-solid fa-calendar-days"></i> Prossimi Eventi in Programma</h4>
                            <div class="events-grid" id="grid-upcoming-${safeClass}"></div>
                        `;
                    }

                    if (pastEvents.length > 0) {
                        sectionHTML += `
                            <h4 class="archive-subheading past-subheading"><i class="fa-solid fa-clock-rotate-left"></i> Archivio Eventi Conclusi</h4>
                            <div class="events-grid" id="grid-past-${safeClass}"></div>
                        `;
                    }

                    groupSection.innerHTML = sectionHTML;
                    archiveContainer.appendChild(groupSection);

                    if (upcomingEvents.length > 0) {
                        const upcomingGrid = groupSection.querySelector(`#grid-upcoming-${safeClass}`);
                        upcomingEvents.forEach(event => {
                            upcomingGrid.appendChild(createCard(event));
                        });
                    }

                    if (pastEvents.length > 0) {
                        const pastGrid = groupSection.querySelector(`#grid-past-${safeClass}`);
                        pastEvents.forEach(event => {
                            pastGrid.appendChild(createCard(event));
                        });
                    }
                });
            })
            .catch(error => {
                console.error("Errore Caricamento Archivio Associazioni:", error);
                archiveContainer.innerHTML = '<p>Impossibile comunicare con il database JSON per caricare l\'archivio eventi.</p>';
            });
    }
});
