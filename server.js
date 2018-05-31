'use strict';

const express = require('express');
const cors = require('cors');
const pg = require('pg');
const superagent = require('superagent');

const TMDB_API_URL = 'https://api.themoviedb.org/3';
const app = express();
const PORT = process.env.PORT || 3000;
// const constring = 'postgres://localhost:5432/badmovietonight'
const client = new pg.Client(process.env.DATABASE_URL);

const defaultSearchPrefs = {
  maxrating: 4,
  minratings: 25,
  mindate: '1970-01-01',
};

let searchPrefs = {
  maxrating: defaultSearchPrefs.maxrating,
  minratings: defaultSearchPrefs.minratings,
  mindate: defaultSearchPrefs.mindate
};
console.log('searchPrefs set to default');

client.connect();
client.on('error', err => console.log(err));

app.use(cors());
app.use(express.urlencoded());
app.use(express.json());
app.use(express.static('/'));

function getNow() {
  let d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDay()}`;
}

// Initializes default page with a list of movies
app.get('/homepage/:page', (req, res) => {
  superagent.get(`${TMDB_API_URL}/discover/movie`)
    .query({
      api_key: process.env.TMDB_TOKEN,
      sort_by: 'vote_average.asc',
      'vote_average.lte': parseInt(searchPrefs.maxrating),
      'vote_count.gte': parseInt(searchPrefs.minratings),
      'primary_release_date.gte': searchPrefs.mindate,
      'primary_release_date.lte': getNow(),
      with_original_language: 'en',
      page: req.params.page,
      adult: false,
    })
    .then(response => {
      res.send(response.body);
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get('/bmt/movies', (req, res) => {
  superagent.get(`${TMDB_API_URL}/search/movie`)
    .query({
      api_key: process.env.TMDB_TOKEN,
      query: req.query.searchFor,
      page: req.query.page,
      language: 'en-US',
      adult: false,
    })
    .then(response => {
      res.send(response.body);
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get('/bmt/person', (req, res) => {
  superagent.get(`${TMDB_API_URL}/search/person`)
    .query({
      api_key: process.env.TMDB_TOKEN,
      query: req.query.searchFor,
      page: req.query.page,
      language: 'en-US',
      adult: false,
    })
    .then(response => {
      res.send(response.body);
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get('/bmt/person/:id', (req, res) => {
  superagent.get(`${TMDB_API_URL}/person/${req.params.id}`)
    .query({
      api_key: process.env.TMDB_TOKEN,
      language: 'en-US',
    })
    .then(response => {
      res.send({results: [response.body]});
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get('/bmt/search', (req, res) => {
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
      let responseType = response.body.results[0].media_type;
      if (responseType !== 'person') {
        res.send(response.body);
      } else { // response 0 is person so that's the likely target of the search
        let personId = response.body.results[0].id;
        superagent.get(`${TMDB_API_URL}/person/${personId}`)
          .query({
            api_key: process.env.TMDB_TOKEN,
            language: 'en-US',
          })
          .then(response => {
            response.body.media_type = 'person'; // fake it into a person
            res.send({results: [response.body]});
          });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get('/movies/:actorid', (req, res) => {
  superagent.get(`${TMDB_API_URL}/discover/movie`)
    .query({
      api_key: process.env.TMDB_TOKEN,
      language: 'en-US',
      sort_by: 'vote_average.asc',
      'vote_average.lte': parseInt(searchPrefs.maxrating),
      'vote_count.gte': parseInt(searchPrefs.minratings),
      'primary_release_date.gte': searchPrefs.mindate,
      'primary_release_date.lte': getNow(),
      'with_cast': req.params.actorid,
      adult: false
    })
    .then(response => {
      res.send(response.body);
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get('/credits/:movieid', (req, res) => {
  superagent.get(`${TMDB_API_URL}/movie/${req.params.movieid}/credits`)
    .query({
      api_key: process.env.TMDB_TOKEN,
      language: 'en-US'
    }).then(response => {
      res.send(response.body);
    }).catch(console.error);
});

app.get('/login/:username', (req,res) => {
  let SQL = 'SELECT username, password, preferences FROM users WHERE username = $1;';
  let values = [req.params.username];
  client.query(SQL, values)
    .then(result => {
      res.send(result.rows[0]);
      // set search prefs to users
      let tempPrefs = JSON.parse(result.rows[0].preferences);
      searchPrefs = {
        maxrating: tempPrefs.maxrating,
        minratings: tempPrefs.minratings,
        mindate: tempPrefs.mindate
      };
      console.log(req.params.username,'logged in. preferences set.');
    })
    .catch(console.error);
});

app.get('/logout', (req, res) => {
  searchPrefs = {
    maxrating: defaultSearchPrefs.maxrating,
    minratings: defaultSearchPrefs.minratings,
    mindate: defaultSearchPrefs.mindate
  };
  console.log('logged out. prefs reset to default.');
});

app.put('/users/update', (req, res) => {
  let SQL = 'UPDATE users SET username = $1, password = $2, preferences = $3 WHERE username = $1;';
  let values = [
    req.body.username,
    req.body.password,
    req.body.preferences,
  ];
  let tempPrefs = JSON.parse(req.body.preferences);
  searchPrefs = {
    maxrating: tempPrefs.maxrating,
    minratings: tempPrefs.minratings,
    mindate: tempPrefs.mindate
  };
  client.query(SQL, values)
    .then((result) => {
      console.log(req.body.username,'updated. preferences set.');
      res.sendStatus(202);
    })
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
  searchPrefs = {
    maxrating: defaultSearchPrefs.maxrating,
    minratings: defaultSearchPrefs.minratings,
    mindate: defaultSearchPrefs.mindate
  };
  client.query(SQL, values)
    .then(() => {
      console.log(req.body.username,'created. searchPrefs set to default');
      res.sendStatus(201);
    })
    .catch(console.error);
});

app.delete('/users/remove/:username', (req, res) => {
  let SQL = `DELETE FROM users WHERE username = $1;`;
  let values = [req.params.username];
  client.query(SQL, values)
    .then(() => res.sendStatus(200))
    .catch(console.error);
});

// Default route for anything not defined
app.get('*', (req, res) => res.status(403).send('This route does not exist'));

app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));