from flask import Flask, request, jsonify
import requests
from flask_cors import CORS
import sqlite3

app = Flask(__name__)
CORS(app)

DATABASE = 'rates.db'

def create_db():
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS rates
                 (currency TEXT PRIMARY KEY, rate REAL)''')
    conn.commit()
    conn.close()

def insert_exchange_rates(rates):
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    for currency, rate in rates.items():
        c.execute("INSERT OR REPLACE INTO rates (currency, rate) VALUES (?, ?)", (currency, rate))
    conn.commit()
    conn.close()

def get_exchange_rates_from_db():
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("SELECT * FROM rates")
    rows = c.fetchall()
    conn.close()
    return {row[0]: row[1] for row in rows}

def get_exchange_rates(base_currency):
    exchange_rates = get_exchange_rates_from_db()
    if not exchange_rates:
        url = f'https://api.exchangerate-api.com/v4/latest/{base_currency}'
        try:
            response = requests.get(url)
            data = response.json()
            rates = data['rates']
            insert_exchange_rates(rates) 
            return rates
        except Exception as e:
            return {'error': str(e)}
    else:
        return exchange_rates

create_db()

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
    
    exchange_rates = get_exchange_rates_from_db() 
    if exchange_rates.get(from_currency) is None or exchange_rates.get(to_currency) is None:
        return jsonify({'error': 'Курс обмена не найден для предоставленных валют'})
    
    converted_amount = amount * exchange_rates[to_currency] / exchange_rates[from_currency]
    return jsonify({'converted_amount': converted_amount})

if __name__ == '__main__':
    app.run(debug=True)
