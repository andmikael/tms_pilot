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

  });


  context('Optimization backend', () => {
    it("should successfully respond to optimization request", () => {      
      cy.request({ 
        method: 'POST', 
        url: FLASK_URL + 'api/route_test', 
        body: {
        "addresses": [
          "Teekkarinkatu+10+Tampere",
          "Nekalantie+1+Tampere",
          "Kalevantie+1+Tampere",
          "Tampereen+valtatie+8+Tampere",
          "Pirkankatu+8+Tampere",
        ],
        "start_indexes": [
          0,
          0
        ],
        "end_indexes": [
          3,
          4
        ],
        "number_of_vehicles": 2,
        "must_visit": [[], []],
        "traffic_mode": "best_guess"
      }
     }).then(
        (response) => {
          expect(response.status).to.eq(200)
          expect(response.body).to.have.property('ordered_routes')
        }
      )
    });


      it("should respond to empty request with 400 and error message", () => {      
        cy.request({ 
          method: 'POST', 
          url: FLASK_URL + 'api/route_test', 
          body: {        },
          failOnStatusCode: false
       }).then(
          (response) => {
            expect(response.status).to.eq(400)
            expect(response.body).to.have.property('error_message')
          }
        )

      });

      it("should respond to request with no addresses with correct error message", () => {      
        cy.request({ 
          method: 'POST', 
          url: FLASK_URL + 'api/route_test', 
          body: {
          "addresses": [
          ],
          "start_indexes": [
            0,
            0
          ],
          "end_indexes": [
            3,
            4
          ],
          "number_of_vehicles": 2,
          "must_visit": [[], []],
          "traffic_mode": "best_guess"
        },
        failOnStatusCode: false
       }).then(
          (response) => {
            expect(response.status).to.eq(400)
            expect(response.body).property('error_message').to.deep.equal("DataError: Less than 2 addresses provided")
          }
        )
      });

      it("should order routes correctly", () => {      
        cy.request({ 
          method: 'POST', 
          url: FLASK_URL + 'api/route_test', 
          body: {
          "addresses": [
            "Teekkarinkatu+10+Tampere",
            "Kuninkaankatu+1+Kuopio",
            "Yliopistonkatu+5+Jyvaskyla",
            "Bulevardi+Helsinki",
            "Linnankatu+10+Turku",
          ],
          "start_indexes": [
            3,
          ],
          "end_indexes": [
            1,
          ],
          "number_of_vehicles": 1,
          "must_visit": [[]],
          "traffic_mode": "best_guess"
        }
       }).then(
          (response) => {
            expect(response.status).to.eq(200)
            expect(response.body).property('ordered_routes').to.deep.equal(([["Bulevardi+Helsinki", "Linnankatu+10+Turku", "Teekkarinkatu+10+Tampere", "Yliopistonkatu+5+Jyvaskyla", "Kuninkaankatu+1+Kuopio"]]))
          }
        )

      });


      it("should respond to impossible requests with error", () => {      
        cy.request({ 
          method: 'POST', 
          url: FLASK_URL + 'api/route_test', 
          body: {
          "addresses": [
            "United+States",
            "Finland",
            "Australia"
          ],
          "start_indexes": [
            0,
          ],
          "end_indexes": [
            2,
          ],
          "number_of_vehicles": 1,
          "must_visit": [[]],
          "traffic_mode": "best_guess"
        },
        failOnStatusCode: false
       }).then(
          (response) => {
            expect(response.status).to.eq(400)
            expect(response.body).to.have.property('error_message')
          }
        )

      });

  });

});