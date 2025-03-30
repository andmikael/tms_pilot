const exampleRoute = {
  name: 'Seinäjoki',
  startPlace: {
    name: 'Seinäjoen Keskussairaala',
    address: 'Hanneksenrinne 7',
    postalCode: '60220',
    city: 'Seinäjoki',
    standardPickup: 'yes',
    lat: 62.773094,
    lon: 22.827277,
  },
  endPlace: {
    name: 'Seinäjoen Keskussairaala',
    address: 'Hanneksenrinne 7',
    postalCode: '60220',
    city: 'Seinäjoki',
    standardPickup: 'yes',
    lat: 62.773094,
    lon: 22.827277,
  },
  startTime: '09:00',
  endTime: '15:00',
  routes: [
    {
      name: 'Nurmon terveysasema',
      address: 'Valkiavuorentie 4',
      postalCode: '60550',
      city: 'Nurmo',
      standardPickup: 'yes',
      lat: 62.82705,
      lon: 22.909575,
    },
    {
      name: 'Terveystalo Seinäjoki Vapaudentie',
      address: 'Vapaudentie 24',
      postalCode: '60100',
      city: 'Seinäjoki',
      standardPickup: 'no',
      lat: 62.788228,
      lon: 22.834165,
    },
  ],
};

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

function geocodePoints(optionalPickups) {
  if (optionalPickups == null) {
    return null;
  }

  optionalPickups.forEach(async point => {
    const fullPlace = `${point.address}, ${point.postalCode} ${point.city},`;
    const coords = await getCoordinates(fullPlace);
    if (coords != null) {
      point.lat = coords.lat;
      point.lon = coords.lon;
    }
  })

  return optionalPickups;
}

export { exampleRoute, geocodePoints };

export async function fetchExcelData(setExcelData, setSelectedFile, setError, selectedFile) {
  try {
    const response = await fetch("http://localhost:8000/api/get_excel_files");
    if (!response.ok) throw new Error("Excel-tiedostojen haku epäonnistui");
    const data = await response.json();
    setExcelData(data);
    
    const files = Object.keys(data);
    if (files.length > 0 && !selectedFile) {
      setSelectedFile(files[0]);
    }
  } catch (err) {
    setError(err.message);
  }
}

export async function fetchRoutes(setRouteData, setError) {
  try {
    const response = await fetch("http://localhost:8000/api/get_route");
    if (!response.ok) throw new Error("Reittidatan haku epäonnistui");
    const data = await response.json();
    
    const validRoutes = Object.entries(data)
      .filter(([_, value]) => !value.error)
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});
    
    setRouteData(validRoutes);
  } catch (err) {
    setError(err.message);
  }
}

export const deleteExcelFile = async (selectedFile, setExcelData, setSelectedFile, setDeleteMessage) => {
  if (!selectedFile) return;
  try {
    const response = await fetch("http://localhost:8000/api/delete_excel", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_name: selectedFile }),
    });
    const result = await response.json();
    if (response.ok) {
      setDeleteMessage(result.message);
      // Päivitetään tila poistamalla poistettu tiedosto excelData-objektista
      setExcelData(prev => {
        const newData = { ...prev };
        delete newData[selectedFile];
        return newData;
      });
      setSelectedFile(null);
    } else {
      setDeleteMessage("Virhe: " + (result.error || result.message));
    }
  } catch (err) {
    setDeleteMessage("Poistopyynnön virhe: " + err.message);
  }
};