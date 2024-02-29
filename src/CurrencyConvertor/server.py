from flask import Flask, request, jsonify
import requests
from flask_cors import CORS
import sqlite3
import schedule
import time

app = Flask(__name__)
CORS(app)

DATABASE = 'rates.db'
CACHE = {}

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
    if CACHE.get(base_currency):
        return CACHE[base_currency]

    exchange_rates = get_exchange_rates_from_db()
    if not exchange_rates:
        url = f'https://api.exchangerate-api.com/v4/latest/{base_currency}'
        try:
            response = requests.get(url)
            data = response.json()
            rates = data['rates']
            insert_exchange_rates(rates)
            CACHE[base_currency] = rates
            return rates
        except Exception as e:
            return {'error': str(e)}
    else:
        CACHE[base_currency] = exchange_rates
        return exchange_rates

def update_database():
    base_currency = 'USD'
    get_exchange_rates(base_currency)

create_db()

schedule.every().hour.do(update_database)

@app.route('/api/exchange-rates')
def get_exchange_rates_route():
    exchange_rates = get_exchange_rates_from_db()
    return jsonify(exchange_rates)

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

@app.route('/api/update-added-currencies', methods=['POST'])
def update_added_currencies_route():
    data = request.get_json()
    base_currency = data['baseCurrency']
    base_value = float(data['baseValue'])
    new_amounts = data['newAmounts']
    
    try:
        response = requests.get(f'https://api.exchangerate-api.com/v4/latest/{base_currency}')
        data = response.json()
        rates = data['rates']
        for key in new_amounts:
            exchange_rate = rates.get(key)
            if exchange_rate is not None:
                converted_amount = round(base_value * exchange_rate, 2)
                new_amounts[key] = converted_amount
            else:
                print(f'Failed to fetch exchange rate for {key}')
        return jsonify(new_amounts)
    except Exception as e:
        print('Failed to fetch exchange rates:', e)
        return jsonify(new_amounts)

@app.route('/api/handle-add-currency', methods=['POST'])
def handle_add_currency_route():
    data = request.get_json()
    base_currency = data['baseCurrency']
    currency = data['currency']
    amounts = data['amounts']
    
    try:
        response = requests.get(f'https://api.exchangerate-api.com/v4/latest/{base_currency}')
        data = response.json()
        rates = data['rates']
        exchange_rate = rates.get(currency)
        if exchange_rate is not None:
            converted_amount = round(amounts[base_currency] * exchange_rate, 2)
            amounts[currency] = converted_amount
        else:
            print(f'Failed to fetch exchange rate for {currency}')
        return jsonify(amounts)
    except Exception as e:
        print('Failed to fetch exchange rate:', e)
        return jsonify(amounts)

if __name__ == '__main__':
    app.run(debug=True)

while True:
    schedule.run_pending()
    time.sleep(1)