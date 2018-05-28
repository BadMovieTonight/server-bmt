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
  let SQL = 'SELECT username, password, preferences FROM users WHERE username = $1;';
  let values = [req.params.username];
  client.query(SQL, values)
    .then(result => res.send(result.rows[0]))
    .catch(console.error);
});

app.get('*', (req, res) => res.status(403).send('This route does not exist'));



app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));