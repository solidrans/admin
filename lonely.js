require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const port = process.env.PORT;
const cors = require('cors')
const cron = require('node-cron');
var fs = require('fs');
var mime = require('mime');
const cronUtil = require('./server/utils/Cron');

//establish connection 
require('./server/connection')

//initialize app 
var app = express();
app.get("/assets/video/*",async function (req, res) {
    var url = __dirname+"/server"+req.url;
    if (fs.existsSync(url)) {
        fs.stat(url, function (err, stat) {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('Your requested URI(' + req.url + ') wasn\'t found on our server');
            } else {
                var type = mime.getType(url);
                var fileSize = stat.size;
                var range = req.headers.range;
                if (range) {
                    var parts = range.replace(/bytes=/, "").split("-");
                    var start = parseInt(parts[0], 10);
                    var end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                    var chunksize = (end - start) + 1;
                    var file = fs.createReadStream(url, { start, end });
                    var head = {
                        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                        'Accept-Ranges': 'bytes',
                        'Content-Length': chunksize,
                        'Content-Type': type
                    }
                    res.writeHead(206, head);
                    file.pipe(res);
                } else {
                    var head = {
                        'Content-Length': fileSize,
                        'Content-Type': type
                    }
                    res.writeHead(200, head);
                    fs.createReadStream(url).pipe(res);
                }
            }
        });
    }else{
        res.status(404).send("No found")
    }

})

//to get data form post/get request 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({ origin: "*" }));

//get access file path
// app.use('/files', express.static(__dirname + '/server/assets/'))

//get access file path
app.use('/files', express.static(__dirname + '/server/assets/'))

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'server/views/'));
})


var interest = require('./server/routes/interests')
app.use(process.env.API_V1 + 'interests', interest);

var users = require('./server/routes/users')
app.use(process.env.API_V1 + 'users', users);

var admin = require('./server/routes/admin')
app.use(process.env.API_V1 + 'admin', admin);


cron.schedule('00 00 12 * * 0-6', function() {
    console.log('running a task every minute');
    cronUtil.deleteleftSwipeAfterWeek()
});
//to check is server listing to port 
app.listen(port, () => {
    console.log(`server running on port ${port}`);
});