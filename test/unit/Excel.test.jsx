import { expect, test } from 'vitest';

const FLASK_URL = 'http://0.0.0.0:8000/';

test("should successfully respond to upload_excel request", async () => {
  const body = {
    "routeName": "Reitti",
    "fileName": "Testireitti",
    "endLocation": {
      "name": "Konetalo",
      "address": "Korkeakoulunkatu 6",
      "postalCode": "33720",
      "city": "Tampere",
      "standardPickup": "yes",
      "lat": "61.44869322268551",
      "lon": "23.859398648697006",
      "endTime": "12:00"
    },
    "startLocation": {
      "name": "Tampere-talo",
      "address": "Yliopistonkatu 55",
      "postalCode": "33100",
      "city": "Tampere",
      "standardPickup": "yes",
      "lat": "61.49592890697636",
      "lon": "23.78160833411916",
      "departureTime": "9:00"
    },
    "data": [
      {
        "name": "Tietotalo",
        "address": "Korkeakoulunkatu 1",
        "postalCode": "33720",
        "city": "Tampere",
        "standardPickup": "no",
        "lat": "61.44979009607303",
        "lon": "23.85576846213571"
      },
    ],
  };

  const response = await fetch(`${FLASK_URL}api/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json();

  expect(response.status).toBe(200);
  expect(data.message).toContain("Tiedosto tallennettu onnistuneesti");

});

test("should successfully respond to Excel get_route request", async () => {
  const response = await fetch(`${FLASK_URL}api/get_route`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await response.json();

  expect(response.status).toBe(200);
  expect(data["Reitti (Testireitti).xlsx"]).toStrictEqual({
    "endPlace": {
      "address": "Korkeakoulunkatu 6",
      "city": "Tampere",
      "lat": "61.44869322268551",
      "lon": "23.859398648697006",
      "name": "Konetalo",
      "postalCode": "33720",
      "standardPickup": "yes"
    },
    "endTime": "12:00",
    "name": "Reitti (Testireitti)",
    "routes": [
      {
        "address": "Korkeakoulunkatu 1",
        "city": "Tampere",
        "lat": "61.44979009607303",
        "lon": "23.85576846213571",
        "name": "Tietotalo",
        "postalCode": "33720",
        "standardPickup": "no"
      }
    ],
    "startPlace": {
      "address": "Yliopistonkatu 55",
      "city": "Tampere",
      "lat": "61.49592890697636",
      "lon": "23.78160833411916",
      "name": "Tampere-talo",
      "postalCode": "33100",
      "standardPickup": "yes"
    },
    "startTime": "9:00"
  })
});

test("should successfully respond to Excel get_files request", async () => {
  const response = await fetch(`${FLASK_URL}api/get_excel_files`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await response.json();

  expect(response.status).toBe(200);
  expect(data["Reitti (Testireitti)"].file_name).toStrictEqual("Reitti (Testireitti).xlsx")
});


test("should successfully append to excel", async () => {
  const body = {
    "filename": "Reitti (Testireitti)",
    "data": {
      "address": "Korkeakoulunkatu 1",
      "city": "Tampere",
      "lat": "61.44979009607303",
      "lon": "23.85576846213571",
      "name": "Tietotalo",
      "postalCode": "33720",
      "standardPickup": "no"
    }
  }

  const response = await fetch(`${FLASK_URL}api/append_to_excel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json();


  expect(response.status).toBe(200);
  expect(data.message).toContain("Paikka lisätty onnistuneesti");

});


test("should remove from excel successfully", async () => {
  const body = {
    "filename": "Reitti (Testireitti)",
    "data": {
      "address": "Korkeakoulunkatu 1",
      "city": "Tampere",
      "lat": "61.44979009607303",
      "lon": "23.85576846213571",
      "name": "Tietotalo",
      "postalCode": "33720",
      "standardPickup": "no"
    }
  }

  const response = await fetch(`${FLASK_URL}api/remove_from_excel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json();


  expect(response.status).toBe(200);
  expect(data.message).toContain("Noutopaikka poistettu onnistuneesti Excel-tiedostosta.");

});

test("should update route time successfully", async () => {
  const body = {
    "file_name": "Reitti (Testireitti)",
    "startTime": "20:00",
    "endTime": "23:00"
  }

  const response = await fetch(`${FLASK_URL}api/update_route_time`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json();


  expect(response.status).toBe(200);
  expect(data.message).toContain("Aika päivitetty onnistuneesti.");

});


test("should get original names successfully", async () => {

  const response = await fetch(`${FLASK_URL}api/get_original_names`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await response.json();

  expect(response.status).toBe(200);
  expect(data['Reitti (Testireitti)']["C1"]).toContain("Testireitti");

});



test("should delete_by_group successfully", async () => {


  var body = {
    "routeName": "delete_by_group test",
    "fileName": "dbgtesti",
    "endLocation": {
      "name": "Konetalo",
      "address": "Korkeakoulunkatu 6",
      "postalCode": "33720",
      "city": "Tampere",
      "standardPickup": "yes",
      "lat": "61.44869322268551",
      "lon": "23.859398648697006",
      "endTime": "12:00"
    },
    "startLocation": {
      "name": "Tampere-talo",
      "address": "Yliopistonkatu 55",
      "postalCode": "33100",
      "city": "Tampere",
      "standardPickup": "yes",
      "lat": "61.49592890697636",
      "lon": "23.78160833411916",
      "departureTime": "9:00"
    },
    "data": [
      {
        "name": "Tietotalo",
        "address": "Korkeakoulunkatu 1",
        "postalCode": "33720",
        "city": "Tampere",
        "standardPickup": "no",
        "lat": "61.44979009607303",
        "lon": "23.85576846213571"
      },
    ],
  };

  await fetch(`${FLASK_URL}api/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  await fetch(`${FLASK_URL}api/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  body = {
    "c1": "dbgtesti"
  }

  const response = await fetch(`${FLASK_URL}api/delete_by_group`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json();

  expect(response.status).toBe(200);
  console.log(data.message)
  expect(data.message).toContain("2 tiedostoa poistettu");

});


test("should successfully respond to delete_excel request", async () => {
  const body = {
    "file_name": "Reitti (Testireitti)"
  };

  const response = await fetch(`${FLASK_URL}api/delete_excel`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json();

  expect(response.status).toBe(200);
  expect(data.message).toContain("Tiedosto poistettu onnistuneesti");
});
