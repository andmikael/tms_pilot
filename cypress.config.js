import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    supportFile: "./test/cypress/support/e2e.js",
    specPattern: "./test/cypress/e2e/**/*.spec.cy.js",
  },
});