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
    
    TÄRKEÄÄ: dataToParent on geneerinen nimi funktiolle, joka palauttaa dataa ylemmälle komponentille
    jos funktion nimeää joksikin muuksi, syntyy TypeError virhe.

    PropFunc ja Expandable ovat valinnaisia argumentteja. Expandable argumentti muuttaa komponentin tiputusvalikoksi


  * Dropdown template component
    Usage:
    1. if child component does not need to be given function as argument:
        <TemplateBody PropComponent={Component to be embedde} PropName={"component class name"} PropTitle={"Dropdown header"} Expandable={true}/>
    2. if child component does need function as argument, for example if we want to return data to parent component:
        <TemplateBody PropComponent={Component to be embedded} PropName={"Component class name"} PropTitle={"Dropdown header"} PropFunc={function name}/>
        
    Option 2 requires that the function parameter name of the embedded component is dataToParent:
        const ChildComponent = ({dataToParent}) => {
            component code...
        }
    
    NOTE: dataToParent is a generic name for a function that returns data to parent component
    
    If you name the function something different, a TypeError will happen
    PropFunc and Expandable are optional arguments. The Expandable argument turns the component into a dropdown
 
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