const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const serviceMongo = require('./service/mongodb')
const indexRouter = require('./routes/index');
const cityRouter = require('./routes/city');
const scrapRouter = require('./routes/scrap');
const mongoRouter = require('./routes/mongodb');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/city', cityRouter);
app.use('/scrap', scrapRouter);
app.use('/mongo', mongoRouter);

serviceMongo.connect()

module.exports = app;
