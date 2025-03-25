import { expect, test } from 'vitest';

const FLASK_URL = 'http://0.0.0.0:8000/';

async function sendRequest(body) {
  const response = await fetch(`${FLASK_URL}upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  return { status: response.status, body: data };
}

test("should successfully respond to Excel saving request", async () => {
  const response = await sendRequest({
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

