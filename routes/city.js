const express = require('express');
const City = require('../domain/city');

const router = express.Router();

router.get('/', (req, res) => {
  const cities = Array.from([
    new City('Buenos Aires', 1),
    new City('Rosario', 2),
    new City('Ushuaia', 3),
  ]);
  res.json(cities);
});

router.get('/list', (req, res) => {
  const cities = Array.from([
    new City('Buenos Aires', 4),
    new City('Rosario', 5),
    new City('Ushuaia', 6),
  ]);
  const newCity = new City('Salta', 7);
  newCity.id = 7;
  newCity.name = 'Salta Capital';
  newCity.populationNumber = 1000;
  cities.push(newCity);
  res.json(cities);
});

module.exports = router;
