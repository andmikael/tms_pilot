/*
    Lists all routes under whitch file they were uploaded. User can delete all routes from specific uploaded file
*/

import React, { useState, useEffect } from 'react';
import { Trash2, ChevronUp, ChevronDown } from 'lucide-react';

const ListFiles = ({ reloadSignal }) => {
    const [cellsData, setCellsData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openGroups, setOpenGroups] = useState({});
    const [errorMessage, setErrorMessage] = useState(null);

    useEffect(() => {
        const fetchCellsData = async () => {
            try {
                const response = await fetch("http://localhost:8000/api/get_original_names");
                if (!response.ok) throw new Error("Alkuperäisten tiedostojen haku epäonnistui");
                    const data = await response.json();
                    setCellsData(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchCellsData();
    }, [reloadSignal]);

    const groups = {};
  for (const [fileKey, cell] of Object.entries(cellsData)) {
    const c1 = cell.C1 || 'Tuntematon';
    const filename = fileKey.replace('.xlsx', '');
    if (!groups[c1]) {
      groups[c1] = { d1: cell.D1, files: new Set() };
    }
    groups[c1].files.add(filename);
  }

  const groupArray = Object.entries(groups).map(([c1, group]) => ({
    c1,
    d1: group.d1,
    files: Array.from(group.files),
  }));

  const toggleGroup = (groupKey) => {
    setOpenGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const handleDelete = async (groupKey) => {
  
    try {
      const response = await fetch("http://localhost:8000/api/delete_by_group", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ c1: groupKey })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        setErrorMessage(`Virhe poistossa: ${errorData.message || "Tuntematon virhe"}`);
        return;
      }
  
      const result = await response.json();
  
      setCellsData(prevData => {
        const newData = {};
        for (const [fileKey, cell] of Object.entries(prevData)) {
          if (String(cell.C1) !== String(groupKey)) {
            newData[fileKey] = cell;
          }
        }
        return newData;
      });
  
    } catch (err) {
      setErrorMessage(`Poistopyyntö epäonnistui: ${err.message}`);
    }
  };

  //if (loading) return <div>Ladataan...</div>;
  if (error) return <div>Virhe: {error}</div>;

  return (
    <div className="listContainer">
      {groupArray.length === 0 ? (
        <p>Ei ladattuja tiedostoja.</p>
      ) : (
        groupArray.map((group, index) => {
          const isOpen = openGroups[group.c1] || false;
          return (
            <div key={index} className="itemRow">
              <div className="rowTop">
                <button
                  onClick={() => toggleGroup(group.c1)}
                  className="collapseButton"
                  aria-label="Toggle details"
                >
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                <div className="groupInfo">
                  <div className="fileName">{group.c1}</div>
                  <div className="fileDate">{group.d1 || '–'}</div>
                </div>
                <div className="actions">
                  <button onClick={() => handleDelete(group.c1)} className="point-remove-btn" aria-label="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="expandedList">
                  {group.files.map((file, idx) => (
                    <div key={idx} className="expandedItem">
                      {file.split('(')[0]}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
      {errorMessage && <div className="warning-text">{errorMessage}</div>}
    </div>
  );
};

export default ListFiles;
