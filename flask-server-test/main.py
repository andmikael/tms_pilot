from flask import Flask, jsonify, request # jsonify siirtää apin tietoja
from flask_cors import CORS, cross_origin
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
import urllib.request
import json
from dotenv import load_dotenv
import sys, os

load_dotenv()

GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
if not GOOGLE_API_KEY:
    raise ValueError("Google api key not found in .env file")


class DataError(Exception):
    """Exception raised for incorrect routing input data

    Attributes:
        message -- explanation of the error
    """

    def __init__(self, message):
        self.message = message
        super().__init__(self.message)

    def __str__(self):
        return f"{self.message} (Error Code: {self.error_code})"

class GoogleAPIError(Exception):
    """Exception raised for errors from google api

    Attributes:
        message -- explanation of the error
    """

    def __init__(self, message):
        self.message = message
        super().__init__(self.message)

    def __str__(self):
        return f"{self.message} (Error Code: {self.error_code})"

import os
import pandas as pd
from openpyxl import Workbook, load_workbook


def create_distance_matrix(data):
    """
    Creates distance matrix from the addresses to be used in route optimization

    :param data: dict, dictionary with list of the addresses and google api key
    :return distance_matrix: list, list of lists representing the distance matrix
    """
    addresses = data["addresses"]
    API_key = data["API_key"]
    # Distance Matrix API only accepts 100 elements per request, so get rows in multiple requests.
    max_elements = 100
    num_addresses = len(addresses)
    # Maximum number of rows that can be computed per request
    max_rows = max_elements // num_addresses
    # num_addresses = q * max_rows + r 
    q, r = divmod(num_addresses, max_rows)
    dest_addresses = addresses
    distance_matrix = []
    duration_matrix = []
    # Send q requests, returning max_rows rows per request.
    for i in range(q):
        origin_addresses = addresses[i * max_rows: (i + 1) * max_rows]
        response = send_request(origin_addresses, dest_addresses, API_key)
        distance_matrix += build_distance_matrix(response, 'distance')
        duration_matrix += build_distance_matrix(response, 'duration')

    # Get the remaining remaining r rows, if necessary.
    if r > 0:
        origin_addresses = addresses[q * max_rows: q * max_rows + r]
        response = send_request(origin_addresses, dest_addresses, API_key)
        distance_matrix += build_distance_matrix(response, 'distance')
        duration_matrix += build_distance_matrix(response, 'duration')
    return distance_matrix, duration_matrix

def send_request(origin_addresses, dest_addresses, API_key):
    """ 
    Build and send request for the given origin and destination addresses.
    
    :param origin_addresses: list, list of strings of the starting addresses
    :param dest_addresses: list, list of strings of the starting addresses
    :param API_key: string, google api key
    :return response: dict, Dictionary of the response from google api
    """
    def build_address_str(addresses):
        # Build a pipe-separated string of addresses
        address_str = ''
        for i in range(len(addresses) - 1):
            address_str += addresses[i] + '|'
        address_str += addresses[-1]
        return address_str

    request = 'https://maps.googleapis.com/maps/api/distancematrix/json?units=metric'
    origin_address_str = build_address_str(origin_addresses)
    dest_address_str = build_address_str(dest_addresses)
    request = request + '&origins=' + origin_address_str + '&destinations=' + \
                       dest_address_str + '&key=' + API_key
    jsonResult = urllib.request.urlopen(request).read()
    response = json.loads(jsonResult)

    if 'error_message' in response:
        raise GoogleAPIError("Error from google API: " + response['error_message'])
    #print("response: " + str(response), file=sys.stderr)

    # Iterate over every calculated distance to find if any of them failed
    for row in response["rows"]:
        for element in row["elements"]:
            if (element["status"] == "NOT_FOUND"):
                raise GoogleAPIError("One of the locations could not be found. Check spelling and try again")
            elif (element["status"] == "ZERO_RESULTS"):
                raise GoogleAPIError("No valid route could be found to one or more of these places")
            elif (element["status"] == "MAX_ROUTE_LENGTH_EXCEEDED"):
                raise GoogleAPIError("The requested route was too long and could not be processed")

    """
    Jos osoitetta ei löydy google apilla on '' sen tilalla response['destination_addresses']
    ja response['destination_addresses'] listoissa
    """
    if '' in response['destination_addresses']:
        i = 0
        for address in response['destination_addresses']:
            if address == '':
                break
            i += 1
        raise GoogleAPIError("Address not found: " + origin_addresses[i])

    return response

