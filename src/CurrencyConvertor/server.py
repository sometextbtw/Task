from flask import Flask, request, jsonify
import requests
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

def get_exchange_rates(base_currency):
    url = f'https://api.exchangerate-api.com/v4/latest/{base_currency}'
    
    try:
        response = requests.get(url)
        data = response.json()
        
        return data['rates']
    
    except Exception as e:
        return {'error': str(e)}

def convert_currency(amount, from_currency, to_currency):
    try:
        response = requests.get(f'https://api.exchangerate-api.com/v4/latest/{from_currency}')
        exchange_rates = response.json()['rates']
        
        converted_amount = amount * exchange_rates[to_currency]
        
        return {'converted_amount': converted_amount}
    
    except Exception as e:
        return {'error': str(e)}

@app.route('/api/exchange-rates')
def get_exchange_rates_route():
    base_currency = 'USD'
    rates = get_exchange_rates(base_currency)
    return jsonify(rates)

@app.route('/api/convert-currency', methods=['POST'])
def convert_currency_route():
    data = request.get_json()
    amount = float(data['amount'])
    from_currency = data['from']
    to_currency = data['to']
    
    result = convert_currency(amount, from_currency, to_currency)
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)
