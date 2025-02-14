// Asynkroninen funktio, joka hakee paikan koordinaatit OpenStreetMapin Nominatim API:sta
async function getCoordinates(place) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}`;

    try {
        // Lähetetään HTTP-pyyntö ja odotetaan vastausta
        const response = await fetch(url);
        const data = await response.json();

        // Jos data sisältää koordinaatit, palautetaan ne
        if (data.length > 0) {
            return {
                lat: data[0].lat,
                lon: data[0].lon
            };
        } else {
            console.warn(`Koordinaatteja ei löytynyt: ${place}`);
            return null;
        }
    } catch (error) {
        console.error(`Virhe haettaessa koordinaatteja: ${place}`, error);
        return null;
    }
}

// Käsittelee vedä ja pudota -toiminnon, kun käyttäjä pudottaa tiedoston
function dropHandler(ev) {
    ev.preventDefault();
    console.log("Tiedosto(ja) pudotettu");

    // Tarkistetaan, käyttääkö selain `dataTransfer.items`-ominaisuutta
    if (ev.dataTransfer.items) {
        [...ev.dataTransfer.items].forEach((item) => {
            if (item.kind === "file") {
                const file = item.getAsFile();
                // Tarkistetaan, onko tiedosto Excel-muotoinen
                if (isExcelFile(file.name)) {
                    console.log(`Hyväksytty: ${file.name}`);
                    readExcelFile(file);
                } else {
                    console.warn(`Estetty: ${file.name} ei ole Excel-tiedosto`);
                }
            }
        });
    } else {
        // Jos selain ei tue `dataTransfer.items`, käytetään `dataTransfer.files`
        [...ev.dataTransfer.files].forEach((file) => {
            if (isExcelFile(file.name)) {
                console.log(`Hyväksytty: ${file.name}`);
                readExcelFile(file);
            } else {
                console.warn(`Estetty: ${file.name} ei ole Excel-tiedosto`);
            }
        });
    }
}

// Käsittelee vedä ja pudota -toiminnon, kun käyttäjä liikuttaa tiedostoa pudotusalueella
function dragOverHandler(ev) {
    ev.preventDefault();
    console.log("Tiedosto(ja) pudotusalueella");
}

// Tarkistaa, onko tiedosto Excel-tiedosto (tunnisteena .xlsx tai .xls)
function isExcelFile(fileName) {
    return fileName.toLowerCase().endsWith(".xlsx") || fileName.toLowerCase().endsWith(".xls");
}

// Lukee Excel-tiedoston ja käsittelee sen datan
async function readExcelFile(file) {
    const reader = new FileReader();
    
    reader.onload = async function (event) {
        // Muutetaan tiedosto binaarimuotoon
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        // Haetaan ensimmäinen taulukko tiedostosta
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Muunnetaan Excel-taulukko JSON-muotoon, säilyttäen rivit ja sarakkeet
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        console.log("Luettu Excel-tiedosto:", jsonData);

        // Jos tiedosto on tyhjä, lopetetaan käsittely
        if (jsonData.length === 0) {
            console.error("Excel-tiedosto on tyhjä.");
            return;
        }

        // Käydään jokainen rivi läpi
        for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i];

            // Varmistetaan, että rivillä on vähintään 4 saraketta (nimi, osoite, postinumero, kaupunki)
            if (row.length < 4) {
                console.warn(`Puuttuvia tietoja rivillä ${i + 1}, ohitetaan...`, row);
                continue;
            }

            // Poistetaan ylimääräiset välilyönnit ja varmistetaan, että tiedot ovat olemassa
            const name = row[0].trim();
            const address = row[1].trim();
            const postalCode = row[2].toString().trim(); // Muutetaan tekstiksi, jos se on numero
            const city = row[3].trim();

            if (!name || !address || !postalCode || !city) {
                console.warn(`Puuttuvia tietoja rivillä ${i + 1}, ohitetaan...`, row);
                continue;
            }

            // Muodostetaan täydellinen osoite hakua varten
            const fullPlace = `${address}, ${postalCode} ${city},`;
            
            try {
                // Haetaan paikan koordinaatit
                const coords = await getCoordinates(fullPlace);
                if (coords) {
                    console.log(`Paikka: ${name}, Osoite: ${fullPlace} Koordinaatit: Lat=${coords.lat}, Lon=${coords.lon}`);
                } else {
                    console.warn(`Koordinaatteja ei löytynyt paikalle: ${fullPlace}`);
                }
            } catch (error) {
                console.error(`Virhe koordinaattien haussa riville ${i + 1}:`, error);
            }
        }
    };

    // Luetaan tiedosto ArrayBuffer-muodossa
    reader.readAsArrayBuffer(file);
}
