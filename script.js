document.addEventListener('DOMContentLoaded', () => {
    // Haupt-Variablen
    let glowUps = [];
    let currentIndex = 0;
    let ratings = {};

    // DOM-Elemente
    const galleryContainer = document.getElementById('gallery-container');
    const resultsContainer = document.getElementById('results-container');
    const currentGlowUpElement = document.getElementById('current-glowup');
    const progressElement = document.getElementById('progress');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const likeBtn = document.getElementById('like-btn');
    const superlikeBtn = document.getElementById('superlike-btn');
    const goldenBuzzerBtn = document.getElementById('goldenbuzzer-btn');
    const restartBtn = document.getElementById('restart-btn');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const reloadBtn = document.getElementById('reload-btn');

    // Ergebnis-Container
    const likeResults = document.getElementById('like-results');
    const superlikeResults = document.getElementById('superlike-results');
    const goldenBuzzerResults = document.getElementById('golden-buzzer-results');

    // Event-Listener für den Reload-Button
    function setupReloadButton() {
        reloadBtn.addEventListener('click', () => {
            // Zeige Ladeanimation
            reloadBtn.classList.add('spin-animation');
            
            // Neuladen der Bilder
            reloadGlowUps().then(() => {
                // Entferne Ladeanimation nach dem Laden
                setTimeout(() => {
                    reloadBtn.classList.remove('spin-animation');
                }, 1000);
            });
        });
    }

    // Dark Mode
    function setupThemeToggle() {
        const htmlElement = document.documentElement;
        
        // Überprüfe, ob ein Theme im localStorage gespeichert ist
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            htmlElement.classList.remove('dark-mode');
            htmlElement.classList.add('light-mode');
            themeToggleBtn.querySelector('.icon').textContent = '🌙';
            themeToggleBtn.setAttribute('aria-label', 'Darkmode umschalten');
        } else {
            // Standardmäßig Dark Mode
            htmlElement.classList.add('dark-mode');
            htmlElement.classList.remove('light-mode');
            themeToggleBtn.querySelector('.icon').textContent = '☀️';
            themeToggleBtn.setAttribute('aria-label', 'Lightmode umschalten');
        }
        
        // Event-Listener für den Theme-Toggle-Button
        themeToggleBtn.addEventListener('click', () => {
            if (htmlElement.classList.contains('light-mode')) {
                htmlElement.classList.remove('light-mode');
                htmlElement.classList.add('dark-mode');
                localStorage.setItem('theme', 'dark');
                themeToggleBtn.querySelector('.icon').textContent = '☀️';
                themeToggleBtn.setAttribute('aria-label', 'Lightmode umschalten');
            } else {
                htmlElement.classList.remove('dark-mode');
                htmlElement.classList.add('light-mode');
                localStorage.setItem('theme', 'light');
                themeToggleBtn.querySelector('.icon').textContent = '🌙';
                themeToggleBtn.setAttribute('aria-label', 'Darkmode umschalten');
            }
        });
    }

    // Lade zunächst die vorhandenen Bewertungen aus dem localStorage
    function loadRatings() {
        const savedRatings = localStorage.getItem('glowUpRatings');
        if (savedRatings) {
            ratings = JSON.parse(savedRatings);
        }
    }

    // Lade die Glow-Up-Daten aus der JSON-Datei
    async function loadGlowUps() {
        try {
            // Scannen des GlowUp-Ordners
            const glowUpsFromFolder = await scanGlowUpFolder();
            
            // Leere die aktuelle Liste
            glowUps = [];
            
            if (glowUpsFromFolder && glowUpsFromFolder.length > 0) {
                console.log(`${glowUpsFromFolder.length} Glow-Ups im Ordner gefunden`);
                glowUps = glowUpsFromFolder;
                
                // Speichere die gefundenen Glow-Ups im localStorage für schnelleres Laden beim nächsten Mal
                localStorage.setItem('cachedGlowUps', JSON.stringify(glowUpsFromFolder));
                localStorage.setItem('glowUpsCacheTime', Date.now().toString());
            } else {
                console.log("Keine Bilder im Ordner gefunden, versuche Cache zu laden...");
                
                // Versuche Bilder aus dem Cache zu laden
                const cachedGlowUps = localStorage.getItem('cachedGlowUps');
                
                if (cachedGlowUps) {
                    console.log('Lade Bilder aus dem Cache...');
                    glowUps = JSON.parse(cachedGlowUps);
                } else {
                    // Wenn keine Bilder gefunden wurden, zeige Sample-Bilder
                    console.log('Keine Bilder im Cache, lade Beispieldaten...');
                    glowUps = getSampleGlowUps();
                }
            }
            
            if (glowUps.length > 0) {
                // Log die geladenen Glow-Ups für Debugging
                console.log("Geladene Glow-Ups:", glowUps.map(g => g.name));
                updateProgress();
                displayCurrentGlowUp();
            } else {
                alert('Keine Glow-Ups gefunden! Bitte füge Bilder zum GlowUp-Ordner hinzu.');
            }
        } catch (error) {
            console.error('Fehler beim Laden der Glow-Ups:', error);
            alert('Fehler beim Laden der Daten. Bitte später erneut versuchen.');
        }
    }

    // Scannt den GlowUp-Ordner nach Bildern mit umfassender automatischer Erkennung
    async function scanGlowUpFolder() {
        try {
            console.log("Starte automatischen Scan nach Bildern im GlowUp-Ordner...");
            
            // Speichert gefundene Vorher-Bilder
            const beforeImages = [];
            // Speichert gefundene Nachher-Bilder
            const afterImages = [];
            
            // Liste der bekannten Bildendungen
            const imageExtensions = ['png', 'jpg', 'jpeg', 'webp', 'gif'];
            
            // Erzeugt systematisch alle möglichen Dateinamen und prüft sie
            const commonNames = [];
            
            // 1. Generische alphanumerische Versuche (a-z, 0-9, aa-zz)
            // Einzelne Buchstaben
            for (let charCode = 97; charCode <= 122; charCode++) {
                commonNames.push(String.fromCharCode(charCode));
            }
            // Zahlen 1-50
            for (let i = 1; i <= 50; i++) {
                commonNames.push(i.toString());
            }
            // Zwei Buchstaben
            for (let charCode1 = 97; charCode1 <= 122; charCode1++) {
                for (let charCode2 = 97; charCode2 <= 122; charCode2++) {
                    commonNames.push(String.fromCharCode(charCode1) + String.fromCharCode(charCode2));
                }
            }
            
            // 2. Häufige Vornamen hinzufügen
            const nameSuggestions = [
                'max', 'felix', 'tim', 'julian', 'leon', 'ben', 'lukas', 'finn', 'jonas', 'noah',
                'luca', 'paul', 'david', 'luis', 'elias', 'philipp', 'nico', 'tom', 'simon', 'jan',
                'sophie', 'maria', 'emma', 'hannah', 'mia', 'anna', 'lena', 'lea', 'emily', 'sofia',
                'julia', 'clara', 'maja', 'laura', 'sarah', 'lisa', 'marie', 'alina', 'johanna', 'lilli',
                'alex', 'chris', 'jamie', 'sam', 'robin', 'tony', 'kim', 'taylor', 'jordan', 'casey',
                'wohoioi', 'yuh', 'glow', 'up', 'stream', 'viewer', 'fan', 'vip', 'mod', 'sub',
                'user', 'member', 'subscriber', 'follower', 'friend', 'buddy', 'person', 'mensch',
                'medschen', 'man', 'woman', 'boy', 'girl', 'dude', 'guy', 'lady', 'miss', 'mr', 'mrs',
                'player', 'gamer', 'streamer', 'content', 'creator', 'artist', 'musician', 'dancer'
            ];
            
            // Kombiniere alle Namen
            commonNames.push(...nameSuggestions);
            
            console.log(`Prüfe ${commonNames.length * imageExtensions.length * 2} mögliche Dateivarianten...`);
            
            // Erstelle Batch-Gruppen, um die Anzahl gleichzeitiger Anfragen zu begrenzen
            const batchSize = 50;
            const batches = [];
            const fileChecks = [];
            
            // Generiere alle möglichen Dateikombinationen
            for (const name of commonNames) {
                for (const ext of imageExtensions) {
                    // Mit und ohne Altersangabe
                    for (const ageValue of [null, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 30]) {
                        if (ageValue === null) {
                            fileChecks.push(`${name}..v.${ext}`);
                            fileChecks.push(`${name}..n.${ext}`);
                        } else {
                            fileChecks.push(`${name}..v_${ageValue}.${ext}`);
                            fileChecks.push(`${name}..n_${ageValue}.${ext}`);
                        }
                    }
                }
            }
            
            // Teile die Dateien in Batches auf
            for (let i = 0; i < fileChecks.length; i += batchSize) {
                batches.push(fileChecks.slice(i, i + batchSize));
            }
            
            console.log(`Insgesamt ${fileChecks.length} mögliche Dateien in ${batches.length} Batches`);
            
            // Verarbeite die Batches nacheinander
            let foundFiles = 0;
            for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
                const batch = batches[batchIndex];
                console.log(`Prüfe Batch ${batchIndex+1}/${batches.length}...`);
                
                const batchPromises = batch.map(fileName => {
                    const fileInfo = parseFileName(fileName);
                    if (!fileInfo) return Promise.resolve();
                    
                    const imagePath = `GlowUp/${fileName}`;
                    return checkImageExists(imagePath).then(exists => {
                        if (exists) {
                            foundFiles++;
                            console.log(`Gefunden: ${fileName}`);
                            if (fileInfo.type === 'before') {
                                beforeImages.push({
                                    name: fileInfo.name,
                                    age: fileInfo.age,
                                    path: imagePath
                                });
                            } else if (fileInfo.type === 'after') {
                                afterImages.push({
                                    name: fileInfo.name,
                                    age: fileInfo.age,
                                    path: imagePath
                                });
                            }
                        }
                    });
                });
                
                // Warte, bis der aktuelle Batch fertig ist
                await Promise.all(batchPromises);
            }
            
            console.log(`Scan abgeschlossen! ${foundFiles} Dateien gefunden.`);
            console.log(`Gefunden: ${beforeImages.length} Vorher-Bilder und ${afterImages.length} Nachher-Bilder`);
            
            // Entferne Duplikate
            const uniqueBeforeImages = [];
            for (const img of beforeImages) {
                if (!uniqueBeforeImages.some(existing => existing.name === img.name)) {
                    uniqueBeforeImages.push(img);
                }
            }
            
            const uniqueAfterImages = [];
            for (const img of afterImages) {
                if (!uniqueAfterImages.some(existing => existing.name === img.name)) {
                    uniqueAfterImages.push(img);
                }
            }
            
            console.log(`Nach Entfernung von Duplikaten: ${uniqueBeforeImages.length} Vorher-Bilder und ${uniqueAfterImages.length} Nachher-Bilder`);
            
            // Debug: Gib die gefundenen Bilder aus
            console.log("Vorher-Bilder:", uniqueBeforeImages.map(img => img.name));
            console.log("Nachher-Bilder:", uniqueAfterImages.map(img => img.name));
            
            // Jetzt kombinieren wir die Vor- und Nachher-Bilder
            const glowUpsData = [];
            let id = 1;
            
            // Durchsuche alle Vorher-Bilder
            for (const beforeImage of uniqueBeforeImages) {
                // Finde das passende Nachher-Bild
                const matchingAfterImage = uniqueAfterImages.find(img => img.name === beforeImage.name);
                
                if (matchingAfterImage) {
                    glowUpsData.push({
                        id: id++,
                        name: beforeImage.name,
                        age: beforeImage.age || matchingAfterImage.age,
                        beforeImage: beforeImage.path,
                        afterImage: matchingAfterImage.path
                    });
                } else {
                    console.log(`Kein passendes Nachher-Bild für ${beforeImage.name} gefunden!`);
                }
            }
            
            console.log(`Insgesamt ${glowUpsData.length} vollständige Glow-Ups gefunden.`);
            return glowUpsData;
        } catch (error) {
            console.error('Fehler beim Scannen des Ordners:', error);
            return [];
        }
    }
    
    // Prüft, ob ein Bild existiert, indem es versucht wird zu laden
    async function checkImageExists(url) {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url;
        });
    }

    // Fallback: Beispieldaten für die Glow-Ups
    function getSampleGlowUps() {
        return [
            {
                id: 1,
                name: 'Wohoioi',
                age: null,
                beforeImage: 'GlowUp/wohoioi..v.png',
                afterImage: 'GlowUp/wohoioi..n.png'
            },
            {
                id: 2,
                name: 'Yuh',
                age: 19,
                beforeImage: 'GlowUp/yuh..v_19.png',
                afterImage: 'GlowUp/yuh..n_19.png'
            }
        ];
    }

    // Aktualisiere die Fortschrittsanzeige
    function updateProgress() {
        progressElement.textContent = `${currentIndex + 1} / ${glowUps.length}`;
        
        // Aktiviere/deaktiviere Navigationsbuttons
        prevBtn.disabled = currentIndex === 0;
        nextBtn.disabled = currentIndex === glowUps.length - 1;
        
        // Zeige "Ergebnisse anzeigen" Button als letzten Schritt an
        if (currentIndex === glowUps.length - 1) {
            nextBtn.textContent = 'Ergebnisse anzeigen';
        } else {
            nextBtn.textContent = 'Weiter';
        }
    }

    // Zeige das aktuelle Glow-Up an
    function displayCurrentGlowUp() {
        const glowUp = glowUps[currentIndex];
        
        // Setze den Container zurück
        currentGlowUpElement.innerHTML = '';
        
        // Deaktiviere ausgewählte Buttons
        clearSelectedRatingButtons();
        
        // Erstelle das Vorher-Bild (standardmäßig mit Blur-Effekt)
        const imageElement = document.createElement('img');
        imageElement.src = glowUp.beforeImage;
        imageElement.alt = `${glowUp.name} vorher`;
        imageElement.classList.add('glowup-image', 'blurred', 'scale-in');
        imageElement.dataset.state = 'before-blurred';
        
        // Erstelle das Info-Element mit Name und Alter
        const infoElement = document.createElement('div');
        infoElement.classList.add('person-info', 'slide-in');
        
        // Nur Alter anzeigen, wenn es vorhanden ist
        const ageText = glowUp.age ? `<p>${glowUp.age} Jahre</p>` : '';
        
        infoElement.innerHTML = `
            <h2>${glowUp.name}</h2>
            ${ageText}
        `;
        
        // Füge die Elemente zum Container hinzu
        currentGlowUpElement.appendChild(imageElement);
        currentGlowUpElement.appendChild(infoElement);
        
        // Füge einen Klick-Event-Listener zum Bild hinzu
        imageElement.addEventListener('click', handleImageClick);
        
        // Stelle die Bewertung wieder her, falls vorhanden
        restoreRating();
        
        // Füge Animation zum Container hinzu
        currentGlowUpElement.classList.add('rotate-in');
        setTimeout(() => {
            currentGlowUpElement.classList.remove('rotate-in');
        }, 700);
    }

    // Behandelt das Klicken auf das Bild
    function handleImageClick(event) {
        const glowUp = glowUps[currentIndex];
        const imageElement = event.target;
        const currentState = imageElement.dataset.state;
        
        if (currentState === 'before-blurred') {
            // Entferne den Blur-Effekt mit Animation
            imageElement.classList.add('scale-in');
            imageElement.classList.remove('blurred');
            imageElement.dataset.state = 'before-clear';
            
            setTimeout(() => {
                imageElement.classList.remove('scale-in');
            }, 600);
        } else if (currentState === 'before-clear') {
            // Wechsle zum Nachher-Bild mit Animation
            imageElement.style.opacity = 0;
            imageElement.style.transform = 'rotateY(90deg)';
            
            setTimeout(() => {
                imageElement.src = glowUp.afterImage;
                imageElement.alt = `${glowUp.name} nachher`;
                imageElement.dataset.state = 'after';
                
                // Füge eine kurze Verzögerung hinzu, bevor das Bild wieder angezeigt wird
                setTimeout(() => {
                    imageElement.style.opacity = 1;
                    imageElement.style.transform = 'rotateY(0deg)';
                    imageElement.classList.add('pulse');
                    
                    // Entferne die Pulse-Animation nach einer Weile
                    setTimeout(() => {
                        imageElement.classList.remove('pulse');
                    }, 2000);
                }, 100);
            }, 300);
        }
    }

    // Event-Listener für die Bewertungsbuttons
    function setupRatingButtons() {
        likeBtn.addEventListener('click', () => setRating('like'));
        superlikeBtn.addEventListener('click', () => setRating('superlike'));
        goldenBuzzerBtn.addEventListener('click', () => setRating('goldenbuzzer'));
    }

    // Setze eine Bewertung
    function setRating(ratingType) {
        const glowUpId = glowUps[currentIndex].id;
        
        // Entferne bisherige Auswahl
        clearSelectedRatingButtons();
        
        // Markiere den ausgewählten Button
        switch (ratingType) {
            case 'like':
                likeBtn.classList.add('selected');
                break;
            case 'superlike':
                superlikeBtn.classList.add('selected');
                break;
            case 'goldenbuzzer':
                goldenBuzzerBtn.classList.add('selected');
                break;
        }
        
        // Speichere die Bewertung
        ratings[glowUpId] = ratingType;
        localStorage.setItem('glowUpRatings', JSON.stringify(ratings));
    }

    // Entferne die Auswahl aller Bewertungsbuttons
    function clearSelectedRatingButtons() {
        likeBtn.classList.remove('selected');
        superlikeBtn.classList.remove('selected');
        goldenBuzzerBtn.classList.remove('selected');
    }

    // Stelle eine vorherige Bewertung wieder her
    function restoreRating() {
        const glowUpId = glowUps[currentIndex].id;
        const rating = ratings[glowUpId];
        
        if (rating) {
            switch (rating) {
                case 'like':
                    likeBtn.classList.add('selected');
                    break;
                case 'superlike':
                    superlikeBtn.classList.add('selected');
                    break;
                case 'goldenbuzzer':
                    goldenBuzzerBtn.classList.add('selected');
                    break;
            }
        }
    }

    // Event-Listener für die Navigationsbuttons
    function setupNavigationButtons() {
        prevBtn.addEventListener('click', goToPreviousGlowUp);
        nextBtn.addEventListener('click', goToNextGlowUp);
    }

    // Gehe zum vorherigen Glow-Up
    function goToPreviousGlowUp() {
        if (currentIndex > 0) {
            currentIndex--;
            updateProgress();
            displayCurrentGlowUp();
        }
    }

    // Gehe zum nächsten Glow-Up oder zeige Ergebnisse an
    function goToNextGlowUp() {
        const currentGlowUpId = glowUps[currentIndex].id;
        
        // Überprüfe, ob das aktuelle Glow-Up bewertet wurde
        if (!ratings[currentGlowUpId]) {
            const confirmation = confirm('Du hast dieses Glow-Up noch nicht bewertet. Möchtest du trotzdem fortfahren?');
            if (!confirmation) {
                return;
            }
        }
        
        // Wenn wir beim letzten Glow-Up sind, zeige die Ergebnisse an
        if (currentIndex === glowUps.length - 1) {
            showResults();
            return;
        }
        
        // Sonst gehe zum nächsten Glow-Up
        currentIndex++;
        updateProgress();
        displayCurrentGlowUp();
    }

    // Zeige die Ergebnisse an
    function showResults() {
        // Verstecke die Galerie und zeige die Ergebnisse an
        galleryContainer.classList.add('hidden');
        resultsContainer.classList.remove('hidden');
        
        // Leere alle Ergebnis-Container
        likeResults.innerHTML = '';
        superlikeResults.innerHTML = '';
        goldenBuzzerResults.innerHTML = '';
        
        // Fülle die Ergebnis-Container mit den bewerteten Glow-Ups
        glowUps.forEach(glowUp => {
            const rating = ratings[glowUp.id];
            if (rating) {
                const resultItemHTML = createResultItemHTML(glowUp);
                
                switch (rating) {
                    case 'like':
                        likeResults.innerHTML += resultItemHTML;
                        break;
                    case 'superlike':
                        superlikeResults.innerHTML += resultItemHTML;
                        break;
                    case 'goldenbuzzer':
                        goldenBuzzerResults.innerHTML += resultItemHTML;
                        break;
                }
            }
        });
        
        // Füge eine Nachricht hinzu, wenn eine Kategorie leer ist
        if (likeResults.innerHTML === '') {
            likeResults.innerHTML = '<p>Keine Likes vergeben</p>';
        }
        if (superlikeResults.innerHTML === '') {
            superlikeResults.innerHTML = '<p>Keine Superlikes vergeben</p>';
        }
        if (goldenBuzzerResults.innerHTML === '') {
            goldenBuzzerResults.innerHTML = '<p>Keine Golden Buzzer vergeben</p>';
        }
        
        // Animiere die Ergebnis-Elemente
        setTimeout(() => {
            const resultItems = document.querySelectorAll('.result-item');
            resultItems.forEach((item, index) => {
                item.style.animationDelay = `${index * 0.1}s`;
            });
        }, 100);
    }

    // Erstelle das HTML für ein Ergebnis-Element
    function createResultItemHTML(glowUp) {
        // Nur Alter anzeigen, wenn es vorhanden ist
        const ageText = glowUp.age ? `<p>${glowUp.age} Jahre</p>` : '';
        
        return `
            <div class="result-item slide-in">
                <div class="result-images">
                    <img src="${glowUp.beforeImage}" alt="${glowUp.name} vorher">
                    <img src="${glowUp.afterImage}" alt="${glowUp.name} nachher">
                </div>
                <div class="result-info">
                    <h4>${glowUp.name}</h4>
                    ${ageText}
                </div>
            </div>
        `;
    }

    // Neustart der Anwendung
    function setupRestartButton() {
        restartBtn.addEventListener('click', () => {
            currentIndex = 0;
            galleryContainer.classList.remove('hidden');
            resultsContainer.classList.add('hidden');
            updateProgress();
            displayCurrentGlowUp();
        });
    }

    // Funktion zum Parsen der Dateinamen nach dem Muster: name..v_alter.erweiterung
    function parseFileName(fileName) {
        const regex = /^(.+)\.\.([vn])(?:_(\d+))?\.([a-zA-Z]+)$/;
        const match = fileName.match(regex);
        
        if (match) {
            return {
                name: match[1],
                type: match[2] === 'v' ? 'before' : 'after',
                age: match[3] ? parseInt(match[3]) : null,
                extension: match[4]
            };
        }
        
        return null;
    }

    // Funktion zum erneuten Laden der Bilder
    async function reloadGlowUps() {
        // Cache löschen, um ein vollständiges Neuladen zu erzwingen
        localStorage.removeItem('cachedGlowUps');
        localStorage.removeItem('glowUpsCacheTime');
        
        // Anzeige zurücksetzen
        currentIndex = 0;
        
        // Neuladen starten
        await loadGlowUps();
        
        // Einen Toast anzeigen, wie viele Bilder geladen wurden
        showNotification(`${glowUps.length} Bilder gefunden und geladen!`);
    }

    // Zeigt eine Benachrichtigung an
    function showNotification(message) {
        // Erstelle ein Benachrichtigungselement
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        
        // Füge es zum Body hinzu
        document.body.appendChild(notification);
        
        // Nach 3 Sekunden wieder entfernen
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 3000);
    }

    // Initialisierung
    function init() {
        loadRatings();
        setupThemeToggle();
        loadGlowUps();
        setupRatingButtons();
        setupNavigationButtons();
        setupRestartButton();
        setupReloadButton();
    }

    // Starte die Anwendung
    init();
}); 