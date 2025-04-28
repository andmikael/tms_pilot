/**
 * routePropType defines a single route (default depots + optional depots) structure and related data;
 * route name, start location , end location etc
 * (Start and end location are not part of the routes array)
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