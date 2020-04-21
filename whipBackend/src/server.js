const express = require("express"); // CommonJS import style!
const app = express(); // instantiate an Express object
const bodyParser = require("body-parser");
const logic = require('./logic.js')
const db = require('./db.js')
const cors = require('cors')
var fs = require("fs");

app.use(bodyParser.json()); // decode JSON-formatted incoming POST data
app.use(cors())
//GET GENERAL TOKEN
app.get('/token', async (req, res) => {
    const token = await logic.getToken();
    res.send(token);
});
/*
//RECOMMENDATIONS
app.post("/search", async (req, res) => {
    const id = await logic.getArtistId(req.body.token, req.body.artist);
    const recomendations = await logic.getRecs(req.body.token, id, req.body.filters);
    res.send(recomendations);
})
*/

//LOCATION BASED TRACKS
app.post('/nearby', async (req, res) => {
    try {
        console.log('request recieved for ' + req.body.location)
        let locationResp = await logic.getLocationID(req.body.location)
        let locationObj = JSON.parse(locationResp)
        let cachedResults = await db.check({ length: 'day', code: (locationObj.id).toString() })
        if (cachedResults) {
            console.log('cache hit!')
            res.send(cachedResults)
        }
        else {
            console.log('cache miss')
            let artistsResp = await logic.getNearbyArtists(locationResp, req.body.token)
            let tracksResp = await logic.getTracks(artistsResp, req.body.token)
            tracksResp['length'] = "day"
            tracksResp['location'] = (locationObj.id).toString()
            let success = await db.insert(tracksResp)
            if (success) {
                console.log('upload success')
                res.send(tracksResp)
            }
            else {
                console.log('upload failed')
                res.send(undefined)
            }
        }
    }
    catch (error) { console.log(error) }
})

app.listen(3001, () => console.log('Server listening on port 3001'));





/*
fs.writeFile("./testData.json", JSON.stringify(tracksResp), (err) => {
    if (err) {
        console.error(err);
        return;
    };
    console.log("File has been created");
});
*/