def build_distance_matrix(response, return_type):
    """
    Processes the google api responses to create the distance matrix for optimization

    :param response: dict, dictionary of the response from google api
    :return distance_matrix: list, list of lists representing the distance matrix
    """
    distance_matrix = []
    for row in response['rows']:
        """
        'duration' gives travel time between places in seconds, Change to 
        'distance' to get distance between places in meters
        """
        row_list = [row['elements'][j][return_type]['value'] for j in range(len(row['elements']))]
        distance_matrix.append(row_list)
    return distance_matrix

# def distance_callback(from_index, to_index):
#     """
#     Returns the distance between the two nodes.

#     :param from_index: int, 
#     :param to_index: int, 
#     :return data["distance_matrix"][from_node][to_node]: int, time in seconds or distance in meters
#     """
#     # Convert from routing variable Index to distance matrix NodeIndex.
#     from_node = manager.IndexToNode(from_index)
#     to_node = manager.IndexToNode(to_index)
#     return data["distance_matrix"][from_node][to_node]

def route_order(list_of_addresses, starts, ends, number_of_vehicles, traffic_mode, forced_visits = []):
    """
    Creates optimized routes for each vehicle given list of addresses to visit 
    and start and end locations for each vehicle.

    :param list_of_addresses: list, list of strings of the addresses (Voisi toimia koordinaateillakin?)
    :param starts: list, list of ints. A list of len(starts) == number_of_vehicles. List contains indexes 
    of list_of_addresses indicating the starting location for each vehicle. Start locations can be the same
    for each vehicle and can be same as end locations.
    :param ends: list, list of ints. Indexes of the end locations for each vehicle
    :param number_of_vehicles: int, Number of vehicles available.
    :param forced_visits: list, list of lists with indexes of the addresses given vehicle must visit
    :return vehicle_routes_with_addresses: list, list of lists with addresses for each vehicle in optimized order
    including start and end locations even if same
    """

    #Ei välttämättä tarvitsisi tehdä dictionarya, mutta nyt se on tälleen
    data = {}
    data['addresses'] = list_of_addresses
    data['API_key'] = GOOGLE_API_KEY
    data['num_vehicles'] = number_of_vehicles
    data['starts'] = starts
    data['ends'] = ends
    data['traffic_mode'] = traffic_mode
    #data['distance_matrix'] = create_distance_matrix(data)
    distance_matrix, duration_matrix = create_distance_matrix(data)
    data['distance_matrix'] = distance_matrix
    data['duration_matrix'] = duration_matrix
    
    print(data['distance_matrix'])

    manager = pywrapcp.RoutingIndexManager(len(data['duration_matrix']), data['num_vehicles'], data["starts"], data["ends"])

    routing = pywrapcp.RoutingModel(manager)

    def distance_callback(from_index, to_index):
        """
        Returns the distance between the two nodes.

        :param from_index: int, 
        :param to_index: int, 
        :return data["distance_matrix"][from_node][to_node]: int, time in seconds or distance in meters
        """
        # Convert from routing variable Index to distance matrix NodeIndex.
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return data["duration_matrix"][from_node][to_node]

    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    if len(forced_visits) > 0:
        
        vehicle_number = 0
        
        for forced_visit_indexes in forced_visits:
            
            for index in forced_visit_indexes:
                
                routing.SetAllowedVehiclesForIndex([vehicle_number], index)
            
            vehicle_number += 1

    """
    Vaikka ajoneuvojen reittien pituutta ei ole varsinaisesti rajoitettu optimointi
    ei tunnu toimivan ilman, että distance dimension on määritetty.
    """
    dimension_name = "Distance"
    routing.AddDimension(
        transit_callback_index,
        0,  # no slack
        
        100000000,  #vehicle maximum travel distance (Valittu satunnainen iso luku)
        True,  # start cumul to zero
        dimension_name,
    )
    distance_dimension = routing.GetDimensionOrDie(dimension_name)
    distance_dimension.SetGlobalSpanCostCoefficient(100)

    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    #search_parameters.first_solution_strategy = (routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC)
    search_parameters.first_solution_strategy = (routing_enums_pb2.FirstSolutionStrategy.GLOBAL_CHEAPEST_ARC)

    solution = routing.SolveWithParameters(search_parameters)
    
    vehicle_routes = []
    durations = []
    
    for vehicle_id in range(data["num_vehicles"]):
        vehicle_route = []
        index = routing.Start(vehicle_id)
        duration = 0
        while not routing.IsEnd(index):
            vehicle_route.append(manager.IndexToNode(index))
            previous_index = index
            index = solution.Value(routing.NextVar(index))
            duration += routing.GetArcCostForVehicle(previous_index, index, vehicle_id)
        vehicle_route.append(manager.IndexToNode(index))
        vehicle_routes.append(vehicle_route)
        durations.append(duration)
    
    distances = []
    for route in vehicle_routes:
        distance = 0
        for i in range(len(route)):
            if i == 0:
                continue
            distance += distance_matrix[route[i-1]][route[i]]
        distances.append(distance)

    #Muutetaan takaisin osoitteiksi. Voisi palauttaa listat indekseistäkin?
    vehicle_routes_with_addresses = []
    for route in vehicle_routes:
        route_addresses = []
        for index in route:
            route_addresses.append(list_of_addresses[index])
        vehicle_routes_with_addresses.append(route_addresses)
        
    return vehicle_routes_with_addresses, durations, distances

