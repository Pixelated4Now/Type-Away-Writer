const express = require("express");

require('dotenv').config();

// Initialise express app.
const app = express();
app.use(express.json());

//Import route
const helloRoute = require('./routes/hello');


// Apply the route to use it.
app.use('/hello', helloRoute);  


const PORT = process.env.PORT || 8000;


// Port we run the server on.
app.listen(PORT, () => {
    console.log(`Server is running on PORT: ${PORT}`);
});