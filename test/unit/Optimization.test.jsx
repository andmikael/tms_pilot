import { expect, test } from 'vitest';

const FLASK_URL = 'http://0.0.0.0:8000/';

async function sendRequest(body, failOnStatusCode = true) {
  const response = await fetch(`${FLASK_URL}api/route_test`, {
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
  });

  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty('ordered_routes');
});

test("should order routes correctly", async () => {
  const response = await sendRequest({
    "addresses": ["Tampere", "Kuopio", "Jyvaskyla", "Helsinki", "Turku"],
    "start_indexes": [3],
    "end_indexes": [1],
    "number_of_vehicles": 1,
    "must_visit": [[]],
    "traffic_mode": "best_guess"
  });

  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty('ordered_routes');
  expect(response.body.ordered_routes).toEqual([["Helsinki", "Turku", "Tampere", "Jyvaskyla", "Kuopio"]]);
});

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
    "addresses": ["United+States", "Finland", "Australia"],
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
    "addresses": ["fuiewjoidj", "aaaaa", "9"],
    "start_indexes": [0],
    "end_indexes": [2],
    "number_of_vehicles": 1,
    "must_visit": [[]],
    "traffic_mode": "best_guess"
  }, false);

  expect(response.status).toBe(400);
  expect(response.body).toHaveProperty('error_message');
});