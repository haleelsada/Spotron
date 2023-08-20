from flask import Flask, request, jsonify, render_template, redirect, url_for
import spotter


app = Flask(_name_)



@app.route('/')
def landing_page():
    return 'landing'



@app.route('/map')
def map():
    return render_template('map.html')



@app.route('/api/add_locations', methods=['POST'])
def add_locations():
    data = request.get_json()
    locations = data.get('locations', [])


    # You can process the received locations array here
    # For now, let's just print it
    print(locations)


    # fetch the details of business from user
    details = locations[-1]



    rank, similar_businesses = spotter.spotter(
        typ=details['ctype'], city=details['cloc'], locations=locations[:-1])
    print(rank)
    response_data = {'rank': rank,
                     'locations': locations[:-1], 'details': details}
    return jsonify(response_data)



if _name_ == '_main_':
    app.run(debug=True)