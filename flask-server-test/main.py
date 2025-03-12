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
    # Send q requests, returning max_rows rows per request.
    for i in range(q):
        origin_addresses = addresses[i * max_rows: (i + 1) * max_rows]
        response = send_request(origin_addresses, dest_addresses, API_key)
        distance_matrix += build_distance_matrix(response)

    # Get the remaining remaining r rows, if necessary.
    if r > 0:
        origin_addresses = addresses[q * max_rows: q * max_rows + r]
        response = send_request(origin_addresses, dest_addresses, API_key)
        distance_matrix += build_distance_matrix(response)
    return distance_matrix

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

def build_distance_matrix(response):
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
        row_list = [row['elements'][j]['duration']['value'] for j in range(len(row['elements']))]
        distance_matrix.append(row_list)
    return distance_matrix

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
    return data["distance_matrix"][from_node][to_node]

def route_order(list_of_addresses, starts, ends, number_of_vehicles):
    """
    Creates optimized routes for each vehicle given list of addresses to visit 
    and start and end locations for each vehicle.

    :param list_of_addresses: list, list of strings of the addresses (Voisi toimia koordinaateillakin?)
    :param starts: list, list of ints. A list of len(starts) == number_of_vehicles. List contains indexes 
    of list_of_addresses indicating the starting location for each vehicle. Start locations can be the same
    for each vehicle and can be same as end locations.
    :param ends: list, list of ints. Indexes of the end locations for each vehicle
    :param number_of_vehicles: int, Number of vehicles available.
    :return vehicle_routes_with_addresses: list, list of lists with addresses for each vehicle in optimized order
    including start and end locations even if same
    """

    #Ei välttämättä tarvitsisi tehdä dictionarya, mutta nyt se on tälleen
    data = {}
    data['addresses'] = list_of_addresses
<<<<<<< HEAD
    data['API_key'] = GOOGLE_API_KEY
=======
    data['API_key'] = ''
>>>>>>> 91dcffbdf88a30626de0df8a9b2818f736fa6808
    data['num_vehicles'] = number_of_vehicles
    data['starts'] = starts
    data['ends'] = ends
    data['distance_matrix'] = create_distance_matrix(data)
    
    manager = pywrapcp.RoutingIndexManager(len(data['distance_matrix']), data['num_vehicles'], data["starts"], data["ends"])
    routing = pywrapcp.RoutingModel(manager)
    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC)

    solution = routing.SolveWithParameters(search_parameters)
    
    vehicle_routes = []
    
    for vehicle_id in range(data["num_vehicles"]):
        vehicle_route = []
        index = routing.Start(vehicle_id)
        while not routing.IsEnd(index):
            vehicle_route.append(manager.IndexToNode(index))
            previous_index = index
            index = solution.Value(routing.NextVar(index))
        vehicle_route.append(manager.IndexToNode(index))
        vehicle_routes.append(vehicle_route)
    
    vehicle_routes_with_addresses = []
    for route in vehicle_routes:
        route_addresses = []
        for index in route:
            route_addresses.append(list_of_addresses[index])
        vehicle_routes_with_addresses.append(route_addresses)
        
    return vehicle_routes_with_addresses

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
<<<<<<< HEAD
    return jsonify(error_data), 400
=======
    
    return jsonify(error_data)
>>>>>>> 91dcffbdf88a30626de0df8a9b2818f736fa6808

@app.errorhandler(GoogleAPIError)
def handle_exception(e):
    error_data = {
        "error_message": "GoogleAPIError: " + e.message,
    }
    return jsonify(error_data), 400

#Muiden kuin itse määritettyjen exceptioneiden käsittelyä varten
<<<<<<< HEAD
# @app.errorhandler(Exception)
# def handle_exception(e):
#     error_data = {
#         "error_message": repr(e)
#     }
#     return jsonify(error_data), 400
=======
@app.errorhandler(Exception)
def handle_exception(e):
    error_data = {
        "error_message": "Exception: " + repr(e)
    }
    return jsonify(error_data)
>>>>>>> 91dcffbdf88a30626de0df8a9b2818f736fa6808

#@app.use(cors({origin: true, credentials: true}))

"""
Testi reititysta varten. Kun laitetaan postilla json muotoa {"addresses": ["Osoite1", "Osoite2", "Osoite3"]}
palauttaa jsonin jossa 'ordered_routes' kohdassa on lista reiteista optimoidussa jarjestyksessa.

Esim. {"adresses": ["Prannarintie+8+Kauhajoki", "Prannarintie+10+Kauhajoki", "Topeeka+26+Kauhajoki"], 
       "start_indexes": [0],
       "end_indexes": [0],
       "number_of_vehicles": 1}
palauttaa {"ordered_routes": [["Prannarintie+8+Kauhajoki","Topeeka+26+Kauhajoki","Prannarintie+10+Kauhajoki",
"Prannarintie+8+Kauhajoki"]]}
"""
@app.route('/api/route_test', methods =['POST', 'OPTIONS'])
@cross_origin()
def route_test():
    data = request.get_json()
    print(data)
    if data['number_of_vehicles'] < 1:
        raise DataError("number_of_vehicles < 1")
    if len(data['start_indexes']) != data['number_of_vehicles']:
        raise DataError("Length of start_indexes doesn't equal number_of_vehicles")
    if len(data['start_indexes']) != data['number_of_vehicles']:
        raise DataError("Length of end_indexes doesn't equal number_of_vehicles")
    if len(data['addresses']) < 2:
        raise DataError("Less than 2 addresses provided")


    route = route_order(data['addresses'], data['start_indexes'], data['end_indexes'], data['number_of_vehicles'])
    return_data = {}
    return_data['ordered_routes'] = route
    return jsonify(return_data)

<<<<<<< HEAD
=======

"""Alla muutama esimerkki siitä, kuinka GET- ja POST-kutsut voidaan implementoida Flaskilla
# GET
@app.route("/api/get_test", methods = ['GET', 'POST'])
@cross_origin()
def get_test():
    return jsonify(
        {
            "users": [
                'test1',
                'test2'
            ]
        }
    )

# POST
@app.route('/api/post_test', methods =['POST', 'OPTIONS'])
@cross_origin()
def post_test():
   data = request.json['viesti']
   return jsonify({"Viesti": "Flask sai Reactilta viestin: "
                                   + data})

# POST
@app.route('/api/post_test2', methods =['POST', 'OPTIONS'])
@cross_origin()
def post_test2():
    data = request.get_json()
    print(data)
    data["Moi"] = "moimoi"
    return data
"""
>>>>>>> 91dcffbdf88a30626de0df8a9b2818f736fa6808

if __name__ == "__main__":
    app.run(debug=True, port=8000)


