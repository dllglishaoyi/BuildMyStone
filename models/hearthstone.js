var mongoose = require('mongoose');

var DeckSchema = mongoose.Schema({
    channel:String,
    deckSourceUrl:String,
    cards:[{
        cardName:String
    }]
});
exports.Deck = mongoose.model('Deck', DeckSchema);

var CardSchema = mongoose.Schema({
    cardId:String,
    name:String,
    name_cn:String,
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
    }],
    source:String
});
exports.Card = mongoose.model('Card', CardSchema);

var Card163Schema = mongoose.Schema({
    attack:Number,
    card_id:String,
    collectible:Boolean,
    cost:Number,
    health:Number,
    id:String,
    img :String,
    klass:Number,
    name:String,
    powers:[String],
    race :Number,
    rarity:Number,
    // set:Number,
    type:Number,
    url:String
});
exports.Card163 = mongoose.model('Card163', Card163Schema);

var UserSchema = mongoose.Schema({
    userName:String,
    cards:[String]
});
exports.User = mongoose.model('User', UserSchema);