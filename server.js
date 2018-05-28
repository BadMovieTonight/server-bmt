'use strict';

const express = require('express');
const cors = require('cors');
const pg = require('pg');
const superagent = require('superagent');

const app = express();
const PORT = process.env.PORT || 3000;
const constring = 'postgres://localhost:5432';
const client = new pg.Client(process.env.DATABASE_URL || constring);

const API_URL = 'https://api.themoviedb.org/3';

superagent.get(`${API_URL}/discover/movie`)
  .query({
    api_key: process.env.TMDB_TOKEN,
    sort_by: 'vote_average.asc',
    'vote_count.gte': 25,
    'primary_release_date.gte': '1980-01-01',
    'primary_release_date.lte': '2018-06-01',
    with_original_language: 'en',
    adult: false,
  })
  .end((err, res) => {
    if (err) {return console.log(err);}
    console.log(res.body);
  });

app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));