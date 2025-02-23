/*
* ExcelReader komponentti: Luetaan runkoreittiin liittyvät tiedot syötetystä excel tiedostosta 
* ja tallennetaan luettu reitti järjestelmään.
* -> Ei vielä kokonaan valmis!
*
* TODO: aloituspaikan, lopetuspaikan, reitin nimen?, aloitusajan, viimeisen lopetusajan lukeminen. 
* Lisäksi korjattava miten vakionouto luetaan excelistä.
*
* Lukee tiedot noutopaikan nimestä, osoitteesta (osoite, postinumero ja kaupunki) 
* sekä onko noudossa vakionouto päivittäin (tämä vielä korjattava)
* Rivit tulevat olla tässä järjestyksessä xlsx tiedostossa: nimi, osoite, postinumero, kaupunki, vakionouto
*/

import { useState } from 'react';
import * as XLSX from 'xlsx';

export const ExcelReader = ({routeHandler}) => {
    const [message, setMessage] = useState(null);

    const handleUploadingFile = (event) => {
        event.preventDefault();
        setMessage(null);
        const file = event.target.files[0];
        
        if (!file) {
            return;
        }
        console.log(file);

        // Tarkistetaan, onko .xlsx tiedostotyyppi.
        if (!file.name.endsWith(".xlsx")) {
            setMessage({type: "error", message: "Väärä tiedostotyyppi. Hyväksytyt tiedostotyypit: .xlsx"});
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

            // Jos tiedosto on tyhjä, lopetetaan käsittely
            if (jsonData.length === 0) {
                setMessage({type: "error", message: "Excel tiedosto on tyhjä!"});
                return;
            }

            // Luodaan luettua dataa varten array:
            const excelData = [];

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
                    standardPickup: standardPickup, //Muuta enum esimerkiksi. Tällä hetkellä ei tallenna tietoa oikein.
                };

                // Tallennetaan luettu data listaan.
                excelData.push(newPlaceObject);
            };

            // Lopuksi tallennetaan oikein luetut rivit järjestelmän reitteihin.
            if (excelData.length != 0) {
                setMessage({type: "success", message: "Tiedosto luettu onnistuneesti!"});
                routeHandler(excelData);
            }
            else {
                setMessage({type: "error", message: "Tiedoston luku epäonnistui!"});
            }

          } catch (error) {
            console.log(error);
            setMessage({type: "error", message: `Tiedoston luku epäonnistui: ${error}`});
          }
        };

        // Tarvitaanko reader.onerror käsittelijä?

        reader.readAsArrayBuffer(file);

        
    };
    
    return <div>
        {/*Excel tiedoston lataaminen kansionäkymästä*/}
        <input type="file" onChange={handleUploadingFile}/>
        {message && <p className={message.type}>{message.message}</p>}

        {/*Dropzone implementation here*/}

    </div>
};