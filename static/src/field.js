import {
    MoveFromStockToWaste,
    MoveFromWasteToFoundation,
    MoveFromTableauToFoundation,
    MoveFromTableauToTableau,
    MoveFromTableauToStarter,
    MoveFromWasteToTableau,
    MoveRestoreStock,
    MoveFromWasteToStarter,
} from './moves.js';
import { canBePlaced, findCardIndex, findColumn } from './utils.js';

/**
 * @typedef {"stock"|"waste"|"tableau"|"foundation"} CardPlace
 */

export const CardSuit = {
    HEARTS: 1,
    DIAMONDS: 2,
    CLUBS: 3,
    SPADES: 4,
};

export const CardRank = {
    ACE: 0,
    TWO: 1,
    THREE: 2,
    FOUR: 3,
    FIVE: 4,
    SIX: 5,
    SEVEN: 6,
    EIGHT: 7,
    NINE: 8,
    TEN: 9,
    JACK: 10,
    QUEEN: 11,
    KING: 12,
};

export const CardPlace = {
    STOCK: 'stock',
    WASTE: 'waste',
    TABLEAU: 'tableau',
    FOUNDATION: 'foundation',
};

/**
 * Card class
 * @param {number} rank - Rank of the card.
 * @param {number} suit - Suit of the card.
 * @param {boolean} hidden - Whether the card is hidden.
 * @constructor
 */
function Card(rank, suit, hidden) {
    /** @type {number} */
    this.rank = rank;

    /** @type {number} */
    this.suit = suit;

    /** @type {CardPlace|null} */
    this.place = null;

    /** @type {boolean} */
    this.hidden = hidden;

    /** @type {boolean} */
    this.interactable = false;
}

/**
 * Generate a deck of cards
 * @returns {Card[]} The deck of cards.
 */
function genDeck() {
    let deck = [];
    for (let suit = 1; suit <= 4; suit++) {
        for (let rank = 0; rank <= 12; rank++) {
            deck.push(new Card(rank, suit, true));
        }
    }
    return deck;
}

/**
 * Shuffles an array of cards using the Fisher-Yates algorithm.
 * @param {Card[]} deck - The deck of cards to shuffle.
 * @returns {Card[]} The shuffled deck.
 */
function shuffleDeck(deck) {
    let shuffledDeck = [...deck];
    for (let i = shuffledDeck.length - 1; i > 0; i--) {
        const randomIndex = Math.floor(Math.random() * (i + 1));
        [shuffledDeck[i], shuffledDeck[randomIndex]] = [
            shuffledDeck[randomIndex],
            shuffledDeck[i],
        ];
    }
    return shuffledDeck;
}

/**
 * Field class
 * @param {FieldSettings} fieldSettings
 * @constructor
 */
export function Field(fieldSettings) {
    /** @type {FieldSettings} */
    this.fieldSettings = fieldSettings;

    const initialDeck = shuffleDeck(genDeck());
    const stockSize =
        initialDeck.length -
        fieldSettings.tableauHeights.reduce((a, b) => a + b);

    /** @type {Card[]} */
    this.stock = initialDeck.splice(0, stockSize);
    this.stock.forEach((card) => {
        card.place = CardPlace.STOCK;
    });
    this.stock[this.stock.length - 1].interactable = true;

    /** @type {Card[]} */
    this.waste = [];

    /** @type {[Card[], Card[], Card[], Card[]]} */
    this.foundation = [[], [], [], []];

    /** @type {Card[][]} */
    this.tableau = fieldSettings.tableauHeights.map((height) =>
        initialDeck.splice(0, height),
    );
    this.tableau.forEach((column) => {
        column.forEach((card) => {
            card.place = CardPlace.TABLEAU;
        });
        column[column.length - 1].hidden = false;
        column[column.length - 1].interactable = true;
    });
}

/**
 * Get the stock.
 * @returns {Card[]}
 */
Field.prototype.getStock = function () {
    return this.stock;
};

/**
 * Get the waste.
 * @returns {Card[]}
 */
