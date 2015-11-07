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

var phantom = require('phantom');
var phantom_options = {
        path: '/Users/developer/Downloads/phantomjs-2.0.0-macosx/bin/'
};
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

router.get('/getdecksduowan',getdecksduowan);

router.get('/decktoklass',decktoklass);
router.get('/import_en_name',import_en_name);

function decktoklass (req,res) {
    HearthStone.Deck.find({},function(err,decks){
        async.eachLimit(decks,3, function(deck, callback) {
            setupDeckKlass(deck);
            callback();
        },
        function(err){
            res.send("ok");   
        });
         
    });
}

function  setupDeckKlass(deck) {
    //2：德鲁伊，3：猎人，4:法师，5：圣骑士，6：牧师，7：刺客，8：萨满，10：战士
    if (!deck || !deck.cards) {
        return;
    };
    var cards = deck.cards.map(function(card){
        return card.cardName;
    });
    HearthStone.Card163.findOne({name:{$in:cards},klass:{$exists:true}},function(err,card){
        if (card) {
            deck.klass = card.klass;
            deck.save();
        };
    });
    
}

function getdecksduowan (req,res) {
    var startUrl = "http://ls.duowan.com/tag/246972432372";
    var page = 1;
    var pageCount = 9;

    function scanpage (pageurl) {
        superagent.get(pageurl)
        .end(function (err, result) {
            // res.send(result);
            console.log(pageurl);
            if (result) {
                var $ = cheerio.load(result.text);
                ;
                async.eachSeries($("#list-page li"), function(item, callback) {
                    var deckUrl = "http://ls.duowan.com"+$(item).children("a").attr('href');
                    getSingleDeckDuowan(deckUrl,function(err,deck) {
                        // body...
                        HearthStone.Deck.update({deckSourceUrl:deckUrl},{$set:{channel:"duowan",deckSourceUrl:deckUrl,cards:deck}},{upsert:true},function(err,num){
                            console.log("deck done",err,deckUrl);
                            console.log(deck);
                            callback();
                        });
                        
                    });
                
                }, function(err){
                    if (page < pageCount) {
                        page ++ 
                        scanpage (startUrl+"_"+page+".html");
                    };
                });
                // $("#list-page li").each(function(index,item){
                //     var deckUrl = "http://ls.duowan.com"+$(item).children("a").attr('href');
                //     getSingleDeckDuowan(deckUrl,function(err,deck) {
                //         // body...
                //         console.log(deck);
                //     });
                // });
            }else{

            }
            
        });
    }
    scanpage (startUrl +".html");
    
}

function getSingleDeckDuowan(url,callback){
    var deck = [];
    request(url, function (error, response, body) {
        if (!error) {
            var $ = cheerio.load(body);
            var realUrl = '';
            $("#article a").each(function(index,item){
                var text = $(item).text();
                if (text == '点击此处查看卡组详情') {
                    realUrl = $(item).attr('href');
                };
            });
            console.log("realUrl:",realUrl);
            if (realUrl) {
                phantom.create(function (ph) {
                  ph.createPage(function (page) {
                    page.open(realUrl, function (status) {
                      console.log("opened page? ", status);
                      page.evaluate(
                        function () { 
                            var deck = [];
                            $(".list-box li").each(function(index,item) {
                                var cardcount = $(item).find("span").text().substring(1);
                                for (var i = 0; i < cardcount; i++) {
                                    deck.push({
                                        cardName:$(item).find("p").text()
                                    });
                                };
                                
                            });
                            return deck; 
                        }, function (result) {
                        console.log('list-box content is ',result);
                        ph.exit();
                        callback(null,result);
                      });
                    });
                  });
                },phantom_options);
            }else{
                callback("no deck",null);
            }
            // for (var i = 0; i < cardsData.length; i++) {
            //     deck.push({
            //         cardName:cardsData[i].name
            //     });
            // };
            
        } else {
            console.log("We’ve encountered an error: " + error);
            callback(error,null);
        }
    });
}

function import_en_name (req,res) {
    var cardsSet = require("./AllSets.json");
    var keys = [];
    for (var key in cardsSet) {
        // keys.push(key);
        async.each(cardsSet[key],function(card,callback){
            // HearthStone.Card163.findOne({id:card.id},function(err,cc){
            //     console.log(cc);
            //     callback();
            // });
            HearthStone.Card163.findOneAndUpdate({id:card.id},{$set:{name_en:card.name}},function(err,afrerCard){
                console.log(afrerCard);
                callback();
            });
        },function(err){
        });
    };

    res.send(keys);
}

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
                        console.log(deck);
                        // body...
                        HearthStone.Deck.update({deckSourceUrl:deckUrl},{$set:{channel:"163",deckSourceUrl:deckUrl,cards:deck}},{upsert:true},function(err,num){
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
            // console.log("cardsData",cardsData);
            for (var i = 0; i < cardsData.length; i++) {
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
