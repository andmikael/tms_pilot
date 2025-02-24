/*
* Pääsivu (reittisuunnittelu): Voidaan tarkastella tallennettuja reittejä, lisätä noutopaikkoja niihin
* ja muodostaa reittisuunnitelmia.
*/ 

const PlanningPage = (data) => {
    
    return <div>
        <div className="content">Reittisuunnittelu sivu
            <p>Järjestelmän reitit: {JSON.stringify(data)}</p>
        </div>
    </div>
};

export default PlanningPage;