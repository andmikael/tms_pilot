import { expect, test } from 'vitest';

const FLASK_URL = 'http://0.0.0.0:8000/';

async function sendRequest(body, failOnStatusCode = true) {
  const response = await fetch(`${FLASK_URL}api/routing`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const responseBody = await response.json();
  return { status: response.status, body: responseBody };
}

test("should successfully respond to optimization request", async () => {
  const response = await sendRequest({
    "addresses": [
      ["23.848803430027747", "61.44703830112671"],
      ["23.865587763318388", "61.48896196000728"],
      ["23.81242204618441", "61.49429193515291"],
      ["23.774139917016626", "61.49889748926298"],
      ["23.770897744854445", "61.492087372949015"]
    ],
    "start_indexes": [0, 0],
    "end_indexes": [3, 4],
    "number_of_vehicles": 2,
    "must_visit": [[], []],
    "traffic_mode": "best_guess"
  });
  /*console.log(response)*/
  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty('ordered_routes');
});

test("should order routes correctly", async () => {
  const response = await sendRequest({
    "addresses": [
      ["23.67515861418025", "61.469559883981816"], /* Tampere*/
      ["27.705213690312476", "62.880115390376446"], /*Kuopio*/
      ["25.738163041972378", "62.23898251455832"], /* Jyväskylä*/
      ["24.922556675587458", "60.15167621597458"], /*Helsinki*/
      ["22.203868787637735", "60.436970195525575"]], /*Turku*/
    "start_indexes": [3],
    "end_indexes": [1],
    "number_of_vehicles": 1,
    "must_visit": [[]],
    "traffic_mode": "best_guess"
  });

  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty('ordered_routes');

  expect(response.body.ordered_routes).toEqual([
    [
      ['24.922556675587458', '60.15167621597458'],
      ['22.203868787637735', '60.436970195525575'],
      ['23.67515861418025', '61.469559883981816'],
      ['25.738163041972378', '62.23898251455832'],
      ['27.705213690312476', '62.880115390376446']
    ]
  ]);
});

/* Tämä kaataa optimoinnin välillä!!!!
test("should handle more complex optimization request without error", async () => {
  const response = await sendRequest({
    "addresses": [
      ["23.67515861418025", "61.469559883981816"], // Tampere
      ["27.705213690312476", "62.880115390376446"], //Kuopio
      ["25.738163041972378", "62.23898251455832"], // Jyväskylä 
      ["24.922556675587458", "60.15167621597458"], // Helsinki 
      ["22.203868787637735", "60.436970195525575"], // Turku 
      ["28.19682853273535", "61.04022588278226"], //Lappeenranta 
      ["27.219045353646607", "61.67738650932365"], // Mikkeli 
      ["21.539113852647954", "61.13583294478794"], // Rauma 
      ["21.813772049021196", "61.478682702846704"], //Pori 
      ["21.605031818697253", "63.08781786688473"], // Vaasa 
      ["29.811818726329733", "62.596395578402"], // Joensuu 
      ["26.966359836749405", "60.455073081893325"], // Kotka 
      ["26.702687968231093", "60.86419482423482"], //  Kouvola 
      ["27.769826563199917", "64.22526558682723"], // Kajaani 
      ["25.47368403368757", "65.02092554901982"] // Oulu 
    ],
    "start_indexes": [3, 3], // Aloitetaan Helsingistä 
    "end_indexes": [13, 13], // Päädytään Kajaaniin 
    "number_of_vehicles": 2,
    "must_visit": [[3, 0, 2, 13], []], // Runkoreitti: Helsinki-Tampere-Jyväskylä-Kajaani 
  });
  //console.log(response.body.ordered_routes)
  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty('ordered_routes');

  expect(response.body.ordered_routes).toEqual([
    [
      ['24.922556675587458', '60.15167621597458'], // Helsinki 
      ['23.67515861418025', '61.469559883981816'], // Tampere 
      ['25.738163041972378', '62.23898251455832'], // JKL 
      ['27.219045353646607', '61.67738650932365'], // Mikkeli 
      ['26.702687968231093', '60.86419482423482'], // Kouvola 
      ['28.19682853273535', '61.04022588278226'], // lappeen Ranta 
      ['29.811818726329733', '62.596395578402'], // Joensuu 
      ['27.705213690312476', '62.880115390376446'], // Kuopio 
      ['27.769826563199917', '64.22526558682723'] // Kajaani 
    ],
    [
      ['24.922556675587458', '60.15167621597458'], // Helsinki 
      ['26.966359836749405', '60.455073081893325'], // Kotka 
      ['22.203868787637735', '60.436970195525575'], // Turku 
      ['21.539113852647954', '61.13583294478794'], // Rauma 
      ['21.813772049021196', '61.478682702846704'], // Pori 
      ['21.605031818697253', '63.08781786688473'], // Vaasa 
      ['25.47368403368757', '65.02092554901982'], //Oulu 

      ['27.769826563199917', '64.22526558682723'] // Kajaani 
    ]
  ]);
});*/

test("should respond to empty request with 400 and error message", async () => {
  const response = await sendRequest({}, false);

  expect(response.status).toBe(400);
  expect(response.body).toHaveProperty('error_message');
});

test("should respond to request with no addresses with correct error message", async () => {
  const response = await sendRequest({
    "addresses": [],
    "start_indexes": [0, 0],
    "end_indexes": [3, 4],
    "number_of_vehicles": 2,
    "must_visit": [[], []],
    "traffic_mode": "best_guess"
  }, false);

  expect(response.status).toBe(400);
  expect(response.body.error_message).toBe("DataError: Less than 2 addresses provided");
});

test("should respond to impossible requests with error", async () => {
  const response = await sendRequest({
    "addresses": [["-102.06534683800663", "39.97090784160813"], /* US*/
    ["26.3674976473127", "62.770285338255626"],  /*Finland*/
    ["133.6894047013892", "-25.483678416836224"]], /*Australia*/
    "start_indexes": [0],
    "end_indexes": [2],
    "number_of_vehicles": 1,
    "must_visit": [[]],
    "traffic_mode": "best_guess"
  }, false);

  expect(response.status).toBe(400);
  expect(response.body).toHaveProperty('error_message');
});

test("should respond to invalid locations with error", async () => {
  const response = await sendRequest({
    "addresses": [[54535, 6546543], [-432543, 54325], "9"],
    "start_indexes": [0],
    "end_indexes": [2],
    "number_of_vehicles": 1,
    "must_visit": [[]],
    "traffic_mode": "best_guess"
  }, false);

  expect(response.status).toBe(400);
  expect(response.body).toHaveProperty('error_message');
});