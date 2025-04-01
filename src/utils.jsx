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
* mandatoryAddresses = Runkoreitti, standard pickup addresses
* pickUpAdresses = Array of all the additional addresses what need to be visited (pickup places)
*/
async function getOptimizedRoutes(startPlace, endPlace, routes, amountOfVehicles, trafficMode) {
  const addressesMap = new Map(); // Most of the operations are O(1).
  const addresses = [];

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

  addresses.push(startAddress, endAddress);
  const start_indexes = Array(amountOfVehicles).fill(0);
  const end_indexes = Array(amountOfVehicles).fill(1);

  // Adding standardPickUp addresses to the addresses array.
  

  const body = {
    "addresses": addresses,
    "start_indexes": start_indexes,
    "end_indexes": end_indexes,
    "number_of_vehicles": amountOfVehicles,
    "must_visit": [[]],
    "traffic_mode": "best_guess"
  };
  console.log(body);

  // Esimerkkimuoto.
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
        body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error(`Virhe reittioptimoinnissa: ${response.status}`);
      return null;
    }

    const data = await response.json();
    //console.log(data);
    return data;

  } catch (error) {
      console.error("Virhe reittioptimoinnissa:", error);
  }

}

// Transforms addresses form from "address 1" and "Kauhajoki" to "address+1+Kauhajoki".
// Returns null if there are no address or city.
function transformAddress(address, city) {
  if (address === null || city === null) {
    console.error(`Virhe osoitteessa, osoite: ${address} ja kaupunki: ${city}`, error);
    return null;
  }
  const newAddress = address.split(" ").join("+");
  const fullAddress = newAddress + "+" + city;
  return fullAddress;
}


// HEIDI: to be removed later...
async function testi () {
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
        body: JSON.stringify(body1),
    });

    if (!response.ok) {
      console.error(`Virhe reittioptimoinnissa: ${response.status}`);
      return null;

      // TODO: lisää tähän mahdolliset responset.
    }

    const data = await response.json();
    //console.log(data);
    return data;

  } catch (error) {
      console.error("Virhe reittioptimoinnissa:", error);
  }
}

export { exampleRoute, geocodePoints, testi, getOptimizedRoutes, transformAddress };