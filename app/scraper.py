import requests
from flask import jsonify
from pyquery import PyQuery as pq
from yarl import URL

def scrape_events(city, country, params={}):
    city = city.lower().replace(" ","-").strip()
    country = country.lower().replace(" ","-").strip()

    url = URL('https://www.eventbrite.com/d/') / f'{country}--{city}' / 'all-events' / "" 
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36"
    }

    response = requests.get(url, headers=headers, params=params)
    if response.status_code == 200:
        doc = pq(response.text)
        
        data = {
            'city_text': f'{city.title().replace("-", " ")}, {country.title().replace("-", " ")}',
            'page': int(params['page']),
            'end': False,
            'events': [],
        }
        
        for card in doc('.search-results-panel-content__events > section > ul > li .discover-search-desktop-card').items():
            details = card.find('section.event-card-details')

            name = details.find('a.event-card-link h3').text().strip()
            date = details.children('div').children("p:first-of-type").text().strip()
            location = details.children('div').children("p:last-of-type").text().strip()
            img_url = card.find("img.event-card-image").attr('src')
            urgency = details.find(".EventCardUrgencySignal > p").text().strip()
            
            urgency_class = ''
            if urgency:
                urgency_class = 'danger'
                if urgency.lower() == 'just added':
                    urgency_class = 'success'

            url = details.find('a.event-card-link').attr('href')
            tag = url.split('/')[-1].split("?")[0]

            data["events"].append({
                'name': name,
                'tag': tag,
                'date': date,
                'location': location,
                'img': img_url,
                'urgency': {
                    'text': urgency,
                    'class': urgency_class,
                },
            })
        
        pagination_string = doc("[data-testid='pagination-parent']").text().strip()
        cur_page = int(pagination_string.split()[0].strip())
        max_page = int(pagination_string.split()[-1].strip())

        if max_page < cur_page:
            data['end'] = True
        
        data['page'] = cur_page

        res_heading = doc(".search-header__result-header h2").text().split("vents in")[-1].strip() # vents in, because Events in or events in is possible
        if len(res_heading) != 0:
            data['city_text'] = res_heading

        return jsonify(data), 200
    
    return jsonify(error="Events not found"), 404
