var google = require("googleapis");
var customsearch = google.customsearch('v1');


// CSE ID
const CX = process.env.CX;
const API_KEY = process.env.API_KEY;
//const SEARCH = 'cat';



module.exports = function(app, db) {
    app.get('/latest', function(req, res) {
        var latest;
        
        var collection = db.collection("latest");
        collection.find({name : "latest"}).toArray(function(err, docs) {
            if(err) {
                throw err;
            }
            if(docs.length == 0) {
                latest = [];
            } else {
                latest = docs[0].latest;
            }
            res.json(latest);
        })
    });
    
    
    app.get('/api/:search', function(req, res) {
       if(req.query.offset) {
           var start = req.query.offset*10 + 1;
       } else {
           var start = 1;
       }
       
       var search = req.params.search;
       var when = new Date().toISOString();

       customsearch.cse.list({ cx: CX, q: search, auth: API_KEY, searchType: 'image', num : 10, start : 100}, function (err, resp) {
           if (err) {
               //console.log('An error occured', err);

               return res.status(503).send("Service unavailable. May be due to too many requests or too high of an offset value.");
               
           }
            // Got the response from custom search
            // console.log('Result: ' + resp.searchInformation.formattedTotalResults);
            // console.log(resp);
            var toSend = [];
            if (resp.items && resp.items.length > 0) {
                resp.items.forEach(function(picObj) {
                    // console.log(picObj.image);
                    var toAdd = {
                        url : picObj.link,
                        snippet : picObj.snippet,
                        thumbnail : picObj.image.thumbnailLink,
                        context : picObj.image.contextLink
                    };
                    toSend.push(toAdd);
                });
                //console.log(toSend);
                console.log("before sent");
                res.json(toSend);
                console.log("seny");
            } else {
                res.status(503).send("Service unavailable. May be due to too many requests.");
            }
        });
        
        var collection = db.collection("latest");
        var latest;
        collection.find({name : "latest"}).toArray((function(err, docs){
            if(err) {
                throw err;
            }
            if(docs.length == 0) {
                latest = [{
                    term : search,
                    when : when
                }];
            } else {
                latest = docs[0].latest;
                latest.unshift({
                    term : search,
                    when : when
                });
                // Shows last 10 searches
                latest = latest.slice(0, 10);
            }
            updateLatest(collection, latest);
            
            
        }));
        
    });
}

function updateLatest(collection, latest) {
    collection.update({name : "latest"} , {$set : {latest : latest}}, {upsert : true}, function(err, docs) {
        if(err) {
            throw err;
        }
    })
}