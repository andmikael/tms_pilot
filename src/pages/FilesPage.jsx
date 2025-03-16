/*
* Tiedostot-sivu: uusia reittejä voidaan lisätä järjestelmään excel tiedostosta.
*/ 

import { ExcelReader } from "../components/ExcelReader";
import TemplateBody from "../components/templateDropdown/TemplateBody";

const FilesPage = ({routeHandler}) => {

    return <div>
        <div className="content">Excelin lataus sivu</div>
        <TemplateBody PropComponent={ExcelReader} PropName={"excel-reader"} PropTitle={"Lisää uusi tiedosto"} PropFunc={routeHandler}/>
    </div>
};

export default FilesPage;