app = Flask(__name__) # luo app-instanssin
app.config['CORS_HEADERS'] = 'Content-Type'
cors = CORS(app, origins='*')

#@app.errorhandler(Exception)
#def handle_bad_request(e):
#    return 'bad request!', 400

@app.errorhandler(DataError)
def handle_exception(e):
    error_data = {
        "error_message": "DataError: " + e.message,
    }
    return jsonify(error_data), 400

@app.errorhandler(GoogleAPIError)
def handle_exception(e):
    error_data = {
        "error_message": "GoogleAPIError: " + e.message,
    }
    return jsonify(error_data), 400

#Muiden kuin itse määritettyjen exceptioneiden käsittelyä varten
@app.errorhandler(Exception)
def handle_exception(e):
    error_data = {
        "error_message": "Exception: " + repr(e)
    }
    return jsonify(error_data), 400

#@app.use(cors({origin: true, credentials: true}))

"""
Testi reititysta varten. Kun laitetaan postilla json muotoa {"addresses": ["Osoite1", "Osoite2", "Osoite3"]}
palauttaa jsonin jossa 'ordered_routes' kohdassa on lista reiteista optimoidussa jarjestyksessa.

Esim. {"addresses": ["Prannarintie+8+Kauhajoki", "Prannarintie+10+Kauhajoki", "Topeeka+26+Kauhajoki"], 
       "start_indexes": [0],
       "end_indexes": [0],
       "must_visit": [[]],
       "number_of_vehicles": 1}
palauttaa {"ordered_routes": [["Prannarintie+8+Kauhajoki","Topeeka+26+Kauhajoki","Prannarintie+10+Kauhajoki",
"Prannarintie+8+Kauhajoki"]]}
"""
@app.route('/api/route_test', methods =['POST', 'OPTIONS'])
@cross_origin()
def route_test():
    data = request.get_json()
    #print(data)
    if data['number_of_vehicles'] < 1:
        raise DataError("number_of_vehicles < 1")
    if len(data['start_indexes']) != data['number_of_vehicles']:
        raise DataError("Length of start_indexes doesn't equal number_of_vehicles")
    if len(data['end_indexes']) != data['number_of_vehicles']:
        raise DataError("Length of end_indexes doesn't equal number_of_vehicles")
    if len(data['must_visit']) > 0 and len(data['must_visit']) != data['number_of_vehicles']:
        raise DataError("If must_visit locations are defined, the length of must_visit must equal number_of_vehicles")    
    if len(data['addresses']) < 2:
        raise DataError("Less than 2 addresses provided")
    if ((data['traffic_mode'] != 'best_guess') and (data['traffic_mode'] != 'optimistic') and (data['traffic_mode'] != 'pessimistic')):
        raise DataError("Invalid traffic mode (must be 'best_guess', 'optimistic' or 'pessimistic'")

    routes, durations, distances = route_order(data['addresses'], data['start_indexes'], data['end_indexes'], data['number_of_vehicles'], data['traffic_mode']  , data['must_visit'])
    return_data = {}
    return_data['ordered_routes'] = routes
    return_data['durations'] = durations
    return_data['distances'] = distances
    return jsonify(return_data)


