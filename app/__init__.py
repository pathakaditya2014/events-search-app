from flask import Flask, jsonify, render_template, request
import requests as rq
from yarl import URL # type: ignore
from .scraper import scrape_events

app = Flask(__name__)



@app.get("/")
def index():
    return render_template('index.html')


@app.get("/events")
def get_events():
    query = request.args.get('query', default=None)
    if not query:
        return jsonify(error="Query not given"), 400
    elif len(query.split(",")) != 2:
        return jsonify(error="Query must be of specified format"), 400
    
    city = query.split(",")[0].strip()
    if not city:
        return jsonify(error="City not given"), 400
    
    country = query.split(",")[1].strip()
    if not country:
        return jsonify(error="Country not given"), 400
    
    url = "https://api.thecompaniesapi.com/v2/locations/cities"

    flag = False

    res = rq.get(url, params={'size': 5,'search': city})
    data = res.json()
    for c in data['cities']:
        if c['name'].lower() == city.lower() and c['country']['name'].lower() == country.lower():
            flag = True
            break
        
    if not flag:
        city, country = country, city
        
        res = rq.get(url, params={'size': 5,'search': city})
        data = res.json()
        for c in data['cities']:
            if c['name'].lower() == city.lower() and c['country']['name'].lower() == country.lower():
                flag = True
                break
    
    if not flag:
        return jsonify(error="City/Country not found"), 404
    
    params = {
        'page': request.args.get('page', default=1),
    }
    return scrape_events(city=city, country=country, params=params)
    


@app.post('/get_tickets')
def get_tickets():
    if "email" not in request.form:
        return jsonify(error="Email not received"), 400
    if "tag" not in request.form:
        return jsonify(error="Event Tag not received"), 400
    
    email = request.form['email'].strip()
    if len(email) == 0:
        return jsonify(error="Email not received"), 400
        
    tag = request.form['tag'].strip()
    if len(tag) == 0:
        return jsonify(error="Event Tag not received"), 400

    event_url = str(URL("https://www.eventbrite.com/e") / tag)
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36"
    }

    if rq.get(event_url, headers=headers).status_code != 200:
        return jsonify(error="Invalid Event Tag"), 400
    
    ###
    print(email)

    return jsonify(success="Got Email", next=event_url), 200



@app.get("/cities")
def test():
    query_string = request.args.get("q", default=None)
    if not query_string:
        return jsonify(error="Input not received"), 400
    else:
        query_string = query_string.strip()
        city = query_string.split(",")[0].lower().strip()
    
    url = "https://api.thecompaniesapi.com/v2/locations/cities"

    res = rq.get(url, params={'size': 5,'search': city})
    data = res.json()

    cities = []
    for c in data['cities']:
        temp = f"{c['name']}, {c['country']['name']}"
        if temp == query_string:
            return jsonify(cities=[]), 200
        
        cities.append(temp)

    return jsonify(cities=cities), 200

if __name__ == '__main__':
    app.run(debug=True)
