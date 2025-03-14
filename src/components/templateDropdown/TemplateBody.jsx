/*
 * Tiputusvalikko template-komponentti.
    Käytetään seuraavalla tavalla:
    <TemplateBody PropComponent={Upotettava komponentti} PropName={"luokkanimi komponentille"} PropTitle={"Otsikko tiputusvalikolle"}/>
 */

import React from 'react';
import useOpenController from "./useOpenController";
import ExpandableButton from "./ExpandableButton";

const TemplateBody = ({PropComponent, PropName, PropTitle}) => {
    const {isOpen, toggle} = useOpenController(false);

    return (
        <div className="dropdown-template">
            <div className={PropName}>
                <div className="dropdown-header">
                    <span>{PropTitle}</span>
                    <ExpandableButton isOpen={isOpen} toggle={toggle}/>
                </div>
                {isOpen && <PropComponent/>}
            </div>
        </div>
       )
}

export default TemplateBody