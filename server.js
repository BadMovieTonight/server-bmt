'use strict';

const express = require('express');
const cors = require('cors');
const pg = require('pg');
const superagent = require('superagent');

const TMDB_API_URL = 'https://api.themoviedb.org/3';
const app = express();
const PORT = process.env.PORT || 3000;
// const constring = 'postgres://localhost:5432
const client = new pg.Client(process.env.DATABASE_URL);
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

app.get('/bmt/movies', (req, res) => {
  console.log('on server /bmt/movies');
  superagent.get(`${TMDB_API_URL}/search/movie`)
    .query({
      api_key: process.env.TMDB_TOKEN,
      query: req.query.searchFor,
      page: req.query.page,
      language: 'en-US',
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

app.get('/bmt/person', (req, res) => {
  console.log('on server /bmt/person');
  superagent.get(`${TMDB_API_URL}/search/person`)
    .query({
      api_key: process.env.TMDB_TOKEN,
      query: req.query.searchFor,
      page: req.query.page,
      language: 'en-US',
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

app.get('/bmt/person/:id', (req, res) => {
  console.log('on server /bmt/person', req.params.id);
  superagent.get(`${TMDB_API_URL}/person/${req.params.id}`)
    .query({
      api_key: process.env.TMDB_TOKEN,
      language: 'en-US',
    })
    .then(response => {
      console.log('in superagent');
      res.send({results: [response.body]});
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get('/bmt/search', (req, res) => {
  console.log('on server for bmt/search');
  console.log('req.query',req.query);
  superagent.get(`${TMDB_API_URL}/search/multi`)
    .query({
      api_key: process.env.TMDB_TOKEN,
      language: 'en-US',
      query: req.query.searchFor,
      page: req.query.page,
      sort_by: 'vote_average.asc',
      adult: false
    })
    .then(response => {
      console.log('in superagent .then');
      console.log(response.body.page,'of',response.body.total_pages);
      let responseType = response.body.results[0].media_type;
      console.log(responseType);
      if (responseType !== 'person') {
        res.send(response.body);
      } else { // response 0 is person so that's the likely target of the search
        let personId = response.body.results[0].id;
        console.log('person id',personId);
        //https://api.themoviedb.org/3/person/31?api_key=c8a693c102e1447f1a989b4d4b65cd8e&language=en-US
        superagent.get(`${TMDB_API_URL}/person/${personId}`)
          .query({
            api_key: process.env.TMDB_TOKEN,
            language: 'en-US',
          })
          .then(response => {
            response.body.media_type = 'person'; // fake it into a person
            console.log('after get person details',response.body);
            res.send({results: [response.body]});
          });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get('/login/:username', (req,res) => {
  let SQL = 'SELECT username, password, preferences FROM users WHERE username = $1;';
  let values = [req.params.username];
  client.query(SQL, values)
    .then(result => res.send(result.rows[0]))
    .catch(console.error);
});

app.put('/users/update', (req, res) => {
  let SQL = 'UPDATE users SET username = $1, password = $2, preferences = $3 WHERE username = $1;';
  let values = [
    req.body.username,
    req.body.password,
    req.body.preferences,
  ];
  client.query(SQL, values)
    .then(() => res.sendStatus(204))
    .catch(console.error);
});

//Endpoint for adding a user
app.post('/users/new', (req, res) => {
  let SQL = 'INSERT INTO users(username, password, preferences) VALUES($1, $2, $3);';
  let values = [
    req.body.username,
    req.body.password,
    req.body.preferences
  ];
  client.query(SQL, values)
    .then(() => res.sendStatus(204))
    .catch(console.error);
});

// Default route for anything not defined
app.get('*', (req, res) => res.status(403).send('This route does not exist'));

app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));