const express = require("express");   
const router = express.Router();

// Initialise express app.
const app = express();
app.use(express.json());


// Return "hello world"..
router.get('/', (req, res) => {
    try {
        res.status(201).send("Hello world");

    } catch (e) {
        res.status(400).json({error: e.message});
    }
    
})


module.exports = router;