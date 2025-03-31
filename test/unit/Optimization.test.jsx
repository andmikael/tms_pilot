

import { expect, test, vi } from 'vitest';

const FLASK_URL = 'http://0.0.0.0:8000/';


async function sendPostRequest(body) {
  const response = await fetch(`${FLASK_URL}upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  return { status: response.status, body: data };
}

async function sendGetRequest() {
  const response = await fetch(`${FLASK_URL}api/get_excel_jsons`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  
  const data = await response.json();

  return { status: response.status, body: data };
}

async function sendDeleteRequest(body) {
  const response = await fetch(`${FLASK_URL}api/delete_excel`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  
  const data = await response.json();
  
  return { status: response.status, body: data };
}

test("should successfully respond to Excel saving request", async () => {
  const response = await sendPostRequest({
    "routeName": "Reitti",
    "data": [
      {
        "name": "Konetalo",
        "address": "Korkeakoulunkatu 6",
        "postalCode": "33720",
        "city": "Tampere",
        "standardPickup": "yes",
        "lat": "61.44869322268551",
        "lon": "23.859398648697006"
      },
      {
        "name": "Tietotalo",
        "address": "Korkeakoulunkatu 1",
        "postalCode": "33720",
        "city": "Tampere",
        "standardPickup": "no",
        "lat": "61.44979009607303",
        "lon": "23.85576846213571"
      },
      {
        "name": "Tampere-talo",
        "address": "Yliopistonkatu 55",
        "postalCode": "33100",
        "city": "Tampere",
        "standardPickup": "yes",
        "lat": "61.49592890697636",
        "lon": "23.78160833411916"
      }
    ]
  });

  expect(response.status).toBe(200);
  expect(response.body.message).toContain("Tiedosto tallennettu onnistuneesti");

});

test("should successfully respond to Excel get request", async () => {
  const response = await sendGetRequest();

  expect(response.status).toBe(200);

  expect(response.body.Reitti).toStrictEqual([
    {
      "Kaupunki": "Tampere",
      "Lat": 61.44869322268551,
      "Lon": 23.85939864869701,
      "Osoite": "Korkeakoulunkatu 6",
      "Postinumero": 33720,
      "Vakionouto": "yes",
      "name": "Konetalo",
    },
    {
      "Kaupunki": "Tampere",
      "Lat": 61.44979009607303,
      "Lon": 23.85576846213571,
      "Osoite": "Korkeakoulunkatu 1",
      "Postinumero": 33720,
      "Vakionouto": "no",
      "name": "Tietotalo",
    },
    {
      "Kaupunki": "Tampere",
      "Lat": 61.49592890697636,
      "Lon": 23.78160833411916,
      "Osoite": "Yliopistonkatu 55",
      "Postinumero": 33100,
      "Vakionouto": "yes",
      "name": "Tampere-talo",
    },
  ])

});


test("should successfully respond to Excel delete request", async () => {
  const response = await sendDeleteRequest({
    "file_name": "Reitti"
  });
 
  expect(response.status).toBe(200);
  expect(response.body.message).toContain("Tiedosto poistettu onnistuneesti");
});

