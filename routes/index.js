var express = require('express');
var router = express.Router();
var unirest = require('unirest');
var hearthapi = require('../lib/hearthapi');
var async = require('async');
var fs = require('fs');
var _ = require('underscore');

var imageFolder = 'public/images/card/';
var utils = require('../lib/utils');
var HearthStone = require('../models/hearthstone');
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/allcards',allcards);
router.get('/getcards',getcards);

router.get('/matchdeck',matchdeck);

module.exports = router;

function matchdeck(req,res){
    var recommendDecks = [];
    var ids = [];//for debug
    HearthStone.User.findOne(/*{user:XXX},*/function(err,user){
      if(user){
        HearthStone.Deck.find(function(err,decks){
          async.eachSeries(decks,function(deck,callback){
            var cards = unionCards(user.cards,deck.cards,deck._id);
            if (recommendDecks.length < 3) {
              recommendDecks.push(cards);
              ids.push(deck._id);//for debug
            }else{
              for (var i = 0; i < recommendDecks.length; i++) {
                if(cards.sameCards.length > recommendDecks[i].sameCards.length){
                  recommendDecks[i] = cards;
                  ids[i] = deck._id;//for debug
                }
              };
            }
            callback();
          },function(err){
            console.log(ids);//for debug
            res.send(recommendDecks);
          });
        });
      }else{
        res.send("empty");
      }
      
    });
}

function unionCards(cards,deck,deckid){
  var sameArray = [];
  var originalDeck = new Array(deck);
  cards = _.map(cards,function(item){
    return item.cardName;
  });
  deck = _.map(deck,function(item){
    return item.cardName;
  });
  for (var i = 0; i < cards.length; i++) {
    var card = cards[i];
    var a = deck.indexOf(card); 
    if (a >= 0) {
      deck.splice(a, 1); 
      sameArray.push(card);
    }
  };
  return {
    percet:(sameArray.length*100/30).toFixed(0) + "%",
    deckid:deckid,
    sameCards:sameArray,
    originalDeck:originalDeck
  };
}

function allcards(req,res){
    hearthapi.getCards({},function(err,result){
        if (!err) {
            res.send(result);    
        }else{
            res.send(err);    
        }
    });
}

function saveCards(cards){
    for(var key in cards){
        async.eachSeries(cards[key],function(card,callback){
            HearthStone.Card.findOneAndUpdate({name:card.name},{$set:card},{upsert:true,"new":true},function(err,c){
                // console.log(err," c:",c);
                if (err || !c) {
                    callback();
                    return;
                };
                utils.mkdirs(imageFolder+card.name+'/');
                utils.mkdirs(imageFolder+card.name+'/gold/');
                if (card.img) {
                    var imgName = card.img.split('/').slice(-1).pop();
                    var normalpath = imageFolder+card.name+'/'+imgName;
                    fs.exists(normalpath, function (exists) {
                        if (!exists) {
                            utils.download(card.img, normalpath, function(err){
                                console.log(err);
                                if (!err) {
                                    c.img = normalpath;
                                    c.save();
                                };
                            });
                        };
                    });
                };
                if (card.imgGold) {
                    var imgName = card.imgGold.split('/').slice(-1).pop();
                    var goldpath = imageFolder+card.name+'/gold/'+imgName;
                    fs.exists(goldpath, function (exists) {
                        if (!exists) {
                            utils.download(card.imgGold, goldpath, function(err){
                                console.log(err);
                                if (!err) {
                                    c.imgGold = goldpath;
                                    c.save();
                                };
                            });
                        };
                    });
                };
                callback();
            });
            

        },function(err){
            
        });
        // cards[key].forEach(function(card,index){
            
        // });
    };
}

