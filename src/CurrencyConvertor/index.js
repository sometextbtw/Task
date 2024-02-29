import React, { useState, useEffect, useRef } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import { TextField, Menu, MenuItem, Tabs, Tab } from '@mui/material';
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import './styles.css';
import InputAdornment from '@mui/material/InputAdornment';
import currencies from './currencies.json';

const Converter = () => {
  const [amounts, setAmounts] = useState({
    USD: 1,
    EUR: 0,
    BYN: 0,
    RUB: 0,
    PLN: 0,
    UAH: 0,
  });
  const [selectedCurrency, setSelectedCurrency] = useState('');
  const baseCurrency = 'USD';
  const baseCurrencies = ['USD', 'EUR', 'BYN', 'RUB', 'UAH', 'PLN'];
  const [availableCurrencies, setAvailableCurrencies] = useState([]);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const menuButtonRef = useRef(null);
  const allCurrencies = Object.keys(amounts);
  const [exchangeRates, setExchangeRates] = useState(null); 

  useEffect(() => {
    fetchExchangeRates();
  }, []);

  const fetchExchangeRates = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/exchange-rates');
      const data = await response.json();

      const orderedAmounts = {};
      baseCurrencies.forEach(currency => {
        orderedAmounts[currency] = data[currency];
      });

      setAmounts(orderedAmounts);
      setAvailableCurrencies(Object.keys(data));
      setExchangeRates(data);
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
    }
  };

  const renderCurrencyRates = () => {
    if (!exchangeRates) return null;
    return (
      <div className={`currency-rates ${isDarkMode ? 'dark-mode' : ''}`}>
        <style>
          {isDarkMode && `
            .currency-rates ::-webkit-scrollbar {
              width: 12px;
            }
    
            .currency-rates ::-webkit-scrollbar-thumb {
              background-color: #888;
              border-radius: 6px;
            }
    
            .currency-rates ::-webkit-scrollbar-thumb:hover {
              background-color: #555;
            }
          `}
        </style>
        <h3 style={{ color: isDarkMode ? '#ddd' : '#222' }}>Курсы валют к 1 USD</h3>
        {Object.keys(exchangeRates).map(currency => (
          <div key={currency} style={{ marginBottom: '20px' }}>
            <TextField
              label={currencies[currency]}
              type="number"
              value={exchangeRates[currency]}
              fullWidth
              style={{ width: '400px', color: isDarkMode ? '#ddd' : '#222' }}
              InputProps={{
                readOnly: true,
                startAdornment: (
                  <InputAdornment position="start">
                    {currency}
                  </InputAdornment>
                ),
              }}
            />
          </div>
        ))}
      </div>
    );
    
    
  
    
  };

  const handleAmountChange = (e, currency) => {
    let { value } = e.target;
    if (value === '' || parseFloat(value) === 0) {
      value = '0.01';
    } else {
      value = Math.max(parseFloat(value), 0.01);
    }
    const newAmounts = { ...amounts, [currency]: value };
  
    const baseAmount = parseFloat(value) / amounts[currency];
    for (const key in amounts) {
      if (key !== currency && baseCurrencies.includes(key)) {
        newAmounts[key] = (baseAmount * amounts[key]).toFixed(2);
      }
    }
  
    updateAddedCurrencies(currency, value, newAmounts);
  };
  
  
  const updateAddedCurrencies = async (baseCurrency, baseValue, newAmounts) => {
    for (const key in newAmounts) {
      if (!baseCurrencies.includes(key)) {
        try {
          const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
          const data = await response.json();
          const exchangeRate = data.rates[key];
          const convertedAmount = (baseValue * exchangeRate).toFixed(2);
          newAmounts[key] = parseFloat(convertedAmount);
        } catch (error) {
          console.error('Failed to fetch exchange rate:', error);
        }
      }
    }
  
    setAmounts(newAmounts);
  };
  

  const handleAddCurrency = async (currency) => {
    if (currency && !Object.keys(amounts).includes(currency)) {
      try {
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
        const data = await response.json();
        const exchangeRate = data.rates[currency];
        const convertedAmount = (amounts[baseCurrency] * exchangeRate).toFixed(2);
        setAmounts({ ...amounts, [currency]: parseFloat(convertedAmount) });
        setMenuOpen(false);
      } catch (error) {
        console.error('Failed to fetch exchange rate:', error);
      }
    }
  };

  const handleRemoveCurrency = currency => {
    const { [currency]: value, ...newAmounts } = amounts;
    setAmounts(newAmounts);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(prevMode => !prevMode);

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
            <div className="currency-list-container">
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
            </div>
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
                    {currency} - {currencies[currency]}
                  </MenuItem>
                ))}
              </Menu>
            </div>
          </div>
        )}
        {currentTab === 1 && (
          <div>
            {renderCurrencyRates()}
          </div>
        )}
      </div>
    </div>
  );
};

export default Converter;
