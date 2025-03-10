/* 
* TMS header, jossa on järjestelmän nimi ja navigointipainikkeet.
*/

import { NavLink } from "react-router-dom";
import React from 'react'; 

const Header = () => {
    
    return <div>
        <header className="header">
            <div className="title">
                <h3>Kuljetuksien suunnittelujärjestelmä</h3>
            </div>
            <nav className="header-nav">
                <NavLink className={({ isActive }) => isActive ? "nav-link-active" : "nav-link"} to="/">Reittisuunnittelu</NavLink>
                <NavLink className={({ isActive }) => isActive ? "nav-link-active" : "nav-link"} to="/files">Tiedostot</NavLink>
            </nav>
        </header>
    </div>
};

export default Header;