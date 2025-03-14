import {React} from "react";

const ExpandableButton = ({isOpen, toggle }) => {
    return (
        <button onClick={toggle}>
            <span className="material-symbols-outlined" style={{
                transform:`rotate(${isOpen ? 180:0}deg)`,
                transition: "all 0.25s"
            }}>
            expand_circle_down
            </span>
        </button>
    );
};

export default ExpandableButton;