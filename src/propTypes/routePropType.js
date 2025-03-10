/**
 * routePropType määrittelee yhden reitin (vakionoudot + vaihtoehtoiset noudot) rakenteen
 * ja siihen liittyvät tiedot, kuten reitin nimen, aloituspaikan jne.
 */

import PropTypes from "prop-types";
import { placePropType } from "./placePropType";

const routePropType = PropTypes.shape({
    name: PropTypes.string.isRequired,
    startPlace: placePropType.isRequired,
    endPlace: placePropType.isRequired,
    startTime: PropTypes.string.isRequired,
    endTime: PropTypes.string.isRequired,
    routes: PropTypes.arrayOf(placePropType),
}).isRequired;

export { routePropType };