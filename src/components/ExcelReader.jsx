/*
* ExcelReader component: reads route information from supplied Excel file and saves the route into the system
*
* Reads depot name, address (street address, postal code, city) and whether it is a default daily pickup (vakionouto)

* Routes must be in this order in XLSX file: name, address, postal code, city, default pickup
*
*/

import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { useDropzone } from 'react-dropzone';

import { StandardPickup, getCoordinates, formatTime } from '../utils';
import { Download } from 'lucide-react';

// Function to download a template for the Excel file
const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
        ["Reitin nimi:"],
        ["Yksikkö", "Osoite", "Postinumero", "Kaupunki", "Vakionouto"],
        [],
        [],
        ["Aloituspaikka", "Katuosoite", "Postinumero", "Toimipaikka", "Lähtöaika"],
        [],
        ["Määräpaikka", "Katuosoite", "Postinumero", "Toimipaikka", "Paluuaika"],
    ]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reitti");

    XLSX.writeFile(wb, "Kuljetusten paikat.xlsx");
};


export const ExcelReader = ({ dataToParent, setReloadSignal }) => {
    const [message, setMessage] = useState(null);

    // Function to process each sheet in the Excel file
    const processSheet = async (sheet, sheetName, fileName) => {
    // Extract raw route name and sanitize: remove all except unicode letters, numbers, spaces, hyphens
    const rawRouteName = sheet['B1'] ? sheet['B1'].v.toString() : 'Uusi reitti';
    const sanitized = rawRouteName.replace(/[^\p{L}\p{N}\s-]/gu, '');
    const routeName = sanitized.trim() || 'Uusi reitti';

        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if (jsonData.length === 0) {
            return { sheetName, success: false, msg: "Taulukko on tyhjä." };
        }
        
        const excelData = [];
        let startLocationData = null;
        let endLocationData = null;
        
        // Process each row of the sheet
        for (let i = 2; i < jsonData.length; i++) {
            // Look for the start location
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
                        const rawDepartureTime = row[4];
                        const departureTime = formatTime(rawDepartureTime, i + 2, "lähtöaika");
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
                // Look for the end location
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
                            const rawEndTime = row[4];
                            const endTime = formatTime(rawEndTime, i + 2, "paluuaika");
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
                // Process general location rows
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
            }
        }
        // Check for missing coordinates and return an error if any are missing
        let missingCoordinates = [];
        if (startLocationData && (!startLocationData.lat || !startLocationData.lon)) {
            missingCoordinates.push(`Aloituspaikka: ${startLocationData.name}`);
        }
        if (endLocationData && (!endLocationData.lat || !endLocationData.lon)) {
            missingCoordinates.push(`Lopetuspaikka: ${endLocationData.name}`);
        }
        for (const point of excelData) {
            if (!point.lat || !point.lon) {
                missingCoordinates.push(point.name);
            }
        }

        // If there are valid route points, send them to the parent component
        if (missingCoordinates.length > 0) {
            return { 
                sheetName, 
                success: false, 
                msg: "Koordinaatteja ei löytynyt seuraavilta paikoilta: " + missingCoordinates.join(', ') + ". Reittiä ei tallennettu." 
            };
        }

         // Validate that departure and return times exist and are in correct order
        if (!startLocationData?.departureTime) {
            return { sheetName, success: false, msg: 'Lähtöaika puuttuu.' };
        }
        if (!endLocationData?.endTime) {
            return { sheetName, success: false, msg: 'Paluuaika puuttuu.' };
        }
        if (startLocationData.departureTime >= endLocationData.endTime) {
            return { sheetName, success: false, msg: 'Lähtöaika pitää olla ennen paluuaikaa.' };
        }

        if (excelData.length !== 0) {
            dataToParent({ points: excelData, startLocation: startLocationData, endLocation: endLocationData });
            
            // Send the data with the file name to the backend
            const response = await fetch("http://localhost:8000/api/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    routeName, 
                    fileName,
                    data: excelData, 
                    startLocation: startLocationData, 
                    endLocation: endLocationData 
                }),
            });

            const result = await response.json();
            
            if (setReloadSignal) {
                setReloadSignal(prev => prev + 1);
            }
            return { 
                sheetName, 
                success: !result.error, 
                msg: `Reitti "${routeName}" taulukosta "${sheetName}" lähetetty onnistuneesti: ${result.message}` 
            };
        } else {
            return { sheetName, success: false, msg: "Reittipisteitä ei löytynyt." };
        }
    };

    // Function to handle the file upload and processing
    const processFile = async (file) => {
        setMessage({ type: "info", message: "Luetaan tiedostoa..." });
        if (!file.name.endsWith(".xlsx")) {
            setMessage({ type: "error", message: "Väärä tiedostotyyppi. Hyväksytyt tiedostotyypit: .xlsx" });
            return;
        }
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const binaryString = e.target.result;
                const workbook = XLSX.read(binaryString, { type: "binary" });
                
                let successMessages = [];
                let errorMessages = [];
                
                // Iterate through all sheets in the workbook
                for (const sheetName of workbook.SheetNames) {
                    const sheet = workbook.Sheets[sheetName];
                    const result = await processSheet(sheet, sheetName, file.name);
                    if (result.success) {
                        successMessages.push(result.msg);
                    } else {
                        errorMessages.push(`Taulukko "${sheetName}": ${result.msg}`);
                    }
                }
                
                let finalMsg = "";
                if (successMessages.length > 0) {
                    finalMsg += "Seuraavat reitit lähetettiin onnistuneesti:\n" + successMessages.join('\n');
                }
                if (errorMessages.length > 0) {
                    finalMsg += "\n\nSeuraavissa taulukoissa esiintyi virheitä:\n" + errorMessages.join('\n');
                    setMessage({ type: "error", message: finalMsg });
                } else {
                    setMessage({ type: "success", message: finalMsg });
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

    // Dropzone callback to handle dropped files
    const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
        if (rejectedFiles.length > 0) {
            setMessage({ type: "error", message: "Väärä tiedostotyyppi. Hyväksytyt tiedostotyypit: .xlsx" });
        } else if (acceptedFiles.length > 0) {
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
        <div {...getRootProps()} id="dropzone">
        <input {...getInputProps()} />
        <p>Raahaa ja pudota Excel-tiedosto tähän tai klikkaa valitaksesi tiedoston</p>
        </div>
        {message && <pre className={`${message.type} dropdown-content-padding`}>{message.message}</pre>}
        <div id="new-excel" className="dropdown-content-padding">
            <p className="excel-text">Kadotitko Excel-pohjan?</p>
            <button onClick={downloadTemplate} className="excel-button">
                <Download size={18} />
                Lataa uusi Excel-pohja
            </button>
        </div>
    </div>
    );
};
