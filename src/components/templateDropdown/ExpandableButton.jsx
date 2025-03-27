import React from "react";

const ExpandableButton = ({isOpen, toggle, ButtonTitle }) => {
    return (
        <button onClick={toggle}>
            <span className="button-title">{ButtonTitle}</span>
            <span className="material-symbols-outlined" style={{
                transform:`rotate(${isOpen ? 180:0}deg)`,
                transition: "all 0.25s"
            }}>
            expand_more
            </span>
        </button>
    );
};

export default ExpandableButton;