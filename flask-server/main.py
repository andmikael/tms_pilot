from flask import Flask, jsonify, request # jsonify siirtää apin tietoja
from flask_cors import CORS, cross_origin
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
import json
from dotenv import load_dotenv
import os
from excelFunctionality import excel_bp
import requests


STOPPING_TIME = 10 * 60 # Vehicles stop at depots for 10 minutes
load_dotenv()
OPENROUTESERVICE_API_KEY = os.getenv('ORS_API_KEY')

if not OPENROUTESERVICE_API_KEY:
    raise ValueError("OpenRouteService api key not found in .env file")

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

class orsAPIError(Exception):
    """Exception raised for errors from google api

    Attributes:
        message -- explanation of the error
    """

    def __init__(self, message):
        self.message = message
        super().__init__(self.message)

    def __str__(self):
        return f"{self.message} (Error Code: {self.error_code})"



def create_distance_matrix_ors(data):
    body = {"locations":data["addresses"],"metrics":["duration","distance"]}
    headers = {
        'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
        'Authorization': OPENROUTESERVICE_API_KEY,
        'Content-Type': 'application/json; charset=utf-8'
    }
    call = requests.post('https://api.openrouteservice.org/v2/matrix/driving-car', json=body, headers=headers)

    call_json = json.loads(call.text)

    if 'error' in call_json:
        if 'Access to this API has been disallowed' in call_json['error']:
            raise orsAPIError("Error from OpenRouteService api: " + call_json['error'] + 
            ", API key might be incorrect")
        else:
            raise orsAPIError("Error from OpenRouteService api: " + call_json['error'])

    # ORS API returns distances and times as floats, transform them into ints for OR-tools
    distance_matrix = [[int(distance) for distance in row] for row in call_json["distances"]]
    duration_matrix = [[int(duration) for duration in row] for row in call_json["durations"]]

    return distance_matrix, duration_matrix

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

def route_order(list_of_addresses, starts, ends, number_of_vehicles, forced_visits = []):
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
    data['API_key'] = OPENROUTESERVICE_API_KEY
    data['num_vehicles'] = number_of_vehicles
    data['starts'] = starts
    data['ends'] = ends

    distance_matrix, duration_matrix = create_distance_matrix_ors(data)
    data['distance_matrix'] = distance_matrix
    data['duration_matrix'] = duration_matrix
    
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

    # Transform indices from route reference format to internal format used by routing
    if len(forced_visits) > 0:
        vehicle_number = 0
        for forced_visit_indexes in forced_visits:
            for index in forced_visit_indexes:
                
                routing.SetAllowedVehiclesForIndex([vehicle_number], manager.NodeToIndex(index))
            vehicle_number += 1

    """
    Distance dimension must be defined for routing, even though the distances of individual vehicles are not limited
    """
    dimension_name = "Distance"
    routing.AddDimension(
        transit_callback_index,
        0,  # no slack
        1000000,  #vehicle maximum travel distance (large number chosen at random))
        True,  # start cumul to zero
        dimension_name,
    )
    distance_dimension = routing.GetDimensionOrDie(dimension_name)
    distance_dimension.SetGlobalSpanCostCoefficient(100)

    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    #search_parameters.first_solution_strategy = (routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC)
    search_parameters.first_solution_strategy = (routing_enums_pb2.FirstSolutionStrategy.AUTOMATIC)


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
        durations.append((duration - STOPPING_TIME)/60) #Subtract 1x STOPPING_TIME because there is no stop at the last depot
    
    distances = []
    for route in vehicle_routes:
        distance = 0
        for i in range(len(route)):
            if i == 0:
                continue
            distance += distance_matrix[route[i-1]][route[i]]
        distances.append(distance/1000)

    #Transform optimized route from indexes into addresses
    vehicle_routes_with_addresses = []
    for route in vehicle_routes:
        route_addresses = []
        for index in route:
            route_addresses.append(list_of_addresses[index])
        vehicle_routes_with_addresses.append(route_addresses)
        
    return vehicle_routes_with_addresses, durations, distances

app = Flask(__name__) # create app isntance
app.config['CORS_HEADERS'] = 'Content-Type'
cors = CORS(app, origins='*')

@app.errorhandler(DataError)
def handle_exception(e):
    error_data = {
        "error_message": "DataError: " + e.message,
    }
    return jsonify(error_data), 400

#Muiden kuin itse määritettyjen exceptioneiden käsittelyä varten
@app.errorhandler(Exception)
def handle_exception(e):

    if isinstance(e, requests.exceptions.ConnectionError):
        error_data = {
        "error_message": "ConnectionError: " + repr(e) + ", Check internet connection"
        }
        return jsonify(error_data), 400


    error_data = {
        "error_message": "Exception: " + repr(e)
    }
    return jsonify(error_data), 400

"""
    Main function for routing tasks. 

    - Input JSON is checked for valid date, then route_order is called to handle the actual routing task.

    :return: JSON response indicating success or failure
"""
@app.route('/api/routing', methods =['POST'])
@cross_origin()
def routing():
    data = request.get_json()
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

    routes, durations, distances = route_order(data['addresses'], data['start_indexes'], data['end_indexes'], data['number_of_vehicles'], data['must_visit'])
    return_data = {}
    return_data['ordered_routes'] = routes
    return_data['durations'] = durations
    return_data['distances'] = distances
    return jsonify(return_data), 200


"""
    Updates the VITE_ROUTE_KM_PRICE value in the .env file.

    - If the .env file does not exist, it is created.
    - If the VITE_ROUTE_KM_PRICE line is missing, it is added.
    - If the line exists, it is updated with the new value.

    :return: JSON response indicating success or failure
"""
@app.route('/api/update_km_price', methods=['POST', 'OPTIONS'])
@cross_origin()
def update_km_price():
    data = request.get_json()
    new_price = data.get('price')

    if new_price is None:
        return jsonify({'success': False, 'message': 'Hinta puuttuu.'}), 400

    root_dir = os.path.abspath(os.path.join(os.getcwd(), '..'))
    env_path = os.path.join(root_dir, '.env')

    try:
        if not os.path.exists(env_path):
            with open(env_path, 'w') as f:
                f.write(f"VITE_ROUTE_KM_PRICE={new_price}\n")
            return jsonify({'success': True})

        with open(env_path, 'r') as f:
            lines = f.readlines()

        found = False
        with open(env_path, 'w') as f:
            for line in lines:
                if line.startswith("VITE_ROUTE_KM_PRICE="):
                    f.write(f"VITE_ROUTE_KM_PRICE={new_price}\n")
                    found = True
                else:
                    f.write(line)

            if not found:
                if lines and not lines[-1].endswith('\n'):
                    f.write('\n')
                f.write(f"VITE_ROUTE_KM_PRICE={new_price}\n")

        return jsonify({'success': True}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


app.register_blueprint(excel_bp)
if __name__ == "__main__":
    app.run(debug=True, port=8000, host='0.0.0.0')