/**
 * SERVER CODE
 */
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

const PORT = 3000;
const publicDir = path.join(__dirname, 'static');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(function (req, _, next) {
    console.info(`${new Date().toISOString()} request ${req.url}`);
    next();
});
app.use(express.static(publicDir));
app.use((req, res) => {
    res.status(404).sendFile(path.join(publicDir, '404.html'));
});

app.listen(PORT, () => {
    console.info(
        `Server successfully started on port ${PORT} (visit http://localhost:${PORT})`,
    );
});
