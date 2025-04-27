# TMS pilot

Pilot for a Transport Management System (TMS) used for optimizing routes for transporting laboratory samples.

The software runs locally on the client's computer, and the frontend is available at http://localhost:3000.
The backend runs at http://localhost:8000.

# Architecture

Based on Vite+React for frontend (JavaScript) and Flask for backend (Python)
The application requires Node.js and Python (ideally version 3.12, other versions have not been tested).

The application utilizes Google's OR-Tools package (written in C++, with a Python wrapper) for optimizing routes, as well as the Leaflet.js JavaScript package for displaying routes on the map. In addition, Cypress and Vitest were used for testing. 

# Running the application

## Environment file

The application uses the free OpenRouteService (ORS) API to calculate distances between locations on the map. An API key must be provided in the ".env" file located in the application root folder, containing the following line:

```ORS_API_KEY=insert-api-key-here```

A guide for registering an ORS account and obtaining an API key is provided separately.

## Pre-setup
Run the ./setup.bat batch file to ensure that Python, Node.js and the .env file have been set up on your system correctly. The batch file will show an error if these each of these respective conditions are not met.

## Startup
Run the ./start.bat batch file to start the application. Once started up, the TMS interface will be available at http://localhost:3000.

## Manual start
Additionally, the application may be setup manually through npm.
First install dependencies: 

`npm install`

After that you can start the application by: 

`npm run dev`

You can access TMS on localhost:3000.

For static JavaScript code analysis through eslint, you can run: `npm run lint`

## Testing

Several tests are implemented to automatically check that the the core functionality of the software stays intact after code changes.

### Smoke tests
Smoke tests are implemented in Cypress, and can be found in the `test/cypress/e2e/smoke/smoke.spec.cy.js` file.
These require that the application is running before executing the tests.

First start the application on another terminal: `npm run dev`

Run the smoke tests using command: `npm run test:smoke`

### Unit tests
Unit tests are implemented in Vitest, and they can be found in the `test/unit/` folder.
You can run all the unit test with the command:

`npm run test:unit`

# APIs

API schemas for utilizing the optimization and Excel backend are provided in the `schemas` folder. The `openapi.yaml` file is meant to be viewed with Swagger (https://editor.swagger.io/) and documents all the API calls of the backend. The `schemas/examples` folder provides examples of JSON data that may be provided or returned by these API calls. 

# LICENSING

This software is only licensed for use on Microsoft Windows operating systems due to the licensing conditions of the XLSX.js package used for handling Excel spreadsheet documents in JavaScript.
OR-Tools is licensed under the Apache 2.0 license, granting rights to reproduce and distribute copies of the Work or Derivative Works thereof in any medium, with or without modifications, and in Source or Object form, under certain conditions.