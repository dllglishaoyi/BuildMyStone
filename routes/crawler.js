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

router.get('/getcards163',getcards163);

router.get('/getdecks163',getdecks163);

router.get('/importcards163',importcards163);

function importcards163 (req,res) {
    var cards = require("./cards.json");
    async.each(cards,function(card,callback){
        console.log(card);
        HearthStone.Card163.update({id:card.id},{$set:card},{upsert:true},function(err,num){
            callback();
        });
    },function(err){
        res.send("import complete");
    });
    // 
}
function getdecks163 (req,res) {
    var startUrl = "http://tools.h.163.com/list/99/0/0/create_time";
    var hostUrl = "http://tools.h.163.com/"
    function scanpage (pageurl) {
        superagent.get(pageurl)
        .end(function (err, result) {
            // res.send(result);
            if (result) {
                var $ = cheerio.load(result.text);
                $(".hs-list-dl").each(function(index,item){
                    // console.log($(item).children("dd").children(".list-dl-t").children("a").attr('href'));
                    var deckUrl = hostUrl + $(item).children("dd").children(".list-dl-t").children("a").attr('href');
                    // console.log(deckUrl);
                    getSingleDeck163(deckUrl,function(err,deck) {
                        // body...
                        HearthStone.Deck.update({deckSourceUrl:deckUrl},{$set:{deckSourceUrl:deckUrl,cards:deck}},{upsert:true},function(err,num){
                            console.log("deck done",deckUrl);
                        });
                    })
                });
                if ($(".c_page-next")) {
                    scanpage($(".c_page-next").attr('href'));
                };
            }else{

            }
            
        });
    }
    scanpage (startUrl);
    res.send("getdecks163");
}

function getSingleDeck163(url,callback){
    console.log("deck url",url);
    var deck = [];
    request(url, function (error, response, body) {
        if (!error) {
            var $ = cheerio.load(body);
            // console.log($("#cardsDataStr").attr("value"));
            var cardsData = $("#cardsDataStr").attr("value");
            cardsData = JSON.parse(cardsData);
            for (var i = 0; i < cardsData; i++) {
                deck.push({
                    cardName:cardsData[i].name
                });
            };
            callback(error,deck);
        } else {
            console.log("We’ve encountered an error: " + error);
            callback(error,null);
        }
    });
}

function getcards163 (req,res) {
    //http://db.h.163.com/cards/filter?filter=Rarity%3D1%3A2%3A3%3A4%3A5&page=80
    var sourceUrl = 'http://db.h.163.com/cards/filter?filter=Rarity%3D1%3A2%3A3%3A4%3A5&page=';
    var pageUrls = [];
    var pagecount = 1;
    for (var i = 1; i < pagecount + 80; i++) {
        pageUrls.push(sourceUrl+i);
    };
    async.eachSeries(pageUrls,function(pageUrl,cb){
        console.log("start getting page:",pageUrl);
        superagent.get(pageUrl)
        .end(function (err, result) {
            // res.send(result);
            var $ = cheerio.load(result.text);
            $('.card-box .card').each(function (idx, element) {
                var card = new HearthStone.Card();
                card.name_cn = $(this).children('.card-attribute').children('h2').children('a').text().replace(/[\r\n]/g, "").trim();
                card.img = $(this).children('.card-image').children('a').children('img').attr('src');
                card.source = '163';
                // console.log(card);
                card.save();
            });
            cb();
        });
    },function(err){
        res.send("ok");
    });
}

function getAllDecks(hero,callback){
    var sourceUrl = targetUrl + hero + '/';
    superagent.get(sourceUrl)
    .end(function (err, result) {
        var pageUrls = [];//存储每页的url
        if (!result) {
            callback();
            return;
        }
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
