'use strict';

const express = require('express');
const cors = require('cors');
const pg = require('pg');
const superagent = require('superagent');

const TMDB_API_URL = 'https://api.themoviedb.org/3';
const app = express();
const PORT = process.env.PORT || 3000;
// const constring = 'postgres://localhost:5432';
//BEN'S CONSTRING
const constring = 'postgres://benjamin:postgrespassword@localhost:5432/badmovietonight';
const client = new pg.Client(process.env.DATABASE_URL || constring);
client.connect();
client.on('error', err => console.log(err));

app.use(cors());
app.use(express.urlencoded());
app.use(express.json());
app.use(express.static('/'));

// Initializes default page with a list of movies
app.get('/homepage', (req, res) => {
  console.log('on server');
  superagent.get(`${TMDB_API_URL}/discover/movie`)
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

app.get('/login/:username', (req,res) => {
  let SQL = 'SELECT * FROM users WHERE username = $1;';
  let values = [req.params.username];
  client.query(SQL, values)
    .then(result => res.send(result.rows[0]))
    .catch(console.error);
});

app.put('/users/update', (req, res) => {
  let SQL = 'UPDATE users SET username = $1, password = $2, preferences = $3 WHERE id = $4;';
  let values = [
    req.body.username,
    req.body.password,
    req.body.preferences,
    req.body.id
  ];
  client.query(SQL, values)
    .then(() => res.sendStatus(204))
    .catch(console.error);
});

//Endpoint for adding a user
app.post('/users', (req, res) => {
  let SQL = '';
});

// Default route for anything not defined
app.get('*', (req, res) => res.status(403).send('This route does not exist'));

app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));