Field.prototype.getWaste = function () {
    return this.waste;
};

/**
 * Get the tableau.
 * @returns {Card[][]}
 */
Field.prototype.getTableau = function () {
    return this.tableau;
};

/**
 * Get the foundation.
 * @returns {[Card[], Card[], Card[], Card[]]}
 */
Field.prototype.getFoundation = function () {
    return this.foundation;
};

/**
 * Move a card from the stock to the waste.
 * @private
 * @returns {boolean}
 */
Field.prototype.applyMoveFromStockToWaste = function () {
    if (this.stock.length > 0) {
        const card = this.stock.pop();
        if (this.stock.length) {
            this.stock[this.stock.length - 1].interactable = true;
        }
        card.place = CardPlace.WASTE;
        card.hidden = false;
        card.interactable = true;
        if (this.waste.length) {
            this.waste[this.waste.length - 1].interactable = false;
        }
        this.waste.push(card);
    }
    return true;
};

/**
 * Move a card from waste to foundation.
 * @private
 * @returns {boolean}
 */
Field.prototype.applyMoveFromWasteToFoundation = function () {
    const sourceCard = this.waste[this.waste.length - 1];
    const targetSuit = sourceCard.suit;
    const targetRank = this.foundation[targetSuit - 1].length;
    if (sourceCard.rank !== targetRank || sourceCard.suit !== targetSuit) {
        return false;
    }
    sourceCard.place = CardPlace.FOUNDATION;
    this.foundation[targetSuit - 1].push(sourceCard);
    this.waste.pop();
    if (this.waste.length) {
        this.waste[this.waste.length - 1].interactable = true;
    }
    return true;
};

/**
 * Move a card from tableau to foundation.
 * @private
 * @param {MoveFromTableauToFoundation} move
 * @returns {boolean}
 */
Field.prototype.applyMoveFromTableauToFoundation = function (move) {
    const targetSuit = move.sourceCard.suit;
    const targetRank = this.foundation[targetSuit - 1].length;
    if (
        move.sourceCard.rank !== targetRank ||
        move.sourceCard.suit !== targetSuit
    ) {
        return false;
    }
    const sourceColumn = findColumn(this.tableau, move.sourceCard);
    if (
        findCardIndex(sourceColumn, move.sourceCard) !==
        sourceColumn.length - 1
    ) {
        return false;
    }
    move.sourceCard.place = CardPlace.FOUNDATION;
    this.foundation[targetSuit - 1].push(move.sourceCard);

    sourceColumn.pop();
    if (sourceColumn.length) {
        const lastCard = sourceColumn[sourceColumn.length - 1];
        lastCard.hidden = false;
        lastCard.interactable = true;
    }
    return true;
};

/**
 * Move a card from waste to tableau.
 * @private
 * @param {MoveFromWasteToTableau} move
 * @returns {boolean}
 */
Field.prototype.applyMoveFromWasteToTableau = function (move) {
    const sourceCard = this.waste[this.waste.length - 1];
    if (!canBePlaced(sourceCard, move.targetCard)) {
        return false;
    }
    const targetColumn = findColumn(this.tableau, move.targetCard);
    sourceCard.place = CardPlace.TABLEAU;
    targetColumn.push(sourceCard);
    this.waste.pop();
    if (this.waste.length) {
        this.waste[this.waste.length - 1].interactable = true;
    }
    return true;
};

/**
 * Move cards from one tableau column to another.
 * @private
 * @param {MoveFromTableauToTableau} move
 * @returns {boolean}
 */
Field.prototype.applyMoveFromTableauToTableau = function (move) {
    if (!canBePlaced(move.sourceCard, move.targetCard)) {
        return false;
    }
    const targetColumn = findColumn(this.tableau, move.targetCard);
    const sourceColumn = findColumn(this.tableau, move.sourceCard);
    const movedCards = sourceColumn.slice(
        findCardIndex(sourceColumn, move.sourceCard) - sourceColumn.length,
    );
    movedCards.forEach((card) => {
        targetColumn.push(card);
        sourceColumn.pop();
    });
    if (sourceColumn.length) {
        const lastCard = sourceColumn[sourceColumn.length - 1];
        lastCard.hidden = false;
        lastCard.interactable = true;
    }
    return true;
};

