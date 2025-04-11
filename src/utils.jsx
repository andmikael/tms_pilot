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

export const StandardPickup = Object.freeze({
  YES: "yes",
  NO: "no"
});

/**
 * Fetches the coordinates (latitude and longitude) for a given address
 * using the OpenStreetMap Nominatim API.
 * 
 * @param {String} fullPlace The full address (e.g., street address, postal code, and city).
 * @returns {Object|null} An object { lat, lon } with coordinates, or null if not found.
 */
export async function getCoordinates(fullPlace) {
  // Construct the URL with the encoded address.
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullPlace)}`;
  try {
      // Fetch from the OSM Nominatim API.
      const response = await fetch(url);
      const data = await response.json();
      // if any data is returned return the coordinates
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
      console.error(`Virhe haettaessa koordinaatteja: ${error}`);
      return null;
  }
}

/**
 * Adds coordinates for new pickup place.
 * 
 * @param {Object} optionalPickup Place for which coordinates are needed.
 * @returns Object with added coordinates.
 */
async function geocodePoints(optionalPickup) {
  if (optionalPickup == null) {
    return null;
  }

  const fullPlace = `${optionalPickup.address}, ${optionalPickup.postalCode} ${optionalPickup.city},`;
  const coords = await getCoordinates(fullPlace);
  if (coords != null) {
    optionalPickup.lat = coords.lat;
    optionalPickup.lon = coords.lon;
  }

  return optionalPickup;
}

/**
 * Sends a request for Flask route optimization endpoint (api/route_test) to get optimizated routes.
 * Function modifies routes data to the form that Flask endpoint accepts it. Flask responds with ordered routes, distances and durations.
 * 
 * @param {Object} startPlace Details of route's starting place, in the form of placePropType.
 * @param {Object} endPlace Details of route's ending place, in the form of placePropType.
 * @param {Array} mandatoryAddresses Array of standard pickup addresses (runkoreitti)
 * @param {Array} pickUpAdresses Array of all the additional addresses what need to be visited (pickup places)
 * @param {Number} amountOfVehicles Amount of vehicles for which route suggestions are needed.
 * @param {String} trafficMode Either "best_guess", "optimistic" or "pessimistic".
 * @returns Array of routesuggestions, in which each item consists of "distances", "durations" and "ordered_routes".
 */
async function getOptimizedRoutes(startPlace, endPlace, mandatoryAddresses, pickUpAdresses, amountOfVehicles, trafficMode) {
  // Saving all the addresses which are sent to Flask as a key connected with rest of their information.
  // Key is string representation of coordinates, e.g. "23.123456,62.123456".
  // Value is the object with all the information about the place.
  const placesMap = new Map();
  // Most of the map operations are O(1).
  let addresses = [];

  if (startPlace === null || endPlace === null ) {
    console.error(`Start or end place has not been defined. startplace: ${startPlace}, endPlace: ${endPlace}`);
    return null;
  }

  // Adding startPlace and endPlace to the addresses array and defining start and end indexes.
  // StartPlace is always on the index 0 and endPlace on the index 1.
  const startAddress = [startPlace.lon, startPlace.lat];
  const endAddress = [endPlace.lon, endPlace.lat];

  if (startAddress === null || endAddress === null ) {
    return null;
  }

  // Setting up start and end addresses and indexes for Flask.
  addresses.push(startAddress, endAddress);
  const start_indexes = Array(amountOfVehicles).fill(0);
  const end_indexes = Array(amountOfVehicles).fill(1);

  // Save startPlace and endPlace with string keys
  placesMap.set(`${startAddress[0]},${startAddress[1]}`, startPlace);
  placesMap.set(`${endAddress[0]},${endAddress[1]}`, endPlace);

  // Adding standardPickUp addresses to the addresses array and defining indexes for must_visit places.
  const mustVisitIndexes = [];
  if (Array.isArray(mandatoryAddresses) && mandatoryAddresses.length > 0) {
    let mustVisitIndex = 2;
    for (const place of mandatoryAddresses) {
      let address = [place.lon, place.lat];
      if (address !== null) {
        addresses.push(address);
        mustVisitIndexes.push(mustVisitIndex);
        mustVisitIndex += 1;

        // Saving this to the map.
        placesMap.set(`${address[0]},${address[1]}`, place);
      }
    }
  }

  // Saving indexes of must visit (mandatory addresses) places.
  const must_visit = Array.from({ length: amountOfVehicles }, (_, index) => 
    index === 0 ? mustVisitIndexes : []
  );

  // Adding selected pickup places to the addresses array.
  if (Array.isArray(pickUpAdresses) && pickUpAdresses.length > 0) {
    for (const place of pickUpAdresses) {
      let address = [place.lon, place.lat];
      if (address !== null) {
        addresses.push(address);

        // Saving this to the map.
        placesMap.set(`${address[0]},${address[1]}`, place);
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
  console.log('requestBody to Flask: ', requestBody);

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
        // The key must be created from the coordinates gotten from Flask
        // E.g. [23.123456, 62.123456] => "23.123456,62.123456"
        const key = address.join(',');
        const place = placesMap.get(key);
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

export { exampleRoute, geocodePoints, getOptimizedRoutes };



/**
 * Appends a new pickup location to an existing Excel file using the Flask backend.
 * 
 * @param {String} filename The name of the Excel file to modify.
 * @param {Object} pickupData The pickup information to append (name, address, postal code, city, lat, lon).
 * @returns {Object} An object indicating success or failure and a message for the user.
 */
export const appendPlaceToExcel = async (filename, pickupData) => {
  try {
    console.log(pickupData);
    const response = await fetch(`${FLASK_URL}api/append_to_excel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filename: filename,
        data: {
          name: pickupData.name,
          address: pickupData.address,
          postalCode: pickupData.postalCode,
          city: pickupData.city,
          standardPickup: pickupData.standardPickup,
          lat: pickupData.lat,
          lon: pickupData.lon,
        },
      }),
    });

    if (response.ok) {
      return { success: true, message: "Paikka lisätty onnistuneesti!" };
    } else {
      const error = await response.json();
      return { success: false, message: error?.error || "Tuntematon virhe." };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
};

