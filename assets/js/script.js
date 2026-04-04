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

            // Troviamo sulla pagina l'elemento a cui puntiamo
            const target = document.querySelector(href);
            if (target) {
                // Diamo istruzione al browser di scorrere dolcemente fino alla posizione del target
                target.scrollIntoView({
                    behavior: 'smooth'
                });
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
                
                // Nel caso la lista eventi nel JSON fosse vuota o tutti eliminati, mostriamo un avviso elegante
                if (events.length === 0) {
                    eventsContainer.innerHTML = '<p>Nessun evento in programma al momento.</p>';
                    return;
                }
                
                // Cicliamo array di eventi, e per ongi blocco costruiamo al volo la sua card HTML personalizzata
                events.forEach(event => {
                    const card = document.createElement('div');
                    card.className = 'event-card';
                    card.innerHTML = `
                        <!-- 'onerror' è una mossa di sicurezza: se la foto caricata non esiste o e' rotta la URL, forzeremo la visualizzazione di un'immagine sostitutiva -->
                        <img src="${event.image}" alt="${event.title}" class="event-image" onerror="this.src='assets/img/Monasterolo.jpg'">
                        <div class="event-content">
                            <div class="event-date"><i class="fa-regular fa-calendar"></i> ${event.date}</div>
                            <h3>${event.title}</h3>
                            <p>${event.short_desc}</p>
                            <!-- Bottone con query string. Tramite '?id=xxxxx' passiamo al file evento.html un indicatore che gli farà sapere chi mostrare! -->
                            <a href="evento.html?id=${event.id}" class="btn-outline">Scopri di più</a>
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
                // ...ma questa volta invece di stamparli tutti usiamo .find() per cercare SOLO l'evento dove i codici ID combaciano
                const event = events.find(e => e.id === eventId);
                
                // Se viene inserito un id fantasma o obsoleto (evento.html?id=falso-id)
                if (!event) {
                    eventDetailContainer.innerHTML = `<h2>Evento non trovato</h2><p>L'evento richiesto non esiste.</p>`;
                    return;
                }

                // -> COSTRUIAMO I METADATI (Info Veloci): Formiamo le etichette solo se il relativo dato esiste all'interno del JSON (evita caselle vuote/rotte)
                let metaHTML = `<div class="meta-item"><i class="fa-regular fa-calendar"></i> ${event.date || 'Data da definire'}</div>`;
                if (event.time) {     metaHTML += `<div class="meta-item"><i class="fa-regular fa-clock"></i> ${event.time}</div>`; }
                if (event.location) { metaHTML += `<div class="meta-item"><i class="fa-solid fa-location-dot"></i> ${event.location}</div>`; }
                if (event.price) {    metaHTML += `<div class="meta-item"><i class="fa-solid fa-ticket"></i> ${event.price}</div>`; }
                if (event.website) {  metaHTML += `<div class="meta-item"><i class="fa-solid fa-globe"></i> <a href="${event.website}" target="_blank" rel="noopener noreferrer" style="color:var(--primary-blue); text-decoration:none; font-weight:600;">Sito Web</a></div>`; }

                // -> COSTRUIAMO I BOTTONI DI AZIONE: Il link prenotazione comparirà unicamente se riempito sul file JSON
                let actionsHTML = `<a href="index.html#eventi" class="btn btn-secondary">Torna agli Eventi</a>`;
                if (event.booking_link) {
                    actionsHTML += `<a href="${event.booking_link}" target="_blank" class="btn btn-primary">Prenota Ora</a>`;
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
                            <div class="event-detail-meta">
                                ${metaHTML}
                            </div>
                            <!-- Un piccolo trick JS: Spezziamo il testo lungo usando 'Andare-a-Capo' (\n) e lo traduciamo per l'HTML nel tag paragrafo nativo <p> -->
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