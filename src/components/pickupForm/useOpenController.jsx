import { useCallback, useState } from "react";

const useOpenController = (initialState) => {
    const [isOpen, setOpenState] = useState(initialState);

    const toggle = useCallback(() => {
        setOpenState((state) => !state);
    }, [setOpenState]);

    return { isOpen, toggle };
}

export default useOpenController;