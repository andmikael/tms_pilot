import { defineConfig } from "vite";

export default defineConfig({
    test: {
      environment: "jsdom",
      include: ["./test/unit/*.{test.js,test.jsx}"]
    },
  })