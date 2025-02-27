import { CardObject } from './view/card-object.js';
import {
    checkCardMeeting,
    compareCards,
    getCardGameId,
    formatTime,
} from './utils.js';
import { ButtonObject } from './view/button-object.js';
import { MoveRestoreStock } from './moves.js';
import { CardPlace } from './field.js';
import { TableauStarterObject } from './view/tableau-starter-object.js';
import { LabelObject } from './view/label-object.js';
import { GameState } from './game-state.js';

/**
 * Renderer object
 * @param {GameState} gameState
 * @param {ViewSettings} viewSettings
 * @constructor
 */
export function Renderer(gameState, viewSettings) {
    /** @type {GameState} */
    this.gameState = gameState;

    /** @type {ViewSettings} */
    this.viewSettings = viewSettings;

    /** @type {Record<string, GameObject>} */
    this.gameObjects = {};

    /** @type {string[]} */
}

/**
 * Place card object on the field.
 * @param {Card} card
 * @private
 */
Renderer.prototype.appendCardObject = function (card) {
    const cardObject = new CardObject(card);
    cardObject.translate(
        this.viewSettings.spacing,
        this.viewSettings.spacing + this.viewSettings.cardHeight,
    );
    this.gameObjects[getCardGameId(card)] = cardObject;
};

/**
 * Init field view.
 * @private
 */
Renderer.prototype.initFieldObjects = function () {
    const tableau = this.gameState.getField().getTableau();
    const stock = this.gameState.getField().getStock();
    const foundation = this.gameState.getField().getFoundation();
    const waste = this.gameState.getField().getWaste();

    tableau.forEach((column, i) => {
        column.forEach((card) => {
            this.appendCardObject(card);
        });
    });

    foundation.forEach((column) => {
        column.forEach((card) => {
            this.appendCardObject(card);
        });
    });

    waste.forEach((card) => {
        this.appendCardObject(card);
    });

    stock.forEach((card) => {
        this.appendCardObject(card);
    });

    this.initRestockButton();
    this.initUiBar();

    tableau.forEach((_, i) => {
        const tableauStarter = new TableauStarterObject(i);
        tableauStarter.translate(
            this.viewSettings.spacing,
            this.viewSettings.spacing + this.viewSettings.cardHeight,
        );
        this.gameObjects[`STARTER_${i}`] = tableauStarter;
    });
};

/**
 * Place card object on the game object container.
 * @param {Card} card
 * @param {number} x
 * @param {number} y
 * @param {number} zIndex
 * @private
 */
Renderer.prototype.updateCardObject = function (card, x, y, zIndex) {
    const cardObject = this.gameObjects[getCardGameId(card)];
    if (!(cardObject instanceof CardObject)) {
        return;
    }
    cardObject.translate(x, y);
    cardObject.anchorTranslate(x, y);
    cardObject.setHidden(card.hidden);
    cardObject.setActive(card.interactable);
    cardObject.setZIndex(zIndex);
};

/**
 * Init restock button
 * @private
 */
Renderer.prototype.initRestockButton = function () {
    const restockButton = new ButtonObject('↺', 'restock-button', () => {
        if (!this.gameState.applyMove(new MoveRestoreStock())) {
            return;
        }
        this.arrangeField();
    });
    restockButton.translate(
        this.viewSettings.spacing,
        this.viewSettings.spacing + this.viewSettings.cardHeight,
    );
    this.gameObjects['RESTOCK'] = restockButton;
};

/**
 * Init undo button
 * @param {number} x
 * @param {number} y
 * @private
 */
Renderer.prototype.initUndoButton = function (x, y) {
    const undoButton = new ButtonObject('UNDO', 'undo-button', () => {
        this.gameState.revertMove();
        this.updateCardInstances();
        this.arrangeField();
    });
    undoButton.translate(x, y + this.viewSettings.spacing);
    this.gameObjects['UNDO'] = undoButton;
};

Renderer.prototype.initLabel = function (id, text, className, x, y) {
    const label = new LabelObject(text, className);
    label.translate(x, y);
    this.gameObjects[id] = label;
};

Renderer.prototype.initUiBar = function () {
    const uiYOffset = this.viewSettings.spacing * 1.5;
    this.initUndoButton(this.viewSettings.spacing, uiYOffset);
    this.initLabel(
        'SCORE',
        `score: ${this.gameState.score}`,
        'ui-label score',
        this.viewSettings.spacing + this.viewSettings.cardHeight * 2,
        uiYOffset,
    );

    this.initLabel(
        'HIGH',
        `high: ${this.gameState.score}`,
        'ui-label high-score',
        this.viewSettings.spacing + this.viewSettings.cardHeight * 4,
        uiYOffset,
    );

    this.initLabel(
        'TIME',
        `time: ${formatTime(this.gameState.time)}`,
        'ui-label timer',
        this.viewSettings.spacing + this.viewSettings.cardHeight * 6,
        uiYOffset,
    );

    setInterval(() => {
        this.gameObjects['TIME'].setLabel(
            `time: ${formatTime(this.gameState.time)}`,
        );
        if (this.gameState.status !== 'PLAYING') {
            this.arrangeField();
        }
    }, 1000);
};

