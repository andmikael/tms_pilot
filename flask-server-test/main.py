from flask import Flask, jsonify, request # jsonify siirtää apin tietoja
from flask_cors import CORS, cross_origin
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
    return data

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