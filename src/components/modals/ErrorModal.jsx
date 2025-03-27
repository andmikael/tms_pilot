import React, { useState, useEffect } from 'react';
import { useRef } from 'react';

const ErrorModal = ({title, description, dataToParent}) => {
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

    if (title == undefined) {
        title = "Tapahtui virhe";
    }

    if (description == undefined) {
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