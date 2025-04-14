/*
* Tiedostot-sivu: uusia reittejä voidaan lisätä järjestelmään excel tiedostosta.
*/ 

import { useState } from "react";
import { ExcelReader } from "../components/ExcelReader";
import TemplateBody from "../components/templateDropdown/TemplateBody";
import ListFiles from "../components/listFiles";

const FilesPage = ({routeHandler}) => {

  const [reloadSignal, setReloadSignal] = useState(0);
    return (
      <div className="body-container">
        <div className="content">
          <TemplateBody
            PropComponent={ExcelReader}
            PropName={"excel-reader"}
            PropTitle={"Lisää uusi tiedosto"}
            PropFunc={routeHandler}
            ExtraProps={{ setReloadSignal }}
          />

          <TemplateBody
            PropComponent={ListFiles}
            PropName={"list-files"}
            PropTitle={"Ladatut tiedostot"}
            PropFunc={routeHandler}
            ExtraProps={{ reloadSignal }}
          />
        </div>
      </div>
    );
};

export default FilesPage;