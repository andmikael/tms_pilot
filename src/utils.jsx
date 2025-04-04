const FLASK_URL = 'http://localhost:8000/';

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
/*
* getOptimizedRoutes function sends a request for Flask route optimization endpoint (api/route_test).
* Function modifies routes to the form that Flask endpoint accepts them. Flask responds with ordered routes, distances and durations.
* Explanations for some of the parameters:
* mandatoryAddresses = Array of standard pickup addresses (runkoreitti)
* pickUpAdresses = Array of all the additional addresses what need to be visited (pickup places)
*/
async function getOptimizedRoutes(startPlace, endPlace, mandatoryAddresses, pickUpAdresses, amountOfVehicles, trafficMode) {
  const placesMap = new Map(); // Saving all the addresses which are sent to Flask as a key connected with rest of their information.
  // Most of the map operations are O(1).
  let addresses = [];

  if (startPlace === null || endPlace === null ) {
    console.error(`Start or end place has not been defined. startplace: ${startPlace}, endPlace: ${endPlace}`);
    return null;
  }

  // Adding startPlace and endPlace to the addresses array and defining start and end indexes.
  // StartPlace is always on the index 0 and endPlace on the index 1.
  const startAddress = transformAddress(startPlace.address, startPlace.city);
  const endAddress = transformAddress(endPlace.address, endPlace.city);

  if (startAddress === null || endAddress === null ) {
    return null;
  }

  // TODO: Ask about this, doesn't work now with two vehicles etc.
  // Setting up start and end addresses and indexes for Flask.
  addresses.push(startAddress, endAddress);
  //const start_indexes = Array(amountOfVehicles).fill(0);
  const start_indexes = Array.from({ length: amountOfVehicles }, (_, index) => 
    index === 0 ? 0 : ""
  );
  //const end_indexes = Array(amountOfVehicles).fill(1);
  const end_indexes = Array.from({ length: amountOfVehicles }, (_, index) => 
    index === 0 ? 1 : ""
  );

  // Saving these to the map.
  placesMap.set(startAddress, startPlace);
  placesMap.set(endAddress, endPlace);

  // Adding standardPickUp addresses to the addresses array and defining indexes for must_visit places.
  const mustVisitIndexes = [];
  if (Array.isArray(mandatoryAddresses) && mandatoryAddresses.length > 0) {
    let mustVisitIndex = 2;
    for (const place of mandatoryAddresses) {
      let address = transformAddress(place.address, place.city);
      if (address !== null) {
        addresses.push(address);
        mustVisitIndexes.push(mustVisitIndex);
        mustVisitIndex += 1;

        // Saving this to the map.
        placesMap.set(address, place);
      }
    }
  }
  const must_visit = Array.from({ length: amountOfVehicles }, (_, index) => 
    index === 0 ? mustVisitIndexes : []
  );
  
  // Adding selected pickup places to the addresses array.
  console.log('pickup: ', pickUpAdresses);
  if (Array.isArray(pickUpAdresses) && pickUpAdresses.length > 0) {
    for (const place of pickUpAdresses) {
      let address = transformAddress(place.address, place.city);
      if (address !== null) {
        addresses.push(address);

        // Saving this to the map.
        placesMap.set(address, place);
      }
    }
  }

  const requestBody = {
    "addresses": addresses,
    "start_indexes": start_indexes,
    "end_indexes": end_indexes,
    "number_of_vehicles": amountOfVehicles,
    "must_visit": must_visit,
    "traffic_mode": trafficMode,
  };
  console.log('requestBody: ', requestBody);

  // TODO:
  // Esimerkkimuoto. Kysy tästä?
  const body1 = {
    "addresses": [
      "Teekkarinkatu+10+Tampere",
      "Nekalantie+1+Tampere",
      "Kalevantie+1+Tampere",
      "Tampereen+valtatie+8+Tampere",
      "Pirkankatu+8+Tampere"
    ],
    "start_indexes": [0, 0],
    "end_indexes": [3, 4],
    "number_of_vehicles": 2,
    "must_visit": [[], []],
    "traffic_mode": "best_guess"
  };


  try {
    const response = await fetch(`${FLASK_URL}api/route_test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error(`Virhe reittioptimoinnissa: ${response.status}`);
      return null;
    }

    const responseData = await response.json()
  
    console.log('Response from flask: ', responseData);

    // Going through all the suggested routes and saving them to an array.
    let routeSuggestions = [];
    for (let i = 0; i < responseData.ordered_routes.length; i++) {
      let ordered_routes = [];
      for (const address of responseData.ordered_routes[i]) {
        const place = placesMap.get(address);
        if (place !== undefined) { // If returned address was matched with rest of the data.
          ordered_routes.push(place);
        }
      }

      const routeSuggestion = {
        "distances": responseData.distances[i],
        "durations": responseData.durations[i],
        "ordered_routes": ordered_routes,
      }

      routeSuggestions.push(routeSuggestion);
    }
    
    return routeSuggestions;

  } catch (error) {
      console.error("Virhe reittioptimoinnissa:", error);
      return null;
  }
}


/*
* Transforms addresses form from "address 1" and "Kauhajoki" to "address+1+Kauhajoki".
*
* Returns: fulladdress in a form address+city and null if there are no address or city.
*/
function transformAddress(address, city) {
  if (address === null || city === null) {
    console.error(`Virhe osoitteessa, osoite: ${address} ja kaupunki: ${city}`, error);
    return null;
  }
  const newAddress = address.split(" ").join("+");
  const fullAddress = newAddress + "+" + city;
  return fullAddress;
}

export { exampleRoute, geocodePoints, getOptimizedRoutes };

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