/**
 * @private
 */
Renderer.prototype.clearField = function () {
    Object.entries(this.gameObjects).forEach(([identifier, gameObject]) => {
        if (identifier.includes('MENU')) {
            return;
        }
        gameObject.translate(-1000, -1000);
        if (gameObject instanceof CardObject) {
            gameObject.anchorTranslate(-1000, -1000);
        }
    });
};

/**
 * Place all card objects on the field.
 * @private
 */
Renderer.prototype.arrangeField = function () {
    const tableau = this.gameState.getField().getTableau();
    const stock = this.gameState.getField().getStock();
    const foundation = this.gameState.getField().getFoundation();
    const waste = this.gameState.getField().getWaste();

    const spacing = this.viewSettings.spacing;
    const cardWidth = this.viewSettings.cardWidth;
    const cardHeight = this.viewSettings.cardHeight;
    const yOffset = cardHeight;

    const stockWidth = cardWidth + spacing * 2;

    const foundationWidth = cardWidth + spacing * 2;

    const tableauWidth =
        this.viewSettings.viewWidth - stockWidth - foundationWidth;

    const stockOffset = spacing;

    const tableauLength = tableau.length;

    const tableauOffset =
        (tableauWidth - tableauLength * (cardWidth + spacing) - spacing) / 2 +
        stockWidth;

    const foundationOffset = stockWidth + tableauWidth + spacing;

    const wasteLength = waste.length;

    const stockLength = stock.length;

    const wasteSize = 3;

    if (this.gameState.status === 'VICTORY') {
        this.clearField();
        document.getElementById('victory').style.display = 'flex';
        return;
    } else if (this.gameState.status === 'DEFEAT') {
        this.clearField();
        document.getElementById('defeat').style.display = 'flex';
        return;
    }

    tableau.forEach((column, i) => {
        this.gameObjects[`STARTER_${i}`].translate(
            tableauOffset + i * (cardWidth + spacing),
            spacing + yOffset,
        );
        column.forEach((card, j) => {
            this.updateCardObject(
                card,
                tableauOffset + i * (cardWidth + spacing),
                spacing + j * spacing * 2 + yOffset,
                j,
            );
        });
    });

    foundation.forEach((column, i) => {
        column.forEach((card, j) => {
            this.updateCardObject(
                card,
                foundationOffset,
                spacing + i * (cardHeight + spacing) + yOffset,
                j,
            );
        });
    });

    waste.forEach((card, i) => {
        this.updateCardObject(
            card,
            stockOffset,
            cardWidth * 3 +
                spacing * 3 +
                cardWidth * 0.3 * Math.max(-wasteSize, i - wasteLength) +
                yOffset,
            stockLength + i,
        );
    });

    stock.forEach((card, i) => {
        this.updateCardObject(
            card,
            stockOffset,
            spacing + i * spacing * 0.01 + yOffset,
            i,
        );
    });

    this.gameObjects['SCORE'].setLabel(
        `score: ${String(this.gameState.score)}`,
    );
    this.gameObjects['HIGH'].setLabel(
        `high: ${String(this.gameState.highscore)}`,
    );

    this.gameState.checkVictory();
};

Renderer.prototype.restart = function () {
    this.gameState = new GameState(this.gameState.settings);
    this.initRender();
};

Renderer.prototype.updateCardInstances = function () {
    const tableau = this.gameState.getField().getTableau();
    const stock = this.gameState.getField().getStock();
    const foundation = this.gameState.getField().getFoundation();
    const waste = this.gameState.getField().getWaste();

    tableau.forEach((column) => {
        column.forEach((card) => {
            this.gameObjects[getCardGameId(card)].card = card;
        });
    });

    foundation.forEach((column) => {
        column.forEach((card) => {
            this.gameObjects[getCardGameId(card)].card = card;
        });
    });

    waste.forEach((card) => {
        this.gameObjects[getCardGameId(card)].card = card;
    });

    stock.forEach((card) => {
        this.gameObjects[getCardGameId(card)].card = card;
    });
};

/**
 * Handle click on card
 * @param {CardObject} cardObject
 */
Renderer.prototype.handleCardClick = function (cardObject) {
    let success = this.gameState.handleSingleCardAction(cardObject.card);
    if (success) {
        this.arrangeField();
    }
    return success;
};

/**
 * Handle collision of two cards
 * @param {CardObject} cardObject
 * @returns {boolean}
 */
Renderer.prototype.handleCardsCollision = function (cardObject) {
    this.handleDnDEnd(cardObject);
    let success = false;
    Object.entries(this.gameObjects).forEach(([id, gameObject]) => {
        if (success) {
            return;
        }
        if (gameObject instanceof CardObject) {
            if (
                getCardGameId(cardObject.card) === id ||
                gameObject.card.hidden
            ) {
                return;
            }
            if (
                checkCardMeeting(
                    cardObject.x,
                    cardObject.y,
                    gameObject.x,
                    gameObject.y,
                )
            ) {
                success = this.gameState.handleTwoCardsAction(
                    cardObject.card,
                    gameObject.card,
                );
                if (success) {
                    cardObject.setZIndex(gameObject.zIndex + 1);
                }
            }
        } else if (gameObject instanceof TableauStarterObject) {
            if (
                checkCardMeeting(
                    cardObject.x,
                    cardObject.y,
                    gameObject.x,
                    gameObject.y,
                )
            ) {
                success = this.gameState.handleStartTableau(
                    cardObject.card,
                    gameObject.getIndex(),
                );
                if (success) {
                    cardObject.setZIndex(1);
                }
            }
        }
    });
    if (success) {
        this.arrangeField();
    }
    return success;
};

/**
 * Handle mouse up event (click or dnd end)
 * @param cardObject
 * @param {"click" | "drag"} mode
 * @returns {boolean}
 */
Renderer.prototype.handleMouseUp = function (cardObject, mode) {
    if (mode === 'click') {
        return this.handleCardClick(cardObject);
    } else if (mode === 'drag') {
        return this.handleCardsCollision(cardObject);
    }
};

/**
 * Handle drag and drop of card
 * @param {CardObject} cardObject
 */
Renderer.prototype.handleCardDnD = function (cardObject) {
    if (cardObject.card.place === CardPlace.TABLEAU) {
        const tableau = this.gameState.getField().getTableau();
        let [tableauCol, tableauPos] = [-1, -1];
        tableau.forEach((column, i) => {
            column.forEach((card, j) => {
                if (compareCards(card, cardObject.card)) {
                    [tableauCol, tableauPos] = [i, j];
                }
            });
        });

        tableau[tableauCol].forEach((card, j) => {
            if (j > tableauPos) {
                const targetCard = this.gameObjects[getCardGameId(card)];
                targetCard.setDrag(true);
                targetCard.translate(
                    cardObject.x,
                    cardObject.y +
                        (j - tableauPos) * this.viewSettings.spacing * 2,
                );
                targetCard.setZIndex(cardObject.zIndex + j + 1);
            }
        });
    }
};

/**
 * Handle drag and drop end
 * @param {CardObject} cardObject
 */
Renderer.prototype.handleDnDEnd = function (cardObject) {
    if (cardObject.card.place === CardPlace.TABLEAU) {
        const tableau = this.gameState.getField().getTableau();
        let [tableauCol, tableauPos] = [-1, -1];
        tableau.forEach((column, i) => {
            column.forEach((card, j) => {
                if (compareCards(card, cardObject.card)) {
                    [tableauCol, tableauPos] = [i, j];
                }
            });
        });
        tableau[tableauCol].forEach((card, j) => {
            if (j > tableauPos) {
                const targetCard = this.gameObjects[getCardGameId(card)];
                targetCard.setDrag(false);
                targetCard.translate(targetCard.anchorX, targetCard.anchorY);
            }
        });
    }
};

/**
 * Render all game objects.
 * @param {HTMLDivElement} root - The root element to render the game objects on.
 */
Renderer.prototype.initRender = function (root) {
    this.initFieldObjects();
    const container = document.createElement('div');
    container.innerHTML = `
<div id="modal">
<div class="alert" id="victory">
     <h1 class="alertHeader">Victory!</h1>
     <h3>Reload to try again</h3>
</div>
<div class="alert" id="defeat">
     <h1 class="alertHeader">Defeat!</h1>
     <h3>Reload to try again</h3>
</div>
</div>
`;

    container.id = 'container';
    root.appendChild(container);
    Object.values(this.gameObjects).forEach((gameObject) => {
        gameObject.applyStyle();
        gameObject.applyEventListeners({
            mousedown: this.handleCardDnD.bind(this),
            mouseup: this.handleMouseUp.bind(this),
            mousemove: this.handleCardDnD.bind(this),
            mouseleave: this.handleDnDEnd.bind(this),
        });
        container.appendChild(gameObject.getElement());
    });

    setTimeout(() => {
        this.arrangeField();
    }, 200);
};
