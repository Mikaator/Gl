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

    // Ergebnis-Container
    const likeResults = document.getElementById('like-results');
    const superlikeResults = document.getElementById('superlike-results');
    const goldenBuzzerResults = document.getElementById('golden-buzzer-results');

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

    // Finde automatisch Bilder im GlowUp-Ordner und lade sie
    async function loadGlowUps() {
        try {
            // Scannen des GlowUp-Ordners
            const glowUpsFromFolder = await scanGlowUpFolder();
            
            if (glowUpsFromFolder.length > 0) {
                glowUps = glowUpsFromFolder;
                updateProgress();
                displayCurrentGlowUp();
            } else {
                // Wenn keine Bilder gefunden wurden, versuche die JSON zu laden als Fallback
                console.log('Keine Bilder im Ordner gefunden, versuche JSON zu laden...');
                try {
                    const response = await fetch('glowups.json');
                    if (!response.ok) {
                        throw new Error('Fehler beim Laden der JSON-Daten');
                    }
                    
                    glowUps = await response.json();
                    
                    if (glowUps.length > 0) {
                        updateProgress();
                        displayCurrentGlowUp();
                    } else {
                        throw new Error('Keine Glow-Ups in der JSON gefunden');
                    }
                } catch (jsonError) {
                    console.error('Fehler beim Laden der JSON:', jsonError);
                    glowUps = getSampleGlowUps();
                    
                    if (glowUps.length > 0) {
                        updateProgress();
                        displayCurrentGlowUp();
                    } else {
                        alert('Keine Glow-Ups gefunden! Bitte füge Bilder zum GlowUp-Ordner hinzu.');
                    }
                }
            }
        } catch (error) {
            console.error('Fehler beim Laden der Glow-Ups:', error);
            alert('Fehler beim Laden der Daten. Bitte später erneut versuchen.');
        }
    }

    // Scannt den GlowUp-Ordner nach Bildern
    async function scanGlowUpFolder() {
        // Diese Funktion simuliert das Scannen des Ordners im Frontend
        // In einer echten Server-Umgebung würde dies durch einen API-Aufruf erfolgen
        
        // Liste der bekannten Bildendungen
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        
        // Speichert gefundene Vorher-Bilder
        const beforeImages = [];
        // Speichert gefundene Nachher-Bilder
        const afterImages = [];
        
        // In einer echten Anwendung würde hier ein API-Aufruf stattfinden
        // Da wir nur im Frontend arbeiten, versuchen wir Bilder zu finden, indem wir
        // direkt die Dateien prüfen
        
        // Teste alle Dateien im GlowUp-Ordner, die wir kennen
        const filesToCheck = [
            // Dynamisch gefundene Dateien aus deinem Ordner
            'wohoioi..v.png', 'wohoioi..n.png',
            'yuh..v_19.png', 'yuh..n_19.png'
        ];
        
        // Prüfe jede Datei
        for (const fileName of filesToCheck) {
            const fileInfo = parseFileName(fileName);
            
            if (fileInfo && imageExtensions.includes(fileInfo.extension.toLowerCase())) {
                const imagePath = `GlowUp/${fileName}`;
                
                // Prüfe, ob das Bild tatsächlich existiert
                const imageExists = await checkImageExists(imagePath);
                
                if (imageExists) {
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
            }
        }
        
        // Jetzt kombinieren wir die Vor- und Nachher-Bilder
        const glowUpsData = [];
        let id = 1;
        
        // Durchsuche alle Vorher-Bilder
        for (const beforeImage of beforeImages) {
            // Finde das passende Nachher-Bild
            const matchingAfterImage = afterImages.find(img => img.name === beforeImage.name);
            
            if (matchingAfterImage) {
                glowUpsData.push({
                    id: id++,
                    name: beforeImage.name,
                    age: beforeImage.age || matchingAfterImage.age,
                    beforeImage: beforeImage.path,
                    afterImage: matchingAfterImage.path
                });
            }
        }
        
        return glowUpsData;
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

    // Initialisierung
    function init() {
        loadRatings();
        setupThemeToggle();
        loadGlowUps();
        setupRatingButtons();
        setupNavigationButtons();
        setupRestartButton();
    }

    // Starte die Anwendung
    init();
}); 