var mongoose = require('mongoose');

var DeckSchema = mongoose.Schema({
    deckSourceUrl:String,
    cards:[{
        cardName:String
    }]
});
exports.Deck = mongoose.model('Deck', DeckSchema);
