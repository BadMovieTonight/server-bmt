'use strict';

const express = require('express');
const cors = require('cors');
const pg = require('pg');
const superagent = require('superagent');

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

app.get('/login/:username', (req,res) => {
  let SQL = 'SELECT * FROM users WHERE username = $1;';
  let values = [req.params.username];
  client.query(SQL, values)
    .then(result => res.send(result.rows[0]))
    .catch(console.error);
});

//Endpoint for updating a user
app.put('/users/update', (req, res) => {
  console.log(req.body);
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

//Endpoint for removing a user

app.get('*', (req, res) => res.status(403).send('This route does not exist'));

app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));