var express = require('express');
var router = express.Router();

var request = require("request");
var url = require('url'); //解析操作url
var superagent = require('superagent'); //这三个外部依赖不要忘记npm install
var cheerio = require('cheerio');
var eventproxy = require('eventproxy');

var async = require('async');

var HearthStone = require('../models/hearthstone');

var targetUrl = 'http://www.hearthstonetopdecks.com/deck-category/class/';
var deckClasses = ['hunter','mage','paladin','priest','rogue','shaman','warlock','warrior'];
/* GET users listing. */ 
router.get('/', function(req, res, next) {
  // res.send('respond with a resource');
  if (req.query.hero && deckClasses.indexOf(req.query.hero) > -1) {
    deckClasses = [req.query.hero];
  };
  async.eachSeries(deckClasses,function(hero,cb){
    console.log("getting "+hero);
    getAllDecks(hero,function(){
        console.log(hero+" finish!!");
        cb();
    });
  },function(err){
    res.send("OK");
  });
  
});

function getAllDecks(hero,callback){
    var sourceUrl = targetUrl + hero + '/';
    superagent.get(sourceUrl)
    .end(function (err, result) {
        var pageUrls = [];//存储每页的url
        var $ = cheerio.load(result.text);
        var totalpage = $('.pagination .pages').text().split(' ').slice(-1).pop();
        for (var i = 0; i < totalpage; i++) {
            pageUrls.push(sourceUrl+'page/'+(i + 1)+'/')
        };

        async.eachSeries(pageUrls,function(pageUrl,cb){
            console.log("start getting page:",pageUrl);
            superagent.get(pageUrl)
            .end(function (err, result) {
                // res.send(result);

                var $ = cheerio.load(result.text);
                var deckUrls = [];
                // var decks = [];
                
                $('#deck-list td [rel~=bookmark]').each(function (idx, element) {
                    if (element.attribs && element.attribs.href) {
                        deckUrls.push(element.attribs.href);
                    };
                });
                async.eachLimit(deckUrls,3, function(deckUrl, callback) {
                    console.log("start getting deck:",deckUrl);
                    getSingleDeck(deckUrl,function(err,deck){
                        console.log("finish deck:",deckUrl);
                        if (deck) {
                            HearthStone.Deck.update({deckSourceUrl:deckUrl},{$set:{deckSourceUrl:deckUrl,cards:deck}},{upsert:true},function(err,num){

                            });
                            // decks.push(deck);
                        };
                        callback();
                    });
                
                }, function(err){
                    console.log("finish page:",pageUrl);
                    cb();
                });
            });
        },function(err){
            callback();
        });
    });
}

function getSingleDeck(url,callback){
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
            callback(null,deck);
        } else {
            console.log("We’ve encountered an error: " + error);
            callback(error,null);
        }
    });
}

module.exports = router;
