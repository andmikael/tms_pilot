/**
 * Smoke tests for verifying that the page loads and the most crucial functionality works.
*/

const BASE_URL = "http://localhost:3000/";

describe("Smoke tests", () => {

  it("should load the main page", () => {
    cy.visit(BASE_URL);
    cy.contains('Kuljetuksien suunnittelujärjestelmä', { timeout: 10000 }).should('be.visible');
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

});