/**
 * Smoke tests for verifying that the page loads and the most crucial functionality works.
*/

const BASE_URL = "http://localhost:3000/";
const FLASK_URL = "http://0.0.0.0:8000/";

describe("Smoke tests", () => {

  context('Frontend', () => {

    it("should load the main page", () => {
      cy.visit(BASE_URL);
      cy.contains('Kuljetuksien suunnittelujärjestelmä');
    });

    it("should load the 'Tiedostot' page", () => {
      cy.visit(BASE_URL + "files");
      cy.contains('Kuljetuksien suunnittelujärjestelmä');
    });

    it("should display header", () => {
      cy.visit(BASE_URL);
      cy.get("header").should("be.visible");
    });

    it("should display navigation links", () => {
      cy.visit(BASE_URL);

      // Checks if classname header-nav exists.
      cy.get("nav.header-nav").should("exist");

      // Checks if there is one active link in the navigation
      cy.get("nav.header-nav")
        .find("a.nav-link-active")
        .should("exist");
    });

    it("should navigate to 'Reittisuunnittelu' page", () => {
      cy.visit(BASE_URL);
      cy.get("a[href='/']").click();
      cy.url().should("include", "/");
    });

    it("should navigate to 'Tiedostot' page", () => {
      cy.visit(BASE_URL);
      cy.get("a[href='/files']").click();
      cy.url().should("include", "/files");
    });

    it("should display pickupform", () => {
      cy.visit(BASE_URL);
      cy.get(".route-selection-container").click();
      cy.get(".route-selection-container")
      .find(".pickupform").click();
      cy.get(".pickupFormBody")
      .should("be.visible");
    });

    // This test is disabled as the map is not displayed when there are no excel files uploaded.
    /*it("should display leaflet map", () => {
      cy.visit(BASE_URL);
      cy.get(".leaflet-container").click();
      cy.get("#map").should("be.visible");
    })*/

  });


  context('Flask backend', () => {
    
    it("should respond to OPTIONS request with 200 OK", () => {
      cy.request({
        method: 'OPTIONS',
        url: FLASK_URL + 'api/route_test'
      }).then(
        (response) => {
          expect(response.status).to.eq(200)
        }
      )
    });
  });


});