import { defineConfig } from 'cypress';
import path from 'path';

export default defineConfig({
  e2e: {
    supportFile: path.resolve(__dirname, './test/cypress/support/e2e.js'),
    specPattern: path.resolve(__dirname, './test/cypress/e2e/**/*.spec.cy.js'),
  },
});
