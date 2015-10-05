var express = require('express');
var router = express.Router();

var request = require("request");
var url = require('url'); //解析操作url
var superagent = require('superagent'); //这三个外部依赖不要忘记npm install
var cheerio = require('cheerio');
var eventproxy = require('eventproxy');

var async = require('async');

var targetUrl = 'http://www.hearthstonetopdecks.com/deck-category/class/mage/';

/* GET users listing. */
router.get('/', function(req, res, next) {
  // res.send('respond with a resource');
  superagent.get(targetUrl)
    .end(function (err, result) {
        // res.send(result);
        var $ = cheerio.load(result.text);
        $('#deck-list td [rel~=bookmark]').each(function (idx, element) {
            if (element.attribs && element.attribs.href) {
                console.log(element.attribs.href);    
                getSingleDeck(element.attribs.href);
            };
            
        });
        // getSingleDeck("http://www.hearthstonetopdecks.com/decks/gnimshs-season-18-kodorider-mech-mage/");
        res.send('respond with a resource');
    });
});

function getSingleDeck(url){
    var deck = [];
    request(url, function (error, response, body) {
        if (!error) {
            var $ = cheerio.load(body);
            $('.card-frame').each(function (idx, element) {
                // console.log(element);
                var cardname = $(this).children('.card-name').text();
                var cardcount = $(this).children('.card-count').text();
                for (var i = 0; i < cardcount; i++) {
                    deck.push({
                        cardName:cardname
                    });
                };
            });
            console.log("deck",deck);
        } else {
            console.log("We’ve encountered an error: " + error);
        }
    });
}

module.exports = router;
