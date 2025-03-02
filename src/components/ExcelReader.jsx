/*
* ExcelReader komponentti: Luetaan runkoreittiin liittyvät tiedot syötetystä excel tiedostosta 
* ja tallennetaan luettu reitti järjestelmään.
* -> Ei vielä kokonaan valmis!
*
* TODO: aloituspaikan, lopetuspaikan, reitin nimen?, aloitusajan, viimeisen lopetusajan lukeminen. 
*
* Lukee tiedot noutopaikan nimestä, osoitteesta (osoite, postinumero ja kaupunki) 
* sekä onko noudossa vakionouto päivittäin
* Rivit tulevat olla tässä järjestyksessä xlsx tiedostossa: nimi, osoite, postinumero, kaupunki, vakionouto
*/

import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { useDropzone } from 'react-dropzone';
import "../index.css";

const StandardPickup = Object.freeze({
    YES: "yes",
    NO: "no"
});


// Funktio koordinaattien hakemiseen OpenStreetMapista
async function getCoordinates(fullPlace) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullPlace)}`;

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
            console.warn(`Koordinaatteja ei löytynyt: ${data}`);
            return null;
        }
    } catch (error) {
        console.error(`Virhe haettaessa koordinaatteja: ${data}`, error);
        return null;
    }
}


// Lataa Excel-pohjan käyttäjälle
const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
        ["Nimi", "Osoite", "Postinumero", "Kaupunki", "Vakionouto"],
    ]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reitti");

    // Ladataan luotu Excel-tiedosto
    XLSX.writeFile(wb, "Kuljetusten paikat.xlsx");
};

// ExcelReader-komponentti
export const ExcelReader = ({ routeHandler }) => {
    const [message, setMessage] = useState(null);

    // Tiedoston prosessointi
    const processFile = async (file) => {
        setMessage({ type: "info", message: "Luetaan tiedostoa..." });

        // Tarkistetaan, onko .xlsx tiedostotyyppi.
        if (!file.name.endsWith(".xlsx")) {
            setMessage({ type: "error", message: "Väärä tiedostotyyppi. Hyväksytyt tiedostotyypit: .xlsx" });
            return;
        }
        // Luetaan tiedosto.
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const binaryString = e.target.result;
                const workbook = XLSX.read(binaryString, { type: "binary" });

                // Ensimmäinen taulukkosivu tiedostosta.
                const sheetName = workbook.SheetNames[0];

                 // Muutetaan tiedosto JSON muotoon.
                const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

                // Jos tiedosto on tyhjä, lopetetaan käsittely
                if (jsonData.length === 0) {
                    setMessage({ type: "error", message: "Excel tiedosto on tyhjä!" });
                    return;
                }

                // Luodaan array luetulle datalle
                const excelData = [];

                // Käydään jokainen rivi läpi
                // Järjestys: nimi, osoite, postinumero, kaupunki, vakionouto
                for (let i = 0; i < jsonData.length; i++) {
                    const row = Object.values(jsonData[i]);

                    // Varmistetaan, että rivillä on vähintään 4 saraketta
                    if (row.length < 4) {
                        console.warn(`Puuttuvia tietoja rivillä ${i + 1}, ohitetaan...`, row);
                        continue;
                    }

                    // Poistetaan ylimääräiset välilyönnit ja varmistetaan, että tiedot ovat olemassa.
                    // Varmistetaan, että kaikki tieto on string muodossa.
                    const postalCode = row[0].toString().trim();
                    const name = row[1].toString().trim();
                    const address = row[2].toString().trim();
                    const city = row[3].toString().trim();
                    const standardPickupColumn = row[4] ? row[4].toString().trim() : "";

                    if (!name || !address || !postalCode || !city) {
                        console.warn(`Puuttuvia tietoja rivillä ${i + 1}, ohitetaan...`, row);
                        continue;
                    }

                    // Tunnistetaan, onko kyseessä vakionouto.
                    const standardPickup = standardPickupColumn.toLowerCase() === "x" 
                        ? StandardPickup.YES : StandardPickup.NO;
                    
                     // Muodostetaan täydellinen osoite hakua varten
                     const fullPlace = `${address}, ${postalCode} ${city},`;

                     const coordinates = await getCoordinates(fullPlace);

                    // Tallennetaan heattu data name, address, postalCode, city ja standardPickup muotoiseksi
                    // JSON objektiksi ja lisätään se Reactin readData arrayhin.
                    const newPlaceObject = {
                        name,
                        address,
                        postalCode,
                        city,
                        standardPickup, // Käyttää StandardPickup muotoa (joko yes tai no)
                        lat: coordinates ? coordinates.lat : null,
                        lon: coordinates ? coordinates.lon : null,
                    };

                    // Tallennetaan luettu data listaan.
                    excelData.push(newPlaceObject);
                    console.log(newPlaceObject);
                }

                // Jos data on luettu onnistuneesti, lähetetään se routeHandler-funktiolle
                if (excelData.length !== 0) {
                    setMessage({ type: "success", message: "Tiedosto luettu onnistuneesti!" });
                    routeHandler(excelData);
                } else {
                    setMessage({ type: "error", message: "Tiedoston luku epäonnistui!" });
                }
            } catch (error) {
                setMessage({ type: "error", message: `Tiedoston luku epäonnistui: ${error}` });
            }
        };

        reader.readAsBinaryString(file);
        reader.onerror = () => {
            setMessage({ type: "error", message: "Virhe tiedoston lukemisessa!" });
        };
    };

    // Callback tiedoston pudotukseen
    const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
        // Jos on hylättyjä tiedostoja, näytetään virheilmoitus
        if (rejectedFiles.length > 0) {
            setMessage({ type: "error", message: "Väärä tiedostotyyppi. Hyväksytyt tiedostotyypit: .xlsx" });
        } else if (acceptedFiles.length > 0) {
            // Jos tiedosto on hyväksytty, prosessoidaan se
            processFile(acceptedFiles[0]);
        }
    }, []);

    const { getRootProps, getInputProps } = useDropzone({
        onDrop: onDrop,
        accept: {
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
        },
    });

    return (
        <div>
            {/* Excel tiedoston lataaminen kansionäkymästä */}
            <input type="file" onChange={(e) => processFile(e.target.files[0])} />

            {/* Dropzone toteutus */}
            <div {...getRootProps()} className="dropzone">
                <input {...getInputProps()} />
                <p>Raahaa ja pudota Excel-tiedosto tähän tai klikkaa valitaksesi tiedoston</p>
            </div>

            {message && <p className={message.type}>{message.message}</p>}

            {/* Excel pohjan lataus */}
            <button onClick={downloadTemplate}>Uusi pohja tiedostolle</button>
        </div>
    );
};
