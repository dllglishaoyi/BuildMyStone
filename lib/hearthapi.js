var unirest = require('unirest');
var querystring = require('querystring');

var api_config = {
    host:'https://omgvamp-hearthstone-v1.p.mashape.com/',
    "X-Mashape-Key":"S0NtvoXsawmsh1p9MxIQsIdhxkBWp10eOaTjsnDyPYQdYpFqrp"
}

function apiGet(method,params,callback){
  var query = '?'+querystring.stringify(params);
  unirest.get(api_config.host + method + query)
  .header("X-Mashape-Key",api_config["X-Mashape-Key"])
  .end(function (result) {
    callback(result);
  });
}

exports.getCards = function(params,callback) {
  apiGet("cards",params,function(result){
    if (result && result.status == 200) {
      callback(null,result.body);  
    }else{
      callback("fail",null);  
    }
    
  });
}
