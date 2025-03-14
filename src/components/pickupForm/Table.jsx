import React from 'react';
import TableSection from './Tablesection';
import useOpenController from "../templateDropdown/useOpenController";
import ExpandableButton from "../templateDropdown/ExpandableButton";

const Table = ({returnDataToList}) => {
    const {isOpen, toggle} = useOpenController(false);

    const handleFormData = (data) => {
        returnDataToList(data);
    }

    return (
        <table className="pickupFormTable">
            <thead>
                <tr>
                    <td>
                        Lisää uusi noutopiste
                    </td>
                    <td className="button-td">
                    <ExpandableButton isOpen={isOpen} toggle={toggle}/>
                </td>
                </tr>
            </thead>
            {isOpen && <TableSection returnData={handleFormData}/>}
        </table>
    )
}

export default Table