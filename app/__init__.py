from flask import Flask, jsonify, render_template, request
from flask_mail import Mail, Message
import requests as rq
from yarl import URL
from .scraper import scrape_events
import os, random
from redis import StrictRedis as Redis
from dotenv import load_dotenv

load_dotenv()


    
REDIS_URL = os.getenv("REDIS_URL")
if not REDIS_URL:
    raise ValueError("REDIS_URL not set in env.")
    
MAIL_USERNAME = os.getenv("MAIL_USERNAME")
if not MAIL_USERNAME:
    raise ValueError("MAIL_USERNAME not set in env.")
    
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
if not MAIL_PASSWORD:
    raise ValueError("MAIL_PASSWORD not set in env.")
    
MAIL_DEFAULT_SENDER = os.getenv("MAIL_DEFAULT_SENDER")
if not MAIL_DEFAULT_SENDER:
    raise ValueError("MAIL_DEFAULT_SENDER not set in env.")


redis = Redis.from_url(REDIS_URL, decode_responses=True)



app = Flask(__name__)


app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587 
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USE_SSL'] = False
app.config['MAIL_USERNAME'] = MAIL_USERNAME
app.config['MAIL_PASSWORD'] = MAIL_PASSWORD
app.config['MAIL_DEFAULT_SENDER'] = MAIL_DEFAULT_SENDER

mail = Mail(app)


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
    

@app.post("/send_otp")
def send_otp():
    if "email" not in request.form:
        return jsonify(error="Email not received"), 400
    
    email = request.form['email'].strip()
    if len(email) == 0:
        return jsonify(error="Email not received"), 400
    
    otp = random.randint(100000, 999999)

    msg = Message("Events Search App - Email Verification", recipients=[email])
    msg.html = f"""
        <p>Your Email verification OTP is <strong><u>{otp}</u></strong>. This will expire in <strong>5 minutes</strong>.</p>
        <hr>
        <p>© 2025 Events Search App, Aditya Pathak</p>
    """

    try:
        mail.send(msg)
    except Exception as e:
        return jsonify(error=f"Failed to send email: {e}"), 500

    redis.setex(email, 300, otp)
    
    return jsonify(success=f"OTP sent to {email}")


@app.post("/verify_otp")
def verify_otp():
    if "email" not in request.form:
        return jsonify(error="Email not received"), 400
    if "otp" not in request.form:
        return jsonify(error="OTP not received"), 400
    
    email = request.form['email'].strip()
    if len(email) == 0:
        return jsonify(error="Email not received"), 400
        
    otp = request.form['otp'].strip()
    if len(otp) == 0:
        return jsonify(error="OTP not received"), 400
    elif not otp.isdigit() or len(otp) != 6:
        return jsonify(error="Invalid OTP"), 400

    stored_otp = redis.get(email)
    if not stored_otp:
        return jsonify(error="OTP expired or not found"), 404
    elif stored_otp != otp:
        return jsonify(error="Incorrect OTP"), 401
    
    redis.delete(email)
    
    ### Logic for handling email here; for now, just printing
    print(email)
    
    return jsonify(success=f"Verified {email}")
    

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
    
    ### Logic for handling email here; for now, just printing
    print(email)

    return jsonify(success="Got Tickets", next=event_url), 200



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

