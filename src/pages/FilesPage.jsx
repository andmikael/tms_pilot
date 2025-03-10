/*
* Tiedostot-sivu: uusia reittejä voidaan lisätä järjestelmään excel tiedostosta.
*/ 

import { ExcelReader } from "../components/ExcelReader";

const FilesPage = ({routeHandler}) => {

    return <div>
        <div className="content">Excelin lataus sivu</div>
        <ExcelReader routeHandler={routeHandler}></ExcelReader>
    </div>
};

export default FilesPage;