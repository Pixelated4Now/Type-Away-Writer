const express = require("express");
const cors = require('cors');
require('dotenv').config();

// Initialise express app.
const app = express();
app.use(express.json());
app.use(cors());

//Import route
const authRoute = require('./routes/auth');


// Apply the route to use it.
app.use('/auth', authRoute);  


const PORT = process.env.PORT || 8000;


// Port we run the server on.
app.listen(PORT, () => {
    console.log(`Server is running on PORT: ${PORT}`);
});