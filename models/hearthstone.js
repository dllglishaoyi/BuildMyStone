var mongoose = require('mongoose');

var DeckSchema = mongoose.Schema({
    deckSourceUrl:String,
    cards:[{
        cardName:String
    }]
});
exports.Deck = mongoose.model('Deck', DeckSchema);

var CardSchema = mongoose.Schema({
    cardId:String,
    name:String,
    cost: Number,
    cardSet:String,
    type:String,
    faction:String,
    rarity:Number,
    health:Number,
    text:String,
    race:String,
    img:String,
    imgGold:String,
    locale:String,
    mechanics:[{
        name:String
    }]
});
exports.Card = mongoose.model('Card', CardSchema);

var UserSchema = mongoose.Schema({
    userName:String,
    cards:[{
        cardName:String
    }]
});
exports.User = mongoose.model('User', UserSchema);