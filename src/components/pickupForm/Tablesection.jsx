import React, { useState } from "react";
import { StandardPickup } from "../../utils";

const TableSection = ({ dataToParent }) => {

    const [newPickup, setNewPickup] = useState({
        name: "",
        address: "",
        postalCode: "",
        city: "",
        standardPickup: StandardPickup.NO,
        lat: null,
        lon: null
    });
    const [error, setError] = useState("");

    const submitForm = () => {
     dataToParent(newPickup);
    }

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setError("")

    if (type === "checkbox" && name === "standardPickup") {
        setNewPickup({
            ...newPickup,
            standardPickup: checked ? StandardPickup.YES : StandardPickup.NO
        });
    } else {
        setNewPickup({
            ...newPickup,
            [name]: value
        });
    }
    };

    const addNewPickup = () => {
        if (
            newPickup.name.trim() !== '' &&
            newPickup.address.trim() !== '' &&
            newPickup.postalCode.trim() !== '' &&
            newPickup.city.trim() !== ''
        ) {
            submitForm();
            setNewPickup({ name: "", address: "", postalCode: "", city: "", standardPickup: StandardPickup.NO, lat: null, lon: null });
        } else {
            setError("Täytä kaikki kentät ennen tallennusta.");
        }
    };

    return (
        <>
            <table>
                <tbody className="pickupFormBody">
                    <tr>
                        <td><label>Nimi</label></td>
                        <td className="table-input-container">
                            <input
                                type="text"
                                name="name"
                                value={newPickup.name}
                                onChange={handleInputChange}
                                placeholder="Sote-keskus"
                            />
                        </td>
                    </tr>
                    <tr>
                        <td><label>Katu</label></td>
                        <td className="table-input-container">
                            <input
                                type="text"
                                name="address"
                                value={newPickup.address}
                                onChange={handleInputChange}
                                placeholder="Katu 1"
                            />
                        </td>
                    </tr>
                    <tr>
                        <td><label>Postinumero</label></td>
                        <td className="table-input-container">
                            <input
                                type="text"
                                name="postalCode"
                                value={newPickup.postalCode}
                                onChange={handleInputChange}
                                placeholder="61800"
                            />
                        </td>
                    </tr>
                    <tr>
                        <td><label>Kaupunki</label></td>
                        <td className="table-input-container">
                            <input
                                type="text"
                                name="city"
                                value={newPickup.city}
                                onChange={handleInputChange}
                                placeholder="Kauhajoki"
                            />
                        </td>
                    </tr>
                    <tr>
                        <td><label>Vakionouto</label></td>
                        <td className="table-input-container">
                            <input
                                type="checkbox"
                                className="styled-checkbox"
                                name="standardPickup"
                                checked={newPickup.standardPickup === StandardPickup.YES}
                                onChange={handleInputChange}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <button onClick={addNewPickup} className="button-save">Tallenna</button>
                        </td>
                    </tr>
                </tbody>
            </table>
            {error && <div className="warning-text">{error}</div>}
        </>
    );
};

export default TableSection;