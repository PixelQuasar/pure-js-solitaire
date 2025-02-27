/**
 * Represents a move in the game.
 * @param {string} type
 * @constructor
 */
function Move(type) {
    this.type = type;
}

/**
 * Represents a move from the stock to the waste.
 * @constructor
 * @augments Move
 */
export function MoveFromStockToWaste() {
    Move.call(this, 'MoveFromStockToWaste');
}
MoveFromStockToWaste.prototype = Object.create(Move.prototype);

/**
 * Represents a move from the waste to the tableau.
 * @param {Card} targetCard
 * @constructor
 * @augments Move
 */
export function MoveFromWasteToTableau(targetCard) {
    Move.call(this, 'MoveFromWasteToTableau');
    this.targetCard = targetCard;
}
MoveFromWasteToTableau.prototype = Object.create(Move.prototype);

/**
 * Represents a move from the waste to the foundation.
 * @constructor
 * @augments Move
 */
export function MoveFromWasteToFoundation() {
    Move.call(this, 'MoveFromWasteToFoundation');
}
MoveFromWasteToFoundation.prototype = Object.create(Move.prototype);

/**
 * Represents a move from the tableau to the foundation.
 * @param sourceCard
 * @constructor
 * @augments Move
 */
export function MoveFromTableauToFoundation(sourceCard) {
    Move.call(this, 'MoveFromTableauToFoundation');
    this.sourceCard = sourceCard;
}
MoveFromTableauToFoundation.prototype = Object.create(Move.prototype);

/**
 * Represents a move from one tableau column to another.
 * @param {Card} sourceCard
 * @param {Card} targetCard
 * @constructor
 * @augments Move
 */
export function MoveFromTableauToTableau(sourceCard, targetCard) {
    Move.call(this, 'MoveFromTableauToTableau');
    this.sourceCard = sourceCard;
    this.targetCard = targetCard;
}
MoveFromTableauToTableau.prototype = Object.create(Move.prototype);

/**
 * Represents a move from the foundation to the starter.
 * @param {Card} sourceCard
 * @param {number} columnNum
 * @constructor
 */
export function MoveFromTableauToStarter(sourceCard, columnNum) {
    Move.call(this, 'MoveFromFoundationToStarter');
    this.sourceCard = sourceCard;
    this.columnNum = columnNum;
}
MoveFromTableauToStarter.prototype = Object.create(Move.prototype);

/**
 * Represents a move from the waste to the starter.
 * @param {number} columnNum
 * @constructor
 */
export function MoveFromWasteToStarter(columnNum) {
    Move.call(this, 'MoveFromWasteToStarter');
    this.columnNum = columnNum;
}

/**
 * Represents a move from the tableau back to the tableau.
 * @constructor
 * @augments Move
 */
export function MoveRestoreStock() {
    Move.call(this, 'RestoreStock');
}
MoveRestoreStock.prototype = Object.create(Move.prototype);
