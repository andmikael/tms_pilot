from flask import Flask, jsonify, request # jsonify siirtää apin tietoja
from flask_cors import CORS, cross_origin
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
import urllib.request
import json
from dotenv import load_dotenv
import sys, os
from excelFunctionality import excel_bp

STOPPING_TIME = 10 * 60 #pysähdys kestää 10 minuuttia

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

    # Iterate over every calculated distance to find if any of them failed
    for row in response["rows"]:
        for element in row["elements"]:
            if (element["status"] == "NOT_FOUND"):
                location = origin_addresses[row["elements"].index(element)].replace("+", " ")
                raise GoogleAPIError(f"Location {location} could not be found. Check spelling and try again.")
            elif (element["status"] == "ZERO_RESULTS"):
                start = origin_addresses[response["rows"].index(row)].replace("+", " ")
                end = origin_addresses[row["elements"].index(element)].replace("+", " ")
                raise GoogleAPIError(f"No valid route could be found between {start} and {end}")
            elif (element["status"] == "MAX_ROUTE_LENGTH_EXCEEDED"):
                start = origin_addresses[response["rows"].index(row)].replace("+", " ")
                end = origin_addresses[row["elements"].index(element)].replace("+", " ")
                raise GoogleAPIError(f"The requested route between {start} and {end} was too long and could not be processed")
    
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
            duration += routing.GetArcCostForVehicle(previous_index, index, vehicle_id) + STOPPING_TIME
        vehicle_route.append(manager.IndexToNode(index))
        vehicle_routes.append(vehicle_route)
        durations.append((duration - STOPPING_TIME)/60) #Vähennetään 1x STOPPING_TIME koska viimeisessä kohteessa ei ole "pysähdystä".
    
    distances = []
    for route in vehicle_routes:
        distance = 0
        for i in range(len(route)):
            if i == 0:
                continue
            distance += distance_matrix[route[i-1]][route[i]]
        distances.append(distance/1000)

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

app.register_blueprint(excel_bp)
if __name__ == "__main__":
    app.run(debug=True, port=8000, host='0.0.0.0')