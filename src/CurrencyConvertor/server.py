from flask import Flask, request, jsonify
import requests
from flask_cors import CORS
import sqlite3
import schedule
import time

app = Flask(__name__)
CORS(app)

# Имя файла базы данных
DATABASE = 'rates.db'

# Функция для создания базы данных и таблицы, если она не существует
def create_db():
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS rates
                 (currency TEXT PRIMARY KEY, rate REAL)''')
    conn.commit()
    conn.close()

# Функция для вставки курсов валют в базу данных
def insert_exchange_rates(rates):
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    for currency, rate in rates.items():
        c.execute("INSERT OR REPLACE INTO rates (currency, rate) VALUES (?, ?)", (currency, rate))
    conn.commit()
    conn.close()

# Функция для получения курсов валют из базы данных
def get_exchange_rates_from_db():
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("SELECT * FROM rates")
    rows = c.fetchall()
    conn.close()
    return {row[0]: row[1] for row in rows}

# Функция для получения курсов валют из API и сохранения их в базе данных
def get_exchange_rates(base_currency):
    url = f'https://api.exchangerate-api.com/v4/latest/{base_currency}'
    
    try:
        response = requests.get(url)
        data = response.json()
        rates = data['rates']
        insert_exchange_rates(rates)  # Сохраняем полученные курсы в базе данных
        return rates
    
    except Exception as e:
        return {'error': str(e)}

# Создаем таблицу в базе данных при запуске приложения
create_db()

# Функция для обновления данных в базе данных каждые два часа
def update_database():
    base_currency = 'USD'  # Базовая валюта, можно изменить по необходимости
    rates = get_exchange_rates(base_currency)

# Планирование задачи обновления базы данных каждые два часа
schedule.every(2).hours.do(update_database)

# Маршрут для получения курсов валют
@app.route('/api/exchange-rates')
def get_exchange_rates_route():
    exchange_rates = get_exchange_rates_from_db()  # Получаем курсы валют из базы данных
    return jsonify(exchange_rates)

# Маршрут для конвертации валюты
@app.route('/api/convert-currency', methods=['POST'])
def convert_currency_route():
    data = request.get_json()
    amount = float(data['amount'])
    from_currency = data['from']
    to_currency = data['to']
    
    exchange_rates = get_exchange_rates_from_db()  # Получаем курсы валют из базы данных
    if exchange_rates.get(from_currency) is None or exchange_rates.get(to_currency) is None:
        return jsonify({'error': 'Курс обмена не найден для предоставленных валют'})
    
    converted_amount = amount * exchange_rates[to_currency] / exchange_rates[from_currency]
    return jsonify({'converted_amount': converted_amount})

# Запускаем сервер Flask
if __name__ == '__main__':
    app.run(debug=True)

# Запуск планировщика задач
while True:
    schedule.run_pending()
    time.sleep(1)