function getcards(req,res){
    var params = req.query;
    hearthapi.getCards(params,function(err,result){
        console.log(result);
        if (!err) {
            saveCards(result);
            res.render('card/cardlist',{cards:result});    
        }else{
            res.send(err);    
        }
    });
  //   res.render('card/cardlist',{cards:{ Basic:
  //  [ { cardId: 'CS1_113',
  //      name: 'Mind Control',
  //      cardSet: 'Basic',
  //      type: 'Spell',
  //      faction: 'Neutral',
  //      rarity: 'Common',
  //      cost: 10,
  //      text: 'Take control of an enemy minion.',
  //      flavor: 'Nominated as "Spell Most Likely to Make Your Opponent Punch the Wall."',
  //      artist: 'Sean O’Daniels',
  //      collectible: true,
  //      playerClass: 'Priest',
  //      howToGet: 'Unlocked at Level 10.',
  //      howToGetGold: 'Unlocked at Level 49.',
  //      img: 'http://wow.zamimg.com/images/hearthstone/cards/enus/original/CS1_113.png',
  //      imgGold: 'http://wow.zamimg.com/images/hearthstone/cards/enus/animated/CS1_113_premium.gif',
  //      locale: 'enUS' } ],
  // Classic:
  //  [ { cardId: 'NEW1_030',
  //      name: 'Deathwing',
  //      cardSet: 'Classic',
  //      type: 'Minion',
  //      rarity: 'Legendary',
  //      cost: 10,
  //      attack: 12,
  //      health: 12,
  //      text: '<b>Battlecry:</b> Destroy all other minions and discard your hand.',
  //      flavor: 'Once a noble dragon known as Neltharion, Deathwing lost his mind and shattered Azeroth before finally being defeated.  Daddy issues?',
  //      artist: 'Bernie Kang',
  //      collectible: true,
  //      elite: true,
  //      race: 'Dragon',
  //      img: 'http://wow.zamimg.com/images/hearthstone/cards/enus/original/NEW1_030.png',
  //      imgGold: 'http://wow.zamimg.com/images/hearthstone/cards/enus/animated/NEW1_030_premium.gif',
  //      locale: 'enUS',
  //      mechanics: [Object] },
  //    { cardId: 'EX1_279',
  //      name: 'Pyroblast',
  //      cardSet: 'Classic',
  //      type: 'Spell',
  //      faction: 'Neutral',
  //      rarity: 'Epic',
  //      cost: 10,
  //      text: 'Deal $10 damage.',
  //      flavor: 'Take the time for an evil laugh after you draw this card.',
  //      artist: 'Luca Zontini',
  //      collectible: true,
  //      playerClass: 'Mage',
  //      img: 'http://wow.zamimg.com/images/hearthstone/cards/enus/original/EX1_279.png',
  //      imgGold: 'http://wow.zamimg.com/images/hearthstone/cards/enus/animated/EX1_279_premium.gif',
  //      locale: 'enUS' },
  //    { cardId: 'EX1_586',
  //      name: 'Sea Giant',
  //      cardSet: 'Classic',
  //      type: 'Minion',
  //      faction: 'Neutral',
  //      rarity: 'Epic',
  //      cost: 10,
  //      attack: 8,
  //      health: 8,
  //      text: 'Costs (1) less for each other minion on the battlefield.',
  //      flavor: 'See?  Giant.',
  //      artist: 'Svetlin Velinov',
  //      collectible: true,
  //      img: 'http://wow.zamimg.com/images/hearthstone/cards/enus/original/EX1_586.png',
  //      imgGold: 'http://wow.zamimg.com/images/hearthstone/cards/enus/animated/EX1_586_premium.gif',
  //      locale: 'enUS' } ],
  // Credits:
  //  [ { cardId: 'CRED_13',
  //      name: 'Brian Schwab',
  //      cardSet: 'Credits',
  //      type: 'Minion',
  //      rarity: 'Legendary',
  //      cost: 10,
  //      attack: 10,
  //      health: 10,
  //      text: 'At the end of your turn, give a random minion +1 Attack.',
  //      elite: true,
  //      img: 'http://wow.zamimg.com/images/hearthstone/cards/enus/original/CRED_13.png',
  //      imgGold: 'http://wow.zamimg.com/images/hearthstone/cards/enus/animated/CRED_13_premium.gif',
  //      locale: 'enUS' } ],
  // Naxxramas:
  //  [ { cardId: 'FP1_014t',
  //      name: 'Thaddius',
  //      cardSet: 'Naxxramas',
  //      type: 'Minion',
  //      rarity: 'Legendary',
  //      cost: 10,
  //      attack: 11,
  //      health: 11,
  //      elite: true,
  //      img: 'http://wow.zamimg.com/images/hearthstone/cards/enus/original/FP1_014t.png',
  //      imgGold: 'http://wow.zamimg.com/images/hearthstone/cards/enus/animated/FP1_014t_premium.gif',
  //      locale: 'enUS' } ],
  // Debug: [],
  // 'Goblins vs Gnomes': [],
  // Missions: [],
  // Promotion: [],
  // Reward: [],
  // System: [],
  // 'Blackrock Mountain': [],
  // 'Hero Skins': [],
  // 'Tavern Brawl': [],
  // 'The Grand Tournament':
  //  [ { cardId: 'AT_120',
  //      name: 'Frost Giant',
  //      cardSet: 'The Grand Tournament',
  //      type: 'Minion',
  //      rarity: 'Epic',
  //      cost: 10,
  //      attack: 8,
  //      health: 8,
  //      text: 'Costs (1) less for each time you used your Hero Power this game.',
  //      flavor: 'Don\'t ask him about the beard.  JUST DON\'T.',
  //      artist: 'Greg Staples',
  //      collectible: true,
  //      img: 'http://wow.zamimg.com/images/hearthstone/cards/enus/original/AT_120.png',
  //      imgGold: 'http://wow.zamimg.com/images/hearthstone/cards/enus/animated/AT_120_premium.gif',
  //      locale: 'enUS' },
  //    { cardId: 'AT_072',
  //      name: 'Varian Wrynn',
  //      cardSet: 'The Grand Tournament',
  //      type: 'Minion',
  //      rarity: 'Legendary',
  //      cost: 10,
  //      attack: 7,
  //      health: 7,
  //      text: '<b>Battlecry:</b> Draw 3 cards.\nPut any minions you drew directly into the battlefield.',
  //      flavor: 'Leader of the Alliance!  Father of Anduin!  Also he likes to play Arena, and he averages 12 wins.',
  //      artist: 'Wei Wang',
  //      collectible: true,
  //      elite: true,
  //      playerClass: 'Warrior',
  //      img: 'http://wow.zamimg.com/images/hearthstone/cards/enus/original/AT_072.png',
  //      imgGold: 'http://wow.zamimg.com/images/hearthstone/cards/enus/animated/AT_072_premium.gif',
  //      locale: 'enUS',
  //      mechanics: [Object] } ] }});    


}
