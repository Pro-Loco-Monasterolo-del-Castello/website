// Scorrimento fluido per i link della pagina
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        // Solo per hash interni
        const href = this.getAttribute('href');
        if (href.startsWith('#')) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        }
    });
});

// Dynamic Events System
document.addEventListener('DOMContentLoaded', () => {
    // Check if we are on the homepage (events container exists)
    const eventsContainer = document.getElementById('events-container');
    if (eventsContainer) {
        fetch('data/events.json')
            .then(response => {
                if (!response.ok) throw new Error('Errore nel caricamento degli eventi');
                return response.json();
            })
            .then(events => {
                eventsContainer.innerHTML = '';
                if (events.length === 0) {
                    eventsContainer.innerHTML = '<p>Nessun evento in programma al momento.</p>';
                    return;
                }
                
                events.forEach(event => {
                    const card = document.createElement('div');
                    card.className = 'event-card';
                    card.innerHTML = `
                        <img src="${event.image}" alt="${event.title}" class="event-image" onerror="this.src='assets/img/Monasterolo.jpg'">
                        <div class="event-content">
                            <div class="event-date"><i class="fa-regular fa-calendar"></i> ${event.date}</div>
                            <h3>${event.title}</h3>
                            <p>${event.short_desc}</p>
                            <a href="evento.html?id=${event.id}" class="btn-outline">Scopri di più</a>
                        </div>
                    `;
                    eventsContainer.appendChild(card);
                });
            })
            .catch(error => {
                console.error(error);
                eventsContainer.innerHTML = '<p>Al momento non sono disponibili eventi programmati.</p>';
            });
    }

    // Check if we are on the event detail page
    const eventDetailContainer = document.getElementById('event-detail-container');
    if (eventDetailContainer) {
        const urlParams = new URLSearchParams(window.location.search);
        const eventId = urlParams.get('id');

        if (!eventId) {
            eventDetailContainer.innerHTML = `<h2>Evento non trovato</h2><p>L'ID dell'evento non è specificato.</p>`;
            return;
        }

        fetch('data/events.json')
            .then(response => {
                if (!response.ok) throw new Error('Errore nel caricamento degli eventi');
                return response.json();
            })
            .then(events => {
                const event = events.find(e => e.id === eventId);
                
                if (!event) {
                    eventDetailContainer.innerHTML = `<h2>Evento non trovato</h2><p>L'evento richiesto non esiste.</p>`;
                    return;
                }

                // Costruisci i metadati dinamicamente in base ai campi opzionali
                let metaHTML = `<div class="meta-item"><i class="fa-regular fa-calendar"></i> ${event.date || 'Data da definire'}</div>`;
                if (event.time) {
                    metaHTML += `<div class="meta-item"><i class="fa-regular fa-clock"></i> ${event.time}</div>`;
                }
                if (event.location) {
                    metaHTML += `<div class="meta-item"><i class="fa-solid fa-location-dot"></i> ${event.location}</div>`;
                }
                if (event.price) {
                    metaHTML += `<div class="meta-item"><i class="fa-solid fa-ticket"></i> ${event.price}</div>`;
                }

                let actionsHTML = `<a href="index.html#eventi" class="btn btn-secondary">Torna agli Eventi</a>`;
                if (event.booking_link) {
                    actionsHTML += `<a href="${event.booking_link}" target="_blank" class="btn btn-primary">Prenota Ora</a>`;
                }

                const detailHTML = `
                    <div class="event-detail-card">
                        <img src="${event.image}" alt="${event.title}" class="event-detail-hero" onerror="this.src='assets/img/Monasterolo.jpg'">
                        <div class="event-detail-body">
                            <h1 class="event-detail-title">${event.title}</h1>
                            <div class="event-detail-meta">
                                ${metaHTML}
                            </div>
                            <div class="event-detail-desc">
                                ${event.full_desc ? event.full_desc.split('\n').map(p => `<p>${p}</p>`).join('') : '<p>Dettagli non disponibili.</p>'}
                            </div>
                            <div class="event-detail-actions">
                                ${actionsHTML}
                            </div>
                        </div>
                    </div>
                `;
                
                eventDetailContainer.innerHTML = detailHTML;
                document.title = `${event.title} | Proloco Monasterolo del Castello`;
            })
            .catch(error => {
                console.error(error);
                eventDetailContainer.innerHTML = `<h2>Errore</h2><p>Impossibile caricare i dettagli dell'evento. Riprova più tardi.</p>`;
            });
    }
});