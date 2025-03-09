/**
 * Unit tests for Header component.
*/

import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from "../../src/components/Header";

describe("Header", () => {

    beforeEach(() => {
        render(
        <Router> 
            <Header/> 
        </Router>
        );
    });

    afterEach(() => {
        cleanup(); // Unmounts DOM after each test.
    });

    it("renders title", () => {
        const h3Title = screen.getByText("Kuljetuksien suunnittelujärjestelmä");
        expect(h3Title).toBeInTheDocument();
    });

    
    it("renders 'Reittisuunnittelu' navigation link", () => {
        const navLink = screen.getByRole('link', { name: "Reittisuunnittelu" });
        expect(navLink).toBeInTheDocument();
        expect(navLink).toHaveClass(/nav-link|nav-link-active/i);
    });

    it("renders 'Lisää' navigation link", () => {
        const navLink = screen.getByRole('link', { name: "Lisää" });
        expect(navLink).toBeInTheDocument();
        expect(navLink).toHaveClass(/nav-link|nav-link-active/i);
    });

});