/**
 * Revert a move from tableau to starter.
 * @param {MoveFromTableauToStarter} move
 * @returns {boolean}
 */
Field.prototype.applyMoveFromTableauToStarter = function (move) {
    if (
        move.sourceCard.rank !== CardRank.KING ||
        this.tableau[move.columnNum].length
    ) {
        return false;
    }
    const sourceColumn = findColumn(this.tableau, move.sourceCard);
    const targetColumn = this.tableau[move.columnNum];
    sourceColumn
        .slice(
            findCardIndex(sourceColumn, move.sourceCard) - sourceColumn.length,
        )
        .forEach((card) => {
            targetColumn.push(card);
            sourceColumn.pop();
        });
    if (sourceColumn.length) {
        const lastCard = sourceColumn[sourceColumn.length - 1];
        lastCard.hidden = false;
        lastCard.interactable = true;
    }
    return true;
};

/**
 * Revert a move from waste to starter.
 * @param {MoveFromWasteToStarter} move
 * @returns {boolean}
 */
Field.prototype.applyMoveFromWasteToStarter = function (move) {
    const sourceCard = this.waste[this.waste.length - 1];
    if (
        sourceCard.rank !== CardRank.KING ||
        this.tableau[move.columnNum].length
    ) {
        return false;
    }
    const targetColumn = this.tableau[move.columnNum];
    sourceCard.place = CardPlace.TABLEAU;
    targetColumn.push(sourceCard);
    this.waste.pop();
    if (this.waste.length) {
        this.waste[this.waste.length - 1].interactable = true;
    }
    return true;
};

/**
 * Restock the stock from the waste.
 * @returns {boolean}
 * @private
 */
Field.prototype.applyMoveRestoreStock = function () {
    if (this.stock.length) {
        return false;
    }
    this.stock = this.waste.reverse();
    this.stock.forEach((card) => {
        card.place = CardPlace.STOCK;
        card.hidden = true;
        card.interactable = false;
    });
    if (this.stock.length) {
        this.stock[this.stock.length - 1].interactable = true;
    }
    this.waste = [];
    return true;
};

/**
 * Apply a move to the field.
 * @param {Move} move - The move to apply.
 * @returns {boolean}
 */
Field.prototype.applyMove = function (move) {
    if (move instanceof MoveFromStockToWaste) {
        return this.applyMoveFromStockToWaste();
    } else if (move instanceof MoveFromWasteToFoundation) {
        return this.applyMoveFromWasteToFoundation();
    } else if (move instanceof MoveFromTableauToFoundation) {
        return this.applyMoveFromTableauToFoundation(move);
    } else if (move instanceof MoveFromTableauToTableau) {
        return this.applyMoveFromTableauToTableau(move);
    } else if (move instanceof MoveFromWasteToTableau) {
        return this.applyMoveFromWasteToTableau(move);
    } else if (move instanceof MoveRestoreStock) {
        return this.applyMoveRestoreStock();
    } else if (move instanceof MoveFromTableauToStarter) {
        return this.applyMoveFromTableauToStarter(move);
    } else if (move instanceof MoveFromWasteToStarter) {
        return this.applyMoveFromWasteToStarter(move);
    }
    return false;
};

/**
 * Deep copying all containers but shallow copying cards
 */
Field.prototype.pseudoDeepCopy = function () {
    const field = new Field(this.fieldSettings);
    field.stock = this.stock.map((card) => ({
        ...card,
    }));
    field.waste = this.waste.map((card) => ({
        ...card,
    }));
    field.tableau = this.tableau.map((column) =>
        column.map((card) => ({ ...card })),
    );
    field.foundation = this.foundation.map((column) =>
        column.map((card) => ({ ...card })),
    );
    return field;
};

Field.prototype.isVictory = function () {
    return this.foundation.every((column) => column.length === 13);
};