/**
 * Deletes an entire Excel file from the backend.
 * 
 * @param {String} fileName The name of the Excel file to delete.
 * @returns {Object} A JSON response indicating whether the deletion was successful.
 */
export const deleteExcelFile = async (fileName) => {
  try {
    // Send a DELETE request to remove the Excel file.
    const response = await fetch(`${FLASK_URL}api/delete_excel`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_name: fileName }),
    });
    const result = await response.json();
    return result;
  } catch (err) {
    return { error: true, message: "Poistopyynnön virhe: " + err.message };
  }
};

/**
 * Fetches the list of available Excel files from the Flask backend
 * and updates the frontend state accordingly.
 * 
 * @param {Function} setExcelData React setter to update the Excel file list.
 * @param {Function} setSelectedFile React setter to update the currently selected file.
 * @param {Function} setError React setter for handling error messages.
 * @param {String} selectedFile The currently selected Excel file.
 */
export async function fetchExcelData(setExcelData, setSelectedFile, setError, selectedFile) {
  try {
    // Fetch the Excel files from the Flask API endpoint.
    const response = await fetch(`${FLASK_URL}api/get_excel_files`);
    if (!response.ok) throw new Error("Excel-tiedostojen haku epäonnistui");
    const data = await response.json();
    // Update the state with the retrieved data.
    setExcelData(data);
    
    // Set the default selected file if none is already selected.
    const files = Object.keys(data);
    if (files.length > 0 && !selectedFile) {
      setSelectedFile(files[0]);
    }
  } catch (err) {
    setError(err.message);
  }
}

/**
 * Fetches route data from the Flask backend and filters out any invalid routes.
 * 
 * @param {Function} setRouteData React setter to store the fetched route data.
 * @param {Function} setError React setter to handle any errors.
 */
export async function fetchRoutes(setRouteData, setError) {
  try {
    // Retrieve the route data from the Flask API.
    const response = await fetch(`${FLASK_URL}api/get_route`);
    if (!response.ok) throw new Error("Failed to fetch route data");
    const data = await response.json();
    
    // Filter out any routes that have an error property.
    const validRoutes = Object.entries(data)
      .filter(([_, value]) => !value.error)
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});
    
    // Update the state with the valid routes.
    setRouteData(validRoutes);
  } catch (err) {
    // Set the error state if something goes wrong.
    setError(err.message);
  }
}

/**
 * Converts Excel time input (either a number or string) to the "HH:mm" time format.
 * 
 * Excel stores time as a fraction of a day (e.g., 9:00 is 0.375). This function converts such 
 * numerical representations into the corresponding "HH:mm" format. If the input is a string, 
 * it also replaces any dots with colons and pads the hours or minutes to ensure a two-digit format.
 *
 * @param {number|string} timeInput The raw time value from Excel (e.g., 0.375 or "9:00"/"9.00").
 * @param {number} rowIndex The row index in the Excel file for logging error messages if needed.
 * @returns {string} The time formatted as a string in "HH:mm" format.
 */
export const formatTime = (timeInput, rowIndex, label) => {
  //if value is number, Excel saves time as a portion of day
  if (typeof timeInput === 'number') {
      const totalMinutes = Math.round(timeInput * 24 * 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  }
  // if string replace "." with ":"
  let timeStr = timeInput.toString().trim().replace(".", ":");
  if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
      const [h, m] = timeStr.split(":").map((s) => s.padStart(2, "0"));
      return `${h}:${m}`;
  } else {
      return null;
  }
};

/**
 * Removes a specific pickup location from an Excel file using the Flask backend.
 * 
 * @param {String} filename The name of the Excel file.
 * @param {Object} pickupData The pickup location to be removed.
 * @returns {Object} A JSON response from the backend indicating success or error.
 */
export const removePlaceFromExcel = async (filename, pickupData) => {
  try {
    // Send a POST request to remove the specified pickup location.
    const response = await fetch(`${FLASK_URL}api/remove_from_excel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, data: pickupData }),
    });
    const text = await response.text();
    let result = {};
    try {
      result = JSON.parse(text);
    } catch (e) {
      console.error('Vastaus ei ole validia JSONia:', text);
    }
    return result;
  } catch (error) {
    return { error: true, message: error.message };
  }
};

/*
  updateRouteTimeInExcel: Funktio, joka päivittää reitin aikataulun Excel‑tiedostoon.
  Lähetetään filename sekä päivitetyt startTime ja endTime Flask‑backendin reitille.
*/
export const updateRouteTimeInExcel = async (filename, newStart, newEnd) => {
  try {
    const response = await fetch(`${FLASK_URL}api/update_route_time`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        file_name: filename,
        startTime: newStart,
        endTime: newEnd
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, message: error?.error || "Virhe ajan päivityksessä." };
    }
    return { success: true, message: "Aikataulu päivitetty onnistuneesti." };
  } catch (error) {
    return { success: false, message: error.message };
  }
};




