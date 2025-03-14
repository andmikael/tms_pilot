/*
 * Tiputusvalikko template-komponentti.
    Käytetään seuraavalla tavalla:
    1. jos lapsikomponentille ei tarvitse antaa funktiota argumenttina:
        <TemplateBody PropComponent={Upotettava komponentti} PropName={"luokkanimi komponentille"} PropTitle={"Otsikko tiputusvalikolle"}/>
    2. jos lapsikomponentti tarvitsee funktion argumenttina, esim. halutaan palauttaa dataa omistajakomponentille:
        <TemplateBody PropComponent={Upotettava komponentti} PropName={"luokkanimi komponentille"} PropTitle={"Otsikko tiputusvalikolle"} PropFunc={funktion nimi}/>
        
    2. vaihtoehdon toiminta vaatii, että upotettavan komponentin funktioparametrin nimi on args:
        const Component = ({args}) => {
            
        }
 */

import React from 'react';
import useOpenController from "./useOpenController";
import ExpandableButton from "./ExpandableButton";

const TemplateBody = ({PropComponent, PropName, PropTitle, PropFunc=null}) => {
    const {isOpen, toggle} = useOpenController(false);

    if (PropFunc != null) {
        return (
            <div className="dropdown-template">
                <div className={PropName}>
                    <div className="dropdown-header">
                        <span>{PropTitle}</span>
                        <ExpandableButton isOpen={isOpen} toggle={toggle}/>
                    </div>
                    <div className="template-body">
                        {isOpen && <PropComponent args={PropFunc}/>}
                    </div>
                </div>
            </div>
        )
    } else {
        return (
            <div className="dropdown-template">
                <div className={PropName}>
                    <div className="dropdown-header">
                        <span>{PropTitle}</span>
                        <ExpandableButton isOpen={isOpen} toggle={toggle}/>
                    </div>
                    <div className="template-body">
                        {isOpen && <PropComponent />}
                    </div>
                </div>
            </div>
        )
    }
}

export default TemplateBody