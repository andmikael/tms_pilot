/*
* This components is for uploading excel files and reading the data from them.
* TODO: Not completely implemented!
*
* Lukee tiedot noutopaikan nimestä, osoitteesta (osoite, postinumero ja kaupunki) 
* sekä onko noudossa vakionouto päivittäin
*
* Rivit tulevat olla tässä järjestyksessä xlsx tiedostossa: nimi, osoite, postinumero, kaupunki, vakionouto
*/

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { PlaceDetails } from './PlaceDetails';

export const ExcelReader = () => {
    const [readData, setReadData] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");

    const handleUploadingFile = (event) => {
        event.preventDefault();
        const file = event.target.files[0];
        
        if (!file) {
            setErrorMessage("");
            return;
        }
        console.log(file);

        // Tarkistetaan, onko .xlsx tiedostotyyppi.
        if (!file.name.endsWith(".xlsx")) {
            setErrorMessage("Väärä tiedostotyyppi. Hyväksytyt tiedostotyypit: .xlsx");
        }

        // Luetaan tiedosto. Yhdistetty ja muokattu ensimmäisen excel version
        // Excel_reading.js toiminnallisuutta tässä.
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const binaryString = e.target.result;
            const workbook = XLSX.read(binaryString, { type: "binary" });
    
            // Ensimmäinen taulukkosivu tiedostosta.
            const sheetName = workbook.SheetNames[0];
    
            // Muutetaan tiedosto JSON muotoon.
            const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    
            console.log("JSON data:", jsonData);
            setReadData(jsonData); // Väliaikainen. Vaihdetaan, kun placeDetails komponentti toimii.

            // Jos tiedosto on tyhjä, lopetetaan käsittely
            if (jsonData.length === 0) {
                setErrorMessage("Excel-tiedosto on tyhjä.");
                return;
            }

            // Käydään jokainen rivi läpi
            // Järjestys: nimi, osoite, postinumero, kaupunki, vakionouto
            for (let i = 0; i < jsonData.length; i++) {
                const row = Object.values(jsonData[i]);

                // Varmistetaan, että rivillä on vähintään 5 saraketta
                if (row.length < 5) {
                    console.warn(`Puuttuvia tietoja rivillä ${i + 1}, ohitetaan...`, row);
                    continue;
                }
    
                // Poistetaan ylimääräiset välilyönnit ja varmistetaan, että tiedot ovat olemassa
                const name = row[0].trim();
                const address = row[1].trim();
                const postalCode = row[2].toString().trim(); // Muutetaan tekstiksi, jos se on numero
                const city = row[3].trim();
                const standardPickup = row[4].trim();
                
                if (!name || !address || !postalCode || !city) {
                    console.warn(`Puuttuvia tietoja rivillä ${i + 1}, ohitetaan...`, row);
                    continue;
                }
    
                // Muodostetaan täydellinen osoite hakua varten
                const fullPlace = `${address}, ${postalCode} ${city},`;
                
                /* TODO: Paikan koordinaattien haku puuttuu */
                

                // Tallennetaan heattu data name, address, postalCode, city ja standardPickup muotoiseksi
                // JSON objektiksi ja lisätään se Reactin readData arrayhin.
                const newPlaceObject = {
                    name: name,
                    address: address,
                    postalCode: postalCode,
                    city: city,
                    standardPickup: standardPickup,
                };
                // TODO: ei toimi vielä.
                // setReadData([...readData, newPlaceObject]);
                //console.log(readData); 
                
            }; 

          } catch (error) {
            console.log(error);
            setErrorMessage("Virhe tapahtui tiedostoa lukiessa: ", error);
          }
        };
    
        reader.readAsArrayBuffer(file);
    };
    
    return <div>
        {/*One version for uploading files*/}
        <input type="file" onChange={handleUploadingFile}/>
        {errorMessage && <p>{errorMessage}</p>}

        {/*Temporary for displaying data*/}
        <div>{readData != null && JSON.stringify(readData)}</div>

        {/*Displaying correctly read data. This component isn't complete yet!*/}
        {/*
        {readData.map((place) => {
            <li key={place.index}>
                <PlaceDetails 
                name={place.name} 
                address={place.address} 
                postalCode={place.name}
                city={place.city}
                standardPickup={place.standardPickup}>
                </PlaceDetails>
            </li>
            })
        }
        */}

        {/*Dropzone implementation here*/}
    </div>
};