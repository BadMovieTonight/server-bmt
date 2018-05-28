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

app.use(cors());

app.get('/homepage', (req, res) => {
  console.log('on server');
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
    .then(response => {
      console.log('in superagent');
      res.send(response.body);
    })
    .catch((err) => {
      console.log(err);
    });
});

// Legacy superagent request - saving for testing purposes

// superagent.get(`${API_URL}/discover/movie`)
//   .query({
//     api_key: process.env.TMDB_TOKEN,
//     sort_by: 'vote_average.asc',
//     'vote_count.gte': 25,
//     'primary_release_date.gte': '1980-01-01',
//     'primary_release_date.lte': '2018-06-01',
//     with_original_language: 'en',
//     adult: false,
//   })
//   .then(res => {
//     console.log('in superagent');
//     // console.log(res.body);
//   })
//   .catch((err) => {
//     console.log(err);
//   });

app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));