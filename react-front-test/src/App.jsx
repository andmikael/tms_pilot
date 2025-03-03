import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import axios from "axios";


// https://www.youtube.com/watch?v=06pWsB_hoD4
// https://stackoverflow.com/questions/71863508/cant-get-react-and-flask-cors-to-work-locally
// https://stackoverflow.com/questions/78284232/how-to-fix-cors-for-front-end-client-request-using-axios
// https://stackoverflow.com/questions/69485064/err-connection-refused-for-react-and-axios


function App() {
  const [count, setCount] = useState(0);
  const [formData, setFormData] = useState("");
  const [array, setArray] = useState([]); // sisältää datan joka vedetään backendistä

  // GET-testi, siirtää dataa backendistä fronttiin
  const getTest= async () =>{
    try {
      const response = await axios.get("http://localhost:8000/api/get_test");
      setArray(response.data.users);
      console.log(response)
    } catch (error) {
      console.error('There was an error fetching the users!', error);
    }
  };

// POST-testi, siirtää dataa frontistä bäkkäriin
  const postTest = async (e) => {
    // Headerin pitäisi auttaa CORSin kanssa
    const customHeader = { 
      headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': 'http://localhost:8000',
      'Access-Control-Allow-Methods': 'GET, OPTIONS, POST',
    },
  };

    const data = { viesti: 'testi' }

    axios.post("http://localhost:8000/post_test", 
    data, customHeader).then(
      (response) => {
          let result = response.data;
          console.log(result);
      },
      (error) => {
          console.log(error);
      }
  );

    //e.preventDefault();
    /*
    try {
      const response = await axios.post('http://localhost:8000/api/send', {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': 'http://localhost:8000',
          'Access-Control-Allow-Methods': 'GET, OPTIONS, POST',
        },
        withCredentials: false,
        test: 'test2'
      });
      console.log(response.data);
    } catch (error) {
      console.error('There was an error signing up!', error);
    }*/
  };

  function handlePostQuery(query){
      var myParams = {
          data: query
      }
      if (query != "") {
          axios.post('http://localhost:8000/api/query', myParams)
              .then(function(response){
                  console.log(response);
        //Perform action based on response
          })
          .catch(function(error){
              console.log(error);
        //Perform action based on error
          });
      } else {
          alert("The search query cannot be empty")
      }
  }
  

  //useEffect(() => {
  //  fetchAPI()
  //}, []);

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <input name="testInput" value = {formData} onChange={e => handleSubmit(e.target.value)}/>

      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>

          {
          array.map((user, index) => (
            <div key =  {index}>
            <span>{user}</span>
            <br></br>
            </div>
          ))
        }

      </div>

      <div className="get-post-test">
        <button onClick={getTest}>
          GET test
        </button>

        <button onClick={postTest}>
          POST test
        </button>

      </div>



      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
