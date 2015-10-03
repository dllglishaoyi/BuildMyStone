var express = require('express');
var router = express.Router();
var unirest = require('unirest');
var hearthapi = require('../lib/hearthapi');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/allcards',allcards);
router.get('/getcards',getcards);

module.exports = router;

function allcards(req,res){
    hearthapi.getCards({},function(err,result){
        if (!err) {
            res.send(result);    
        }else{
            res.send(err);    
        }
    });
}

function getcards(req,res){
    var params = req.query;
    hearthapi.getCards(params,function(err,result){
        if (!err) {
            res.send(result);    
        }else{
            res.send(err);    
        }
    });
}
