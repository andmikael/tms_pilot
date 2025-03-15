/**
 * placeProptype määrittelee yhden noutopaikan rakenteen.
 */

import PropTypes from "prop-types";

const placePropType = PropTypes.shape({
  name: PropTypes.string.isRequired,
  address: PropTypes.string.isRequired,
  postalCode: PropTypes.string.isRequired,
  city: PropTypes.string.isRequired,
  standardPickup: PropTypes.oneOf(['yes', 'no']).isRequired,
  lat: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.oneOf([null])]).isRequired,
  lon: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.oneOf([null])]).isRequired,
}).isRequired;

export { placePropType };