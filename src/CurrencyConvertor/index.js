import React, { useState, useEffect, useRef } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import { TextField, Menu, MenuItem, Tabs, Tab } from '@mui/material';
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import currencies from './currencies.json';
import './styles.css';

const Converter = () => {
  const [amounts, setAmounts] = useState({
    USD: 1,
    EUR: 0,
    BYN: 0,
    RUB: 0
  });
  const [exchangeRates, setExchangeRates] = useState({});
  const [selectedCurrency, setSelectedCurrency] = useState('');
  const baseCurrency = 'USD';
  const baseCurrencies = ['USD', 'EUR', 'BYN', 'RUB', 'UAH', 'PLN'];
  const [availableCurrencies, setAvailableCurrencies] = useState([]);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const menuButtonRef = useRef(null);

  useEffect(() => {
    fetchExchangeRates();
  }, []);

  const fetchExchangeRates = () => {
    fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`)
      .then(response => response.json())
      .then(data => {
        setExchangeRates(data.rates);
        setAvailableCurrencies(Object.keys(data.rates));
        const newAmounts = { ...amounts };
        for (const currency in data.rates) {
          if (baseCurrencies.includes(currency)) {
            newAmounts[currency] = data.rates[currency];
          }
        }
        setAmounts(newAmounts);
      });
  };

  const handleAmountChange = (e, currency) => {
    let { value } = e.target;
    value = Math.max(parseFloat(value), 0);
    const newAmounts = { ...amounts, [currency]: value };
    setAmounts(newAmounts);
    const baseAmount = parseFloat(value) / exchangeRates[currency];
    for (const key in exchangeRates) {
      if (key !== currency && Object.keys(amounts).includes(key)) {
        newAmounts[key] = (baseAmount * exchangeRates[key]).toFixed(2);
      }
    }
    setAmounts(newAmounts);
  };

  const handleAddCurrency = currency => {
    if (currency && !Object.keys(amounts).includes(currency)) {
      const convertedAmount = (amounts.USD * exchangeRates[currency]).toFixed(2);
      setAmounts({ ...amounts, [currency]: convertedAmount });
      setMenuOpen(false);
    }
  };

  const handleRemoveCurrency = currency => {
    const { [currency]: value, ...newAmounts } = amounts;
    setAmounts(newAmounts);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(prevMode => !prevMode);

    // Изменение стилей фона в зависимости от темы
    const body = document.querySelector('body');
    if (isDarkMode) {
      body.style.background = 'linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)';
    } else {
      body.style.background = 'linear-gradient(-45deg, #222, #444, #666)';
    }
  };

  return (
    <div className={`container text-center ${isDarkMode ? 'dark-mode' : ''}`}>
      <h2 style={{ display: 'inline-block', color: isDarkMode ? '#ddd' : '#222' }}>Конвертер валют</h2>
      <button onClick={toggleDarkMode} className="toggle-theme-btn" style={{ float: 'right' }}>
        <Brightness4Icon />
      </button>
      <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
        <Tab label="Конвертер" />
        <Tab label="Курсы валют" />
      </Tabs>
      <div className="tab-content">
        {currentTab === 0 && (
          <div>
            {Object.keys(amounts).map(currency => (
              <div className="form-group" key={currency}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <TextField
                    value={currency} 
                    disabled
                    style={{ fontWeight: 'bold', width: '150px' }}
                  />
                  <TextField
                    label={currencies[currency]}
                    type="number"
                    value={amounts[currency]}
                    onChange={e => handleAmountChange(e, currency)}
                    fullWidth
                    style={{ width: '400px', color: isDarkMode ? '#ddd' : '#222' }}
                  />
                  {!baseCurrencies.includes(currency) && (
                    <CloseIcon
                      style={{ cursor: 'pointer', marginLeft: '10px' }}
                      onClick={() => handleRemoveCurrency(currency)}
                    />
                  )}
                </div>
              </div>
            ))}
            <div style={{ marginTop: '20px' }}>
              <label>Добавить валюту:</label>
            </div>
            <div>
              <button className="button-icon" ref={menuButtonRef} onClick={() => setMenuOpen(true)}>
                <AddCircleOutlineRoundedIcon />
              </button>
              <Menu
                anchorEl={menuButtonRef.current}
                open={isMenuOpen}
                onClose={() => setMenuOpen(false)}
                PaperProps={{
        style: {
      backgroundColor: isDarkMode ? '#333' : '',
      color: isDarkMode ? '#ddd' : '',
    }
  }}
>
  {availableCurrencies.map(currency => (
    <MenuItem key={currency} onClick={() => handleAddCurrency(currency)}>
      {`${currency} - ${currencies[currency]}`}
    </MenuItem>
  ))}
</Menu>

            </div>
          </div>
        )}
        {currentTab === 1 && (
          <div>
            <h3 style={{ color: isDarkMode ? '#ddd' : '#222' }}>Курсы валют по отношению к {baseCurrency}</h3>
            {Object.keys(exchangeRates).map(currency => (
              <div className="form-group" key={currency}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <TextField
                    value={currency}
                    disabled
                    style={{ fontWeight: 'bold', width: '150px' }}
                  />
                  <TextField
                    label={currencies[currency]}
                    type="number"
                    value={exchangeRates[currency]}
                    fullWidth
                    style={{ width: '400px', color: isDarkMode ? '#ddd' : '#222' }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Converter;