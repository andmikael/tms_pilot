/**
 * Virheilmoitus modaalikomponentti
 * Otsikko ja kuvaus annetaan parametreina. Jos niitä ei anneta, annetaan geneerinen otsikko ja kuvaus.
 * dataToParent ideana on toistaiseksi palauttaa kutsuvalle komponentille tieto siitä pitäisikö modaalin näkyä, eli onko modaali suljettu
 * TODO: selvitä onko ylempi pakollinen modaalin toiminnan kannalta 
 * 
 * Modal component for error messages
 * Title and description are given as parameters. If they are not given, a generic title and description are supplied
 * dataToParent will return information into parent component on whether the modal is visible
 * TODO find out whether the aboce is required for modal operation
 */

import React, { useState, useEffect } from 'react';
import { useRef } from 'react';

const ErrorModal = ({title=null, description=null, dataToParent}) => {
    const dialogRef = useRef(null);

    useEffect(() => {
      if (title && dialogRef.current) {
        dialogRef.current.showModal();
      }
    }, [title]);

    const handleClose = () => {
        dialogRef.current.close();
        dataToParent(false);
    }

    if (title == null) {
        title = "Tapahtui virhe";
    }

    if (description == null) {
        description = "Jokin meni vikaan. Yritä uudelleen";
    }

    return (
        <div id="errorModal">
            <dialog className="modal-box" ref={dialogRef}>
                <h3 className="modal-title">{title}</h3>
                <p className="modal-desc">{description}</p>
                <button className="modal-action" onClick={handleClose}>Sulje</button>
            </dialog>
        </div>
    )
}

export default ErrorModal;