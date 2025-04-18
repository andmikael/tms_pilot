/*
 * Tiputusvalikko template-komponentti.
    Käytetään seuraavalla tavalla:
    1. jos lapsikomponentille ei tarvitse antaa funktiota argumenttina:
        <TemplateBody PropComponent={Upotettava komponentti} PropName={"luokkanimi komponentille"} PropTitle={"Otsikko tiputusvalikolle"} Expandable={true}/>
    2. jos lapsikomponentti tarvitsee funktion argumenttina, esim. halutaan palauttaa dataa omistajakomponentille:
        <TemplateBody PropComponent={Upotettava komponentti} PropName={"luokkanimi komponentille"} PropTitle={"Otsikko tiputusvalikolle"} PropFunc={funktion nimi}/>
        
    2. vaihtoehdon toiminta vaatii, että upotettavan komponentin funktioparametrin nimi on dataToParent:
        const ChildComponent = ({dataToParent}) => {
            komponentin koodi...
        }
    
    TÄREKÄÄ: dataToParent on geneerinen nimi funktiolle, joka palauttaa dataa ylemmälle komponentille
    jos funktion nimeää joksikin muuksi, syntyy TypeError virhe.

    PropFunc ja Expandable ovat valinnaisia argumentteja. Expandable argumentti muuttaa komponentin tiputusvalikoksi
 */

    import React from 'react';
    import useOpenController from "./useOpenController";
    import ExpandableButton from "./ExpandableButton";
    
    const TemplateBody = ({PropComponent, PropName, PropTitle, PropFunc=null, PropData=null, Expandable=false, ExtraProps=null}) => {
        const {isOpen, toggle} = useOpenController(true);
    
            if (PropFunc != null) {
                if (Expandable) {
                    return (
                        <div className="dropdown-template">
                            <div className={PropName}>
                                <div className="dropdown-header">
                                    <ExpandableButton isOpen={isOpen} toggle={toggle} ButtonTitle={PropTitle}/>
                                </div>
                                <div className="template-body">
                                    {isOpen && <PropComponent dataToParent={PropFunc} dataToChild={PropData} {...ExtraProps} />}
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
                                </div>
                                <div className="template-body">
                                    <PropComponent dataToParent={PropFunc} dataToChild={PropData} {...ExtraProps} />
                                </div>
                            </div>
                        </div>
                    )
                }
            } else {
                if (Expandable) {
                    return (
                        <div className="dropdown-template">
                            <div className={PropName}>
                                <div className="dropdown-header">
                                    <ExpandableButton isOpen={isOpen} toggle={toggle} ButtonTitle={PropTitle}/>
                                </div>
                                <div className="template-body">
                                    {isOpen && <PropComponent dataToChild={PropData} {...ExtraProps}/>}
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
                                </div>
                                <div className="template-body">
                                    <PropComponent dataToChild={PropData} {...ExtraProps}/>
                                </div>
                            </div>
                        </div>
                    )
                }
            }
    }
    
    export default TemplateBody