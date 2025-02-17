/*
* This components is for displaying data of each place (name, address, ...) after reading the excel file.
* TODO: Not completely implemented!
*/

export const PlaceDetails = (name, address, postalCode, city, standardPickup) => {
    return (<div>
        <p>Name: {name}</p>
        <text>Moi</text>
        <p>Address: {address}</p>
        <p>Postal Code: {postalCode}</p>
        <p>City: {city}</p>
    </div>
    )
};