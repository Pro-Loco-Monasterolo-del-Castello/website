// =======================================================================
// SCRIPT PRINCIPALE: Gestione Interfaccia e Dati Dinamici (Eventi)
// =======================================================================

// 1. SCORRIMENTO FLUIDO (Smooth Scroll)
// Aggiunge un effetto di scorrimento morbido (non "a scatto") quando si clicca sui link del menu (es. "#eventi", "#contatti")
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        // Recuperiamo il valore inserito nell'attributo href del tag <a> (es: "#home")
        const href = this.getAttribute('href');
        
        // Verifichiamo che puntino effettivamente ad un ancoraggio interno della stessa pagina
        if (href.startsWith('#')) {
            e.preventDefault(); // Annulliamo il salto di sistema brusco predefinito

            if (href === '#') {
                // Se l'ancora è solo '#', scorriamo dolcemente a inizio pagina
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            } else {
                // Troviamo sulla pagina l'elemento a cui puntiamo
                const target = document.querySelector(href);
                if (target) {
                    // Diamo istruzione al browser di scorrere dolcemente fino alla posizione del target
                    target.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            }
        }
    });
});


// =======================================================================
// 2. SISTEMA DI ESPOSIZIONE EVENTI DINAMICO (Architettura JSON-based)
// Ascoltiamo l'evento speciale 'DOMContentLoaded' per essere certi che l'HTML sia caricato e pronto
// =======================================================================
document.addEventListener('DOMContentLoaded', () => {

    // ----------------------------------------------------
    // A. GESTIONE DELLA HOMEPAGE (Griglia Panoramica)
    // ----------------------------------------------------
    const eventsContainer = document.getElementById('events-container');
    
    // Controlliamo che l'elemento 'events-container' esista davvero (cioè siamo su index.html)
    if (eventsContainer) {
        // Effettuiamo una chiamata (fetch) per scaricare in modo asincrono il nostro "Database" finto in JSON
        fetch('data/events.json')
            .then(response => {
                // Qualora il file non risponda (404 Not Found, CORS blocks), rilanciamo un errore intercettabile in basso
                if (!response.ok) throw new Error('Errore di connessione a events.json');
                return response.json(); // Trasformiamo il testo del JSON in un oggeto Array manipolabile in JavaScript
            })
            .then(events => {
                // Svuotiamo il contenuto segnaposto prima di costruire le card grafiche
                eventsContainer.innerHTML = ''; 

                // Filtriamo per ottenere tutti gli eventi in evidenza non ancora conclusi
                const featuredEvents = events.filter(e => e.featured && !e.past);

                // Nel caso la lista eventi nel JSON fosse vuota o tutti eliminati, mostriamo un avviso elegante
                if (featuredEvents.length === 0) {
                    eventsContainer.innerHTML = '<p>Nessun evento in programma al momento.</p>';
                    return;
                }
                
                // Cicliamo array di eventi, e per ogni blocco costruiamo al volo la sua card HTML personalizzata
                featuredEvents.forEach(event => {
                    // === NOVITA': Generazione Tag per ogni organizzatore ===
                    // Se esistono associazioni per questo evento, creiamo piccoli blocchi <span> colorati
                    const tagsHTML = event.associations ? event.associations.map(assoc => {
                        const safeClass = assoc.toLowerCase().replace(/\s+/g, '-');
                        return `<span class="tag-badge tag-${safeClass}">${assoc}</span>`;
                    }).join('') : '';

                    const card = document.createElement('div');
                    card.className = 'event-card';
                    card.innerHTML = `
                        <!-- 'onerror' è una mossa di sicurezza -->
                        <div class="event-image-wrapper">
                            <img src="${event.image}" alt="${event.title}" class="event-image" onerror="this.src='assets/img/Monasterolo.jpg'">
                            <div class="event-tags-container">${tagsHTML}</div>
                        </div>
                        <div class="event-content">
                            <div class="event-date"><i class="fa-regular fa-calendar"></i> ${event.date}</div>
                            <h3>${event.title}</h3>
                            <p>${event.short_desc}</p>
                            <!-- Bottone con query string. Se c'è un custom_link, usiamo quello, altrimenti il link di dettaglio standard! -->
                            <a href="${event.custom_link || 'evento.html?id=' + event.id}" class="btn-outline">Scopri di più</a>
                        </div>
                    `;
                    // Infine accodiamo il blocco generato nel container padrone visibile sul sito
                    eventsContainer.appendChild(card);
                });
            })
            .catch(error => {
                // Catturiamo gli errori (es. utente lancia il file localmente senza live-server, fallendo la fetch)
                console.error("Errore Download Griglia Eventi:", error);
                eventsContainer.innerHTML = '<p>Al momento non sono disponibili eventi programmati.</p>';
            });
    }

    // ----------------------------------------------------
    // B. GESTIONE DELLA PAGINA DEL SINGOLO EVENTO
    // ----------------------------------------------------
    const eventDetailContainer = document.getElementById('event-detail-container');
    
    // Controlliamo che l'elemento esista (cioè siamo dentro evento.html)
    if (eventDetailContainer) {
        
        // Costruiamo un "URLSearchParams" che estrapola chirurgicamente il valore "id" dall'indirizzo (es: localhost/evento.html?id=sagra-costina)
        const urlParams = new URLSearchParams(window.location.search);
        const eventId = urlParams.get('id');

        // Se l'utente visita evento.html manualmente senza indicare alcun ID
        if (!eventId) {
            eventDetailContainer.innerHTML = `<h2>Evento non trovato</h2><p>L'ID dell'evento non è specificato.</p>`;
            return;
        }

        // Recuperiamo lo stesso identico elenco JSON...
        fetch('data/events.json')
            .then(response => {
                if (!response.ok) throw new Error('Errore connessione a events.json');
                return response.json();
            })
            .then(events => {
                // Cerchiamo l'evento specifico il cui "id" combacia con l'id cercato nell'URL
                const event = events.find(e => e.id === eventId);
                
                // Se viene inserito un id fantasma o obsoleto (evento.html?id=falso-id)
                if (!event) {
                    eventDetailContainer.innerHTML = `<h2>Evento non trovato</h2><p>L'evento richiesto non esiste.</p>`;
                    return;
                }

                // Generiamo i badge delle associazioni ed eventualmente il badge Concluso
                let tagsHTML = event.associations ? event.associations.map(assoc => {
                    const safeClass = assoc.toLowerCase().replace(/\s+/g, '-');
                    return `<span class="tag-badge tag-${safeClass}">${assoc}</span>`;
                }).join('') : '';

                if (event.past) {
                    tagsHTML += `<span class="tag-badge tag-concluso"><i class="fa-solid fa-check"></i> Concluso</span>`;
                }

                // Avviso evento passato
                const pastNoticeHTML = event.past ? `
                    <div class="past-event-notice">
                        <i class="fa-solid fa-clock-rotate-left"></i>
                        <span>Questo evento si è svolto in data <strong>${event.date}</strong> ed è attualmente concluso.</span>
                    </div>
                ` : '';

                // -> COSTRUIAMO I METADATI (Info Veloci): Formiamo le etichette solo se il relativo dato esiste all'interno del JSON (evita caselle vuote/rotte)
                let metaHTML = `<div class="meta-item"><i class="fa-regular fa-calendar"></i> ${event.date || 'Data da definire'}</div>`;
                if (event.time) {     metaHTML += `<div class="meta-item"><i class="fa-regular fa-clock"></i> ${event.time}</div>`; }
                if (event.location) { metaHTML += `<div class="meta-item"><i class="fa-solid fa-location-dot"></i> ${event.location}</div>`; }
                if (event.price) {    metaHTML += `<div class="meta-item"><i class="fa-solid fa-ticket"></i> ${event.price}</div>`; }
                if (event.website) {  metaHTML += `<div class="meta-item"><i class="fa-solid fa-globe"></i> <a href="${event.website}" target="_blank" rel="noopener noreferrer" style="color:var(--primary-blue); text-decoration:none; font-weight:600;">Sito Web</a></div>`; }

                // -> COSTRUIAMO I BOTTONI DI AZIONE: Il link prenotazione comparirà unicamente se l'evento NON è passato ed ha un booking_link
                let actionsHTML = `<a href="tutti-eventi.html" class="btn btn-secondary">Torna all'Archivio Eventi</a>`;
                if (event.booking_link && !event.past) {
                    const isWa = event.booking_link.includes('wa.me') || event.booking_link.includes('whatsapp');
                    const isTel = event.booking_link.startsWith('tel:');
                    
                    let btnClass = 'btn btn-primary';
                    let btnText = 'Prenota Ora';
                    let targetAttr = 'target="_blank"';

                    if (isWa) {
                        btnClass = 'btn btn-whatsapp';
                        btnText = '<i class="fa-brands fa-whatsapp"></i> Prenota su WhatsApp';
                    } else if (isTel) {
                        btnClass = 'btn btn-phone';
                        btnText = `<i class="fa-solid fa-phone"></i> ${event.booking_label || 'Chiama per Prenotare'}`;
                        targetAttr = '';
                    }

                    actionsHTML += `<a href="${event.booking_link}" ${targetAttr} class="${btnClass}">${btnText}</a>`;
                } else if (event.past) {
                    actionsHTML += `<span class="btn btn-secondary" style="opacity: 0.7; cursor: default;"><i class="fa-solid fa-check-circle"></i> Evento Concluso</span>`;
                }

                // -> COSTRUIAMO LA VISUALE MULTIMEDIALE (Carosello Vs. Singola Immagine)
                let mediaHTML = '';
                // Se 'gallery' esiste ed ezeedendo 1 foto, attiviamo il codice Carosello Multi-Foto
                if (event.gallery && event.gallery.length > 0) {
                    
                    // Cicliamo sull'array delle foto e marchiamo la prima immagine (indice 0) con classe 'active', oscurando temporaneamente le altre
                    const slides = event.gallery.map((img, idx) => `
                        <div class="carousel-slide ${idx === 0 ? 'active' : ''}">
                            <img src="${img}" alt="${event.title} - Foto ${idx + 1}" class="event-detail-hero" onerror="this.src='assets/img/Monasterolo.jpg'">
                        </div>
                    `).join('');
                    
                    // Costruiamo allo stesso modo i pallini cliccabili (Dots) in parallelo alle slide
                    const dots = event.gallery.map((_, idx) => `
                        <span class="carousel-dot ${idx === 0 ? 'active' : ''}" data-idx="${idx}"></span>
                    `).join('');

                    mediaHTML = `
                        <div class="carousel-container" id="event-carousel">
                            <div class="carousel-track">
                                ${slides}
                            </div>
                            <!-- Aggiungiamo Menzione Frecce e Pallini ESCLUSIVAMENTE se le foto sono due o più, altrimenti e' inutile navigare! -->
                            ${event.gallery.length > 1 ? `
                            <button class="carousel-btn prev-btn"><i class="fa-solid fa-chevron-left"></i></button>
                            <button class="carousel-btn next-btn"><i class="fa-solid fa-chevron-right"></i></button>
                            <div class="carousel-dots">
                                ${dots}
                            </div>
                            ` : ''}
                        </div>
                    `;
                } else {
                    // Fallback Classico (In caso il JSON usase solo 'image' senza 'gallery')
                    mediaHTML = `<img src="${event.image}" alt="${event.title}" class="event-detail-hero" onerror="this.src='assets/img/Monasterolo.jpg'">`;
                }

                // -> FINALE: Assemblaggio del codice in un corpo solo (Main Card)
                const detailHTML = `
                    <div class="event-detail-card">
                        ${mediaHTML}
                        <div class="event-detail-body">
                            <h1 class="event-detail-title">${event.title}</h1>
                            <div style="margin-bottom: 15px;">${tagsHTML}</div>
                            ${pastNoticeHTML}
                            <div class="event-detail-meta">
                                ${metaHTML}
                            </div>
                            <!-- Convertiamo i ritorni a capo testuali (\n) in veri paragrafi HTML (<p>) -->
                            <div class="event-detail-desc">
                                ${event.full_desc ? event.full_desc.split('\n').map(p => `<p>${p}</p>`).join('') : '<p>Dettagli non disponibili.</p>'}
                            </div>
                            <div class="event-detail-actions">
                                ${actionsHTML}
                            </div>
                        </div>
                    </div>
                `;
                
                // Iniettiamo i risultati veri rimpiazzando lo 'spinner di caricamento' fittizio iniziale HTML
                eventDetailContainer.innerHTML = detailHTML;
                document.title = `${event.title} | Proloco Monasterolo del Castello`; // Aggiorna elegantemente il Titolo della Finestra Web/Tab del browser con il vero titolo dell'evento!

                // ----------------------------------------------------
                // APPENDICE: Logic Controller del Carosello Animato
                // ----------------------------------------------------
                if (event.gallery && event.gallery.length > 1) {
                    // Poichè i bottoni li abbiamo appena riversati dinamicamente, andiamo a catturarne i nodi DOM in questo esatto momento per potergli assegnare azioni
                    const slides = eventDetailContainer.querySelectorAll('.carousel-slide');
                    const dotsNodes = eventDetailContainer.querySelectorAll('.carousel-dot');
                    const prevBtn = eventDetailContainer.querySelector('.prev-btn');
                    const nextBtn = eventDetailContainer.querySelector('.next-btn');
                    let currentIndex = 0; // Tieni a mente lo stato attuale di quale foto si sta guadando della fila
                    let slideInterval; // Custodisce il timer Autopilot

                    // MASTER FUNCTION: Passando un numero d'indice (es. 2), oscura foto e pallini disattivandoli, e riattiva specificamente solo la foto numero 2.
                    const showSlide = (index) => {
                        slides.forEach(slide => slide.classList.remove('active'));
                        dotsNodes.forEach(dot => dot.classList.remove('active'));
                        
                        slides[index].classList.add('active');
                        dotsNodes[index].classList.add('active');
                        currentIndex = index;
                    };

                    const nextSlide = () => {
                        let index = currentIndex + 1; // Sali di uno alla volta.
                        if (index >= slides.length) index = 0; // Riavvolgi a capo per creare un circolo iterativo!
                        showSlide(index);
                    };

                    const prevSlide = () => {
                        let index = currentIndex - 1; // Scendi di uno.
                        if (index < 0) index = slides.length - 1; // Vai immediatamente in coda in ultima posizione
                        showSlide(index);
                    };

                    const startAutoPlay = () => {
                        // Richiama la funzione 'nextSlide()' regolarmente ogni 4000 millisecondi (4 secondi di stacco prolungato)
                        slideInterval = setInterval(nextSlide, 3000);
                    };

                    const resetAutoPlay = () => {
                        // Essenziale se l'utente 'bussa manualmente i tasti' impedendo che il timer salti di botto da sè
                        clearInterval(slideInterval);
                        startAutoPlay();
                    };

                    // Assegnazioni dei Mouse 'Clicks' -> al corrispondente Comportamento e riavvio del timer.
                    prevBtn.addEventListener('click', () => {
                        prevSlide();
                        resetAutoPlay();
                    });

                    nextBtn.addEventListener('click', () => {
                        nextSlide();
                        resetAutoPlay();
                    });

                    dotsNodes.forEach(dot => {
                        dot.addEventListener('click', (e) => {
                            // Legge con quale indice il programmatore aveva iniettato <span data-idx="X"> e proietta quella foto direttamente
                            const index = parseInt(e.target.getAttribute('data-idx'));
                            showSlide(index);
                            resetAutoPlay();
                        });
                    });

                    // Kick-Start! Initalizza il movimento passivo subito all'avvio.
                    startAutoPlay();
                }
            })
            .catch(error => {
                console.error("Fallimento Fatale Fetch Singola", error);
                eventDetailContainer.innerHTML = `<h2>Errore</h2><p>Impossibile caricare i dettagli dell'evento. Riprova più tardi.</p>`;
            });
    }
});