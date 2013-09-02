import requests
import math
from flask import Flask, make_response, jsonify, request, render_template

app = Flask(__name__)

@app.route("/")
def index():
    return render_template('index.html')


@app.errorhandler(404)
def not_found(error):
    return make_response(jsonify({'error': 'Not found'}), 404)

# BoundingBox implementation taken from:
# http://stackoverflow.com/questions/1648917/given-a-latitude-and-longitude-and-distance-i-want-to-find-a-bounding-box
class BoundingBox(object):
    def __init__(self, *args, **kwargs):
        self.lat_min = None
        self.lon_min = None
        self.lat_max = None
        self.lon_max = None


def get_bounding_box(latitude_in_degrees, longitude_in_degrees, half_side_in_miles):
    assert half_side_in_miles > 0
    assert latitude_in_degrees >= -180.0 and latitude_in_degrees  <= 180.0
    assert longitude_in_degrees >= -180.0 and longitude_in_degrees <= 180.0

    half_side_in_km = half_side_in_miles * 1.609344
    lat = math.radians(latitude_in_degrees)
    lon = math.radians(longitude_in_degrees)

    radius  = 6371
    # Radius of the parallel at given latitude
    parallel_radius = radius*math.cos(lat)

    lat_min = lat - half_side_in_km/radius
    lat_max = lat + half_side_in_km/radius
    lon_min = lon - half_side_in_km/parallel_radius
    lon_max = lon + half_side_in_km/parallel_radius
    rad2deg = math.degrees

    box = BoundingBox()
    box.lat_min = rad2deg(lat_min) # South
    box.lon_min = rad2deg(lon_min) # West
    box.lat_max = rad2deg(lat_max) # North
    box.lon_max = rad2deg(lon_max) # East
    
    return box


def get_nearest_locations(lat, lon, search_radius):
    print search_radius
    if search_radius > 1.0:
        return {}
    
    current_lat = lat
    current_long = lon
    current_search_radius = search_radius
    bounding_box = get_bounding_box(current_lat, current_long, current_search_radius) 
    north = str(bounding_box.lat_max)
    east = str(bounding_box.lon_min)
    south = str(bounding_box.lat_min)
    west = str(bounding_box.lon_max)

    sfdata_query_params = {
        '$where': "status_detail = 'INSTALLED' AND racks_installed > 0 AND within_box(location_column, " + north + ", " + east + ", " + south + ", " + west + ")",
        '$$app_token': 'V8dMyYl4HQevwhALJqtW6Iikz',
        '$limit': 5
    }    
    sfdata_response = requests.get('http://data.sfgov.org/resource/w969-5mn4.json', params=sfdata_query_params)
    print sfdata_response.json()
    if not sfdata_response.json():
        current_search_radius += 0.1
        return get_nearest_locations(current_lat, current_long, current_search_radius)
    else:
        return sfdata_response.json()


@app.route('/api/v1.0/directions', methods=['POST'])
def create_directions():
    if not request.json:
        abort(400)
    if not 'latitude' in request.json:
        abort(400)
    if not 'longitude' in request.json:
        abort(400)
    
    initial_search_radius = 0.1
    result = get_nearest_locations(request.json['latitude'], request.json['longitude'], initial_search_radius)
    return jsonify({'result': result})


if __name__ == "__main__":
    app.run(debug=True)