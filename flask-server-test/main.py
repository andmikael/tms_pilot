from flask import Flask, jsonify, request # jsonify siirtää apin tietoja
from flask_cors import CORS, cross_origin
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
import urllib.request
import json

def create_distance_matrix(data):
    addresses = data["addresses"]
    API_key = data["API_key"]
    # Distance Matrix API only accepts 100 elements per request, so get rows in multiple requests.
    max_elements = 100
    num_addresses = len(addresses) # 16 in this example.
    # Maximum number of rows that can be computed per request (6 in this example).
    max_rows = max_elements // num_addresses
    # num_addresses = q * max_rows + r (q = 2 and r = 4 in this example).
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
    """ Build and send request for the given origin and destination addresses."""
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
    #print(response)
    return response

def build_distance_matrix(response):
    distance_matrix = []
    for row in response['rows']:
        row_list = [row['elements'][j]['duration']['value'] for j in range(len(row['elements']))]
        distance_matrix.append(row_list)
    return distance_matrix

def distance_callback(from_index, to_index):
    """Returns the distance between the two nodes."""
    # Convert from routing variable Index to distance matrix NodeIndex.
    from_node = manager.IndexToNode(from_index)
    to_node = manager.IndexToNode(to_index)
    return data["distance_matrix"][from_node][to_node]

def route_order(list_of_addresses, starts, ends, number_of_vehicles):
    
    data = {}
    data['addresses'] = list_of_addresses
    data['API_key'] = 'AIzaSyBZIR9byPxe-ZC3o8Ntu7zv4BmfJ8doPJg' #RAINERIN OMA!!!
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
    
    vehicle_route_with_addresses = []
    for route in vehicle_routes:
        route_addresses = []
        for index in route:
            route_addresses.append(list_of_addresses[index])
        vehicle_route_with_addresses.append(route_addresses)
        
    return vehicle_route_with_addresses

app = Flask(__name__) # luo app-instanssin
app.config['CORS_HEADERS'] = 'Content-Type'
cors = CORS(app, origins='*')
#@app.use(cors({origin: true, credentials: true}))


# https://stackoverflow.com/questions/45980173/react-axios-network-error

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


@app.route('/api/post_test', methods =['POST', 'OPTIONS'])
@cross_origin()
def post_test():
   data = request.json['viesti']
   return jsonify({"Viesti": "Flask sai Reactilta viestin: "
                                   + data})


@app.route('/api/post_test2', methods =['POST', 'OPTIONS'])
@cross_origin()
def post_test2():
    data = request.get_json()
    print(data)
    data["Moi"] = "moimoi"
    return data

"""
Testi reititysta varten. Kun laitetaan postilla json muotoa {"adresses": ["Osoite1", "Osoite2", "Osoite3"]}
palauttaa listan reiteista optimoidussa jarjestyksessa.

Nyt lahtopiste ja lopetus ovat aina ensimmaisen indeksin osoite ja kaytossa vain 1 auto

Ripuliltahan tama koodi viela nayttaa, mutta vaikuttaisi kuitenkin toimivan.

Esim. {"adresses": ["Prannarintie+8+Kauhajoki", "Prannarintie+10+Kauhajoki", "Topeeka+26+Kauhajoki"]}
palauttaa [["Prannarintie+8+Kauhajoki","Topeeka+26+Kauhajoki","Prannarintie+10+Kauhajoki","Prannarintie+8+Kauhajoki"]]
"""
@app.route('/api/route_test', methods =['POST', 'OPTIONS'])
@cross_origin()
def route_test():
    data = request.get_json()
    print(data)
    route = route_order(data['adresses'], [0], [0], 1)


    return route

"""

@app.route("/api/send", methods = ['POST']) 
def send():
    request_data = request.get_json(force=True)
    return {"201": request_data['content']}

@app.route('/api/query', methods = ['POST'])
def get_query_from_react():
    data = request.get_json()
    print(data)
    return data
"""

if __name__ == "__main__":
    app.run(debug=True, port=8000)