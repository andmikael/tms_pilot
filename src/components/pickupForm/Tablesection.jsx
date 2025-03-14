import { React, useState } from "react";

const TableSection = ({ args }) => {

    const [newPickup, setNewPickup] = useState({
        name: "",
        address: "",
        zipcode: "",
        city: "",
        lat: null,
        lon: null
    });

    const submitForm = () => {
        args(newPickup);
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewPickup({ ...newPickup, [name]: value });
    };

    const addNewPickup = () => {
        if (
            newPickup.name.trim() !== '' &&
            newPickup.address.trim() !== '' &&
            newPickup.zipcode.trim() !== '' &&
            newPickup.city.trim() !== ''
        ) {
            submitForm(newPickup);
            setNewPickup({ name: "", address: "", zipcode: "", city: "", lat: null, lon: null});
        }
    };

    return ( 
        <table>
            <tbody className="pickupFormBody">
            <tr>
                <td>
                    <label>Nimi</label>
                </td>
                <td>
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
                <td>
                    <label>Katu</label>
                </td>
                <td>
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
                <td>
                    <label>Postinumero</label>
                </td>
                <td>
                    <input
                      type="text"
                      name="zipcode"
                      value={newPickup.zipcode}
                      onChange={handleInputChange}
                      placeholder="61800"
                    />
                </td>
            </tr>
            <tr>
                <td>
                    <label>Kaupunki</label>
                </td>
                <td>
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
                <td>
                    <button onClick={addNewPickup} className="button-save">Tallenna</button>
                </td>
            </tr>
        </tbody>
        </table>
    )
}

export default TableSection;