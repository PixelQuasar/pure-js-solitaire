import { CardPlace, Field } from './field.js';
import {
    MoveFromStockToWaste,
    MoveFromWasteToTableau,
    MoveFromTableauToTableau,
    MoveFromTableauToFoundation,
    MoveFromWasteToFoundation,
    MoveFromTableauToStarter,
    MoveFromWasteToStarter,
} from './moves.js';
import { getHighScore, setHighScore } from './utils.js';

/**
 * Represents the state of the game.
 * @constructor
 * @param {GameSettings} gameSettings - Game settings.
 */
export function GameState(gameSettings) {
    /** @type {GameSettings} */
    this.settings = gameSettings;

    /**
     * @type {number}
     * @readonly
     */
    this.highscore = getHighScore();

    /** @type {number} */
    this.score = 0;

    /** @type {number} */
    this.time = 0;
    this.initTimer();

    /** @type {number} */
    this.moves = 0;

    /** @type {number} */
    this.score = 0;

    /** @type {boolean} */
    this.allowHints = gameSettings.allowHints;

    /** @type {boolean} */
    this.gameOver = false;

    /** @type {boolean} */
    this.gameWon = false;

    /** @type {Field} */
    this.field = new Field(gameSettings.fieldSettings);

    /** @type {Field[]} */
    this.stateStack = [];

    /** @type {"PLAYING"|"VICTORY"|"DEFEAT"} */
    this.status = 'PLAYING';
}

/**
 * Add number to current score
 * @param {number} n
 */
GameState.prototype.updateScore = function (n) {
    this.score += n;
    if (this.score > this.highscore) {
        setHighScore(this.score);
        this.highscore = this.score;
    }
};

/**
 * Check if the game is over
 */
GameState.prototype.checkVictory = function () {
    if (this.field.isVictory()) {
        this.updateScore((this.settings.time - this.time) * 10);
        this.status = 'VICTORY';
    }
};

/**
 * @private
 */
GameState.prototype.initTimer = function () {
    this.time = this.settings.time;
    const interval = setInterval(() => {
        this.time--;
        if (this.time === 0) {
            clearInterval(interval);
            this.status = 'DEFEAT';
        }
    }, 1000);
};

/**
 * Get current game time
 * @returns {number}
 */
GameState.prototype.getTime = function () {
    return this.time;
};

/**
 * Get game state current field
 * @returns {Field}
 */
GameState.prototype.getField = function () {
    return this.field;
};

/**
 * Validate and apply move to field
 * @param {Move} move
 * @returns {boolean}
 */
GameState.prototype.applyMove = function (move) {
    this.stateStack.push(this.field.pseudoDeepCopy());
    return this.field.applyMove(move);
};

/**
 * Revert last move
 */
GameState.prototype.revertMove = function () {
    if (this.stateStack.length) {
        this.field = this.stateStack.pop();
    }
};

/**
 * handle any action that appears between two cards
 * @param {Card} cardA
 * @param {Card} cardB
 * @returns {boolean}
 */
GameState.prototype.handleTwoCardsAction = function (cardA, cardB) {
    if (cardA.place === CardPlace.WASTE && cardB.place === CardPlace.TABLEAU) {
        return this.applyMove(new MoveFromWasteToTableau(cardB));
    } else if (
        cardA.place === CardPlace.TABLEAU &&
        cardB.place === CardPlace.TABLEAU
    ) {
        return this.applyMove(new MoveFromTableauToTableau(cardA, cardB));
    } else {
        return false;
    }
};

/**
 * handle special actions with empty tableau columns
 * @param {Card} card
 * @param {number} column
 * @returns {boolean}
 */
GameState.prototype.handleStartTableau = function (card, column) {
    switch (card.place) {
        case CardPlace.TABLEAU:
            return this.applyMove(new MoveFromTableauToStarter(card, column));
        case CardPlace.WASTE:
            return this.applyMove(new MoveFromWasteToStarter(column));
        default:
            return false;
    }
};

/**
 * handle any action that appears with single card
 * @param {Card} card
 * @returns {boolean}
 */
GameState.prototype.handleSingleCardAction = function (card) {
    let result;
    switch (card.place) {
        case CardPlace.STOCK:
            return this.applyMove(new MoveFromStockToWaste());
        case CardPlace.WASTE:
            result = this.applyMove(new MoveFromWasteToFoundation());
            if (result) {
                this.updateScore(100);
            }
            return result;
        case CardPlace.TABLEAU:
            result = this.applyMove(new MoveFromTableauToFoundation(card));
            if (result) {
                this.updateScore(100);
            }
            return result;
        default:
            return false;
    }
};
