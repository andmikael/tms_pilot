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
import PropTypes from 'prop-types';
import { routePropType } from '../propTypes/routePropType';

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
        ["Reitin nimi:"],
        ["Yksikkö", "Osoite", "Postinumero", "Kaupunki", "Vakionouto"],
        [],
        [],
        ["Aloituspaikka", "Katuosoite",	"Postinumero", "Toimipaikka", "Lähtöaika"],
        [],
        ["Määräpaikka", "Katuosoite",	"Postinumero", "Toimipaikka", "Paluuaika"],
    ]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reitti");

    // Ladataan luotu Excel-tiedosto
    XLSX.writeFile(wb, "Kuljetusten paikat.xlsx");
};

// ExcelReader-komponentti
export const ExcelReader = ({ dataToParent }) => {
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

                const sheet = workbook.Sheets[sheetName];
                const routeName = sheet["B1"] ? sheet["B1"].v : "Uusi reitti";

                 // Muutetaan tiedosto JSON muotoon.
                const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                // Jos tiedosto on tyhjä, lopetetaan käsittely
                if (jsonData.length === 0) {
                    setMessage({ type: "error", message: "Excel tiedosto on tyhjä!" });
                    return;
                }

                // Luodaan array luetulle datalle
                const excelData = [];
                let startLocationData = null;
                let endLocationData = null;
                

                // Käydään jokainen rivi läpi
                // Järjestys: nimi, osoite, postinumero, kaupunki, vakionouto
                for (let i = 2; i < jsonData.length; i++) {
                    // Tarkistetaan, onko kyseessä aloituspaikka
                    if (
                        jsonData[i][0] &&
                        jsonData[i][0].toString().toLowerCase().includes("aloituspaikka")
                    ) {
                        if (i + 1 < jsonData.length) {
                            const row = jsonData[i + 1];
                            if (row.length < 5) {
                                console.warn(`Puuttuvia tietoja aloituspaikan rivillä ${i + 2}, ohitetaan...`, row);
                            } else {
                                const startPlace = row[0].toString().trim();
                                const street = row[1].toString().trim();
                                const postalCode = row[2].toString().trim();
                                const locality = row[3].toString().trim();
                                const departureTime = row[4].toString().trim();
                                const fullPlace = `${street}, ${postalCode} ${locality}`;
                                const coordinates = await getCoordinates(fullPlace);
                                startLocationData = {
                                    name: startPlace,
                                    address: street,
                                    postalCode,
                                    city: locality,
                                    departureTime,
                                    lat: coordinates ? coordinates.lat : null,
                                    lon: coordinates ? coordinates.lon : null,
                                };
                            }
                        }
                        i += 2;
                        if (
                            i < jsonData.length &&
                            jsonData[i][0] &&
                            jsonData[i][0].toString().toLowerCase().includes("määräpaikka")
                        ) {
                            if (i + 1 < jsonData.length) {
                                const row = jsonData[i + 1];
                                if (row.length < 5) {
                                    console.warn(`Puuttuvia tietoja lopetuspaikan rivillä ${i + 2}, ohitetaan...`, row);
                                } else {
                                    const endPlace = row[0].toString().trim();
                                    const street = row[1].toString().trim();
                                    const postalCode = row[2].toString().trim();
                                    const locality = row[3].toString().trim();
                                    const endTime = row[4].toString().trim();
                                    const fullPlace = `${street}, ${postalCode} ${locality}`;
                                    const coordinates = await getCoordinates(fullPlace);
                                    endLocationData = {
                                        name: endPlace,
                                        address: street,
                                        postalCode,
                                        city: locality,
                                        endTime,
                                        lat: coordinates ? coordinates.lat : null,
                                        lon: coordinates ? coordinates.lon : null,
                                    };
                                }
                            }
                        }
                        break;
                    } else {
                        // Käsitellään reittipiste normaalisti
                        const row = jsonData[i].slice(0, 5);
                        if (row.length < 4) {
                            console.warn(`Puuttuvia tietoja rivillä ${i + 1}, ohitetaan...`, row);
                            continue;
                        }
                        const name = row[0].toString().trim();
                        const address = row[1].toString().trim();
                        const postalCode = row[2].toString().trim();
                        const city = row[3].toString().trim();
                        const standardPickupColumn = row[4] ? row[4].toString().trim() : "";
                        if (!name || !address || !postalCode || !city) {
                            console.warn(`Puuttuvia tietoja rivillä ${i + 1}, ohitetaan...`, row);
                            continue;
                        }
                        const standardPickup = standardPickupColumn.toLowerCase() === "x" 
                            ? StandardPickup.YES : StandardPickup.NO;
                        const fullPlace = `${address}, ${postalCode} ${city}`;
                        const coordinates = await getCoordinates(fullPlace);
                        const newPlaceObject = {
                            name,
                            address,
                            postalCode,
                            city,
                            standardPickup,
                            lat: coordinates ? coordinates.lat : null,
                            lon: coordinates ? coordinates.lon : null,
                        };
                        excelData.push(newPlaceObject);
                        console.log(newPlaceObject);
                    }
                }


                // Jos data on luettu onnistuneesti, lähetetään se dataToParent-funktiolle
                if (excelData.length !== 0) {
                    setMessage({ type: "success", message: "Tiedosto luettu onnistuneesti!" });
                    dataToParent({ points: excelData, startLocation: startLocationData, endLocation: endLocationData });

                    const response = await fetch("http://localhost:8000/upload", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ routeName, data: excelData, startLocation: startLocationData, endLocation: endLocationData }),
                    });

                    const result = await response.json();
                    setMessage({ type: result.error ? "error" : "success", message: result.message });
                    

                    // Päivitetään tiedot käyttöliittymässä
                    dataToParent({ points: excelData, startLocation: startLocationData, endLocation: endLocationData });

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
        {/* Dropzone toteutus */}
        <div {...getRootProps()} id="dropzone">
          <input {...getInputProps()} />
                <p>Raahaa ja pudota Excel-tiedosto tähän tai klikkaa valitaksesi tiedoston</p>
        </div>

        {message && <p className={message.type}>{message.message}</p>}

        {/* Excel pohjan lataus */}
        <div id="new-excel">
        <p>Kadotitko Excel pohjan?</p>
          <button onClick={downloadTemplate}>Lataa uusi Excel pohja</button>
        </div>
      </div>
    );
};
