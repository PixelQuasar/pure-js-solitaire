import { DefaultConfig } from './config.js';

const config = new DefaultConfig();

/**
 * @typedef {(event?: MouseEvent, handler?: (ctx: any) => boolean) => void} ActionHandler
 */

/**
 * @typedef {Record<string, ActionHandler>} ActionEventHandlers
 */

/**
 * Check if the cards are intersecting
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @returns {boolean}
 */
export function checkCardMeeting(x1, y1, x2, y2) {
    return (
        Math.abs(x1 - x2) <= config.viewSettings.cardWidth &&
        Math.abs(y1 - y2) <= config.viewSettings.cardHeight
    );
}

/**
 * Check if the card can be placed by the rules of solitaire
 * @param {Card} cardA - source
 * @param {Card} cardB - target
 * @returns {boolean}
 */
export function canBePlaced(cardA, cardB) {
    //return true;
    return cardA.rank === cardB.rank - 1 && cardA.suit % 2 !== cardB.suit % 2;
}

/**
 * Get card game id
 * @param {Card} card
 * @returns {string}
 */
export function getCardGameId(card) {
    return `${card.rank}-${card.suit}`;
}

/**
 * Compare two cards by comparing their rank and suit
 * @param {Card} cardA
 * @param {Card} cardB
 * @returns {boolean}
 */
export function compareCards(cardA, cardB) {
    return cardA.rank === cardB.rank && cardA.suit === cardB.suit;
}

/**
 * Find card in array
 * @param {Card[]} array
 * @param {Card} card
 * @returns {number}
 */
export function findCardIndex(array, card) {
    return array.findIndex((c) => compareCards(c, card));
}

/**
 * Find column by card
 * @param {Card[][]} tableau
 * @param {Card} card
 * @returns {Card[]}
 */
export function findColumn(tableau, card) {
    return tableau.find((column) => findCardIndex(column, card) !== -1);
}

/**
 * Find column index by card
 * @returns {number}
 */
export function getHighScore() {
    return Number(localStorage.getItem('high_score')) || 0;
}

/**
 * Set high score
 * @param {number} score
 */
export function setHighScore(score) {
    localStorage.setItem('high_score', score);
}

/**
 * Get current time
 * @param {number} time
 * @returns {string}
 */
export function formatTime(time) {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}