@app.route('/upload', methods=['POST'])
@cross_origin()
def upload_excel():
    # Vastaanotetaan JSON-datan sisältö
    data = request.get_json()
    route_name = data.get("routeName", "Uusi_reitti")
    excel_data = data.get("data", [])
    
    # Luodaan uusi Excel-työkirja ja aktiivinen taulukko
    wb = Workbook()
    ws = wb.active
    ws.title = "Luetut paikat"
    
    # Kirjoitetaan reitin nimi (voit muokata tätä tarpeen mukaan)
    ws["A1"] = "Reitin nimi:"
    ws["B1"] = route_name
    
    # Lisätään otsikkorivi
    header = ["Nimi", "Osoite", "Postinumero", "Kaupunki", "Vakionouto", "Lat", "Lon"]
    ws.append(header)
    
    # Lisätään Excel-data rivittäin
    for item in excel_data:
        ws.append([
            item.get("name"),
            item.get("address"),
            item.get("postalCode"),
            item.get("city"),
            item.get("standardPickup"),
            item.get("lat"),
            item.get("lon")
        ])
    
    # Määritetään tallennuskansio
    save_dir = os.path.join(".secret", "ExcelFiles")
    if not os.path.exists(save_dir):
        os.makedirs(save_dir, exist_ok=True)
    
    file_path = os.path.join(save_dir, f"{route_name}.xlsx")
    
    try:
        wb.save(file_path)
        return jsonify({"message": "Tiedosto tallennettu onnistuneesti", "file_path": file_path}), 200
    except Exception as e:
        return jsonify({"error": True, "message": f"Tiedoston tallennus epäonnistui: {e}"}), 500

@app.route('/api/get_excel_jsons', methods=['GET'])
@cross_origin()
def get_excel_jsons():
    folder = os.path.join(".secret", "ExcelFiles")
    excel_jsons = {}
    
    if os.path.exists(folder):
        for file_name in os.listdir(folder):
            if file_name.endswith(".xlsx"):
                file_path = os.path.join(folder, file_name)
                try:
                    df = pd.read_excel(file_path, header=1)
                    
                    mapping = {
                        "Nimi": "name",
                        "Testi": "address",
                        "Unnamed: 2": "postalCode",
                        "Unnamed: 3": "city",
                        "Unnamed: 4": "standardPickup",
                        "Unnamed: 5": "lat",
                        "Unnamed: 6": "lon"
                    }
                    df.rename(columns=mapping, inplace=True)
                    
                    
                    if "standardPickup" in df.columns:
                        df["standardPickup"] = df["standardPickup"].apply(
                            lambda x: "yes" if str(x).strip().lower() == "x" else "no"
                        )
                    
                    records = df.to_dict(orient="records")
                    
                    base_name = os.path.splitext(file_name)[0]
                    excel_jsons[base_name] = records
                except Exception as e:
                    print(f"Virhe tiedostoa {file_name} lukiessa: {e}")
                    base_name = os.path.splitext(file_name)[0]
                    excel_jsons[base_name] = {"error": str(e)}
    else:
        return jsonify({"error": "Kansiota ei löydy"}), 404
    print(jsonify(excel_jsons))
    return jsonify(excel_jsons)

@app.route('/api/delete_excel', methods=['DELETE'])
@cross_origin()
def delete_excel():
    data = request.get_json()
    file_name = data.get("file_name")
    if not file_name:
        return jsonify({"error": "file_name not provided"}), 400

    if not file_name.endswith(".xlsx"):
        file_name_full = file_name + ".xlsx"
    else:
        file_name_full = file_name

    folder = os.path.join(".secret", "ExcelFiles")
    file_path = os.path.join(folder, file_name_full)
    
    if not os.path.exists(file_path):
        return jsonify({"error": "Tiedostoa ei löytynyt"}), 404

    try:
        os.remove(file_path)
        return jsonify({"message": "Tiedosto poistettu onnistuneesti", "file_name": file_name_full}), 200
    except Exception as e:
        return jsonify({"error": True, "message": f"Tiedoston poisto epäonnistui: {e}"}), 500

if __name__ == "__main__":
    app.run(debug=True, port=8000, host='0.0.0.0')


