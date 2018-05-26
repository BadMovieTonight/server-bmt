'use strict';

const express = require('express');
const cors = require('cors');
const pg = require('pg');
const superagent = require('superagent');

const app = express();
const PORT = process.env.PORT || 3000;
const constring = 'postgres://localhost:5432';
const client = new pg.Client(process.env.DATABASE_URL || constring);

app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));