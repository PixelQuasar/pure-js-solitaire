/**
 *
 * @param {string} containerId
 * @param {Object} params
 */
function appSolitaire(containerId, params = {}) {
    const { cssPath, appConfig, jsonPath } = params;
    const container = document.getElementById(containerId);
    const wrapper = document.createElement('div');
    wrapper.classList.add('wrapper');
    container.appendChild(wrapper);
    if (cssPath) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = cssPath;
        document.head.appendChild(link);
    }

    (jsonPath
        ? loadJsonConfig(jsonPath)
        : appConfig
        ? Promise.resolve(appConfig)
        : Promise.resolve(new DefaultConfig())
    ).then((config) => {
        window.config = config;

        const gameState = new GameState(config.gameSettings);

        const renderer = new Renderer(gameState, config.viewSettings);

        renderer.initRender(document.getElementById(containerId));
    });
}

function loadJsonConfig(path) {
    return fetch(path)
        .then((response) => response.json())
        .catch((error) => {
            console.error('Error:', error);
        });
}

appSolitaire('root');

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
        Math.abs(x1 - x2) <= window.config.viewSettings.cardWidth &&
        Math.abs(y1 - y2) <= window.config.viewSettings.cardHeight
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

/**
 * Configuration
 * @typedef {Object} SolitaireConfig
 * @property {ViewSettings} display - Configuration for card display.
 * @property {GameSettings} gameSettings - Parameters for game settings.
 * @property {UserSettings} userSettings - Parameters for user settings.
 */

/**
 * Configuration for card display.
 * @typedef {Object} ViewSettings
 * @property {number} cardWidth - Width of the card in pixels.
 * @property {number} cardHeight - Height of the card in pixels.
 * @property {number} spacing - Spacing between cards in pixels.
 * @property {number} viewWidth - Width of the view in pixels.
 */

/**
 * Parameters for game field settings
 * @typedef {Object} FieldSettings
 * @property {number[]} tableauHeights - Number of cards in each tableau column.
 * @property {number} drawCount - Number of cards drawn at a time.
 */

/**
 * Parameters for game settings.
 * @typedef {Object} GameSettings
 * @property {number} time - Time limit for the game.
 * @property {FieldSettings} fieldSettings - Field settings.
 * @property {number} maxRedeals - Maximum number of redeals allowed.
 * @property {boolean} allowHints - Whether to allow hints or not.
 */

/**
 * Parameters for user settings.
 * @typedef {Object} UserSettings
 * @property {string} theme - Current theme (e.g., "classic", "dark").
 * @property {boolean} sound - Enable or disable sound effects.
 * @property {boolean} autoComplete - Enable automatic completion of the game.
 */

/**
 * Default config constructor
 * @constructor
 */
export function DefaultConfig() {
    /** @type ViewSettings */
    this.viewSettings = {
        cardWidth: 80,
        cardHeight: 112,
        spacing: 20,
        viewWidth: window.innerWidth,
    };

    /** @type GameSettings */
    this.gameSettings = {
        fieldSettings: {
            tableauHeights: [1, 2, 3, 4, 5, 6, 7],
            drawCount: 1,
        },
        maxRedeals: 3,
        allowHints: true,
        time: 60 * 15,
    };

    /** @type UserSettings */
    this.userSettings = {
        theme: 'classic',
        sound: true,
        autoComplete: true,
    };
}

/**
 * Tableau started object for handling moving tableau stacks to new empty columns
 * @param {number} index;
 * @constructor
 * @augments GameObject
 */
export function TableauStarterObject(index) {
    GameObject.call(this, document.createElement('div'));

    /** @type {number} */
    this.index = index;

    this.addClass('tableau-starter');
}
TableauStarterObject.prototype = Object.create(GameObject.prototype);

/**
 * @returns {number}
 */
TableauStarterObject.prototype.getIndex = function () {
    return this.index;
};

/**
 * @override
 */
TableauStarterObject.prototype.applyStyle = function () {
    this.element.style.transform = `translate(${this.x}px, ${this.y}px)`;
};

let zIndexInc = 0;

/**
 * Game object with sprite
 * @param {string} spriteUrl
 * @param {HTMLDivElement} element
 * @param {Record<string, EventListenerOrEventListenerObject>} eventHandlers
 * @constructor
 * @augments GameObject
 */
export function SpriteObject(spriteUrl, element, eventHandlers = {}) {
    GameObject.call(this, element, eventHandlers);

    /** @type {string} */
    this.sprite = spriteUrl;

    /** @type {number} */
    this.zIndex = 0;

    /** @type {boolean} */
    this.inFront = false;

    this.addClass('sprite');
}
SpriteObject.prototype = Object.create(GameObject.prototype);

/**
 * Draw the sprite object.
 * @override
 */
SpriteObject.prototype.applyStyle = function () {
    this.element.style.backgroundImage = `url(${this.sprite})`;
    this.element.style.transform = `translate(${this.x}px, ${this.y}px) rotate(${this.deg}deg) scaleX(${this.sizeX}) scaleY(${this.sizeY})`;
    this.element.style.zIndex = String(
        this.inFront ? this.zIndex + 1000000 : this.zIndex,
    );
};

/**
 * Update the sprite object's z-index.
 */
SpriteObject.prototype.updateZIndex = function () {
    this.zIndex = zIndexInc++;
    this.applyStyle();
};

/**
 * Set the sprite object's z-index.
 */
SpriteObject.prototype.setZIndex = function (zIndex) {
    this.zIndex = zIndex;
    this.applyStyle();
};

/**
 * Set the sprite URL.
 * @param {string} spriteUrl
 * @protected
 */
SpriteObject.prototype.setSprite = function (spriteUrl) {
    this.sprite = spriteUrl;
    this.applyStyle();
};

/**
 * Set the sprite in front of all other sprites.
 * @param {boolean} inFront
 * @protected
 */
SpriteObject.prototype.setInFront = function (inFront) {
    this.inFront = inFront;
    this.applyStyle();
};

/**
 * Label object
 * @param {string} label
 * @param {string} className
 * @param {boolean} disabled
 * @constructor
 * @augments GameObject
 */
export function LabelObject(label, className = '', disabled = false) {
    GameObject.call(this, document.createElement('p'));

    /** @type {string} */
    this.label = label;

    /** @type {boolean} */
    this.disabled = disabled;

    this.addClass('game-button');
    this.addClass(className);
}
LabelObject.prototype = Object.create(GameObject.prototype);

/**
 * @override
 */
LabelObject.prototype.applyStyle = function () {
    this.element.style.transform = `translate(${this.x}px, ${this.y}px)`;
    this.element.innerText = this.label;
};

/**
 * Set the label text.
 * @param {string} text
 */
LabelObject.prototype.setLabel = function (text) {
    this.label = text;
    this.applyStyle();
};

window.idInc = 0;

/**
 * Game object.
 * @param {HTMLDivElement} element
 * @param {ActionEventHandlers} eventHandlers
 * @constructor
 */
export function GameObject(element, eventHandlers = {}) {
    /** @type {HTMLDivElement} */
    this.element = element;

    /** @type {number} */
    this.id = window.idInc++;
    this.element.id = String(this.id);

    /** @type {number} */
    this.x = 0;

    /** @type {number} */
    this.y = 0;

    /** @type {number} */
    this.deg = 0;

    /** @type {number} */
    this.sizeX = 1;

    /** @type {number} */
    this.sizeY = 1;

    /** @type {boolean} */
    this.active = true;

    /** @type {Set<string>} */
    this.classNames = new Set(['game-object']);

    /** @type {Record<string, EventListenerOrEventListenerObject>} */
    this.eventHandlers = eventHandlers;
}

/**
 * get object HTML element
 * @returns {HTMLDivElement}
 */
GameObject.prototype.getElement = function () {
    return this.element;
};

/**
 * set object activity
 * @param {boolean} active
 */
GameObject.prototype.setActive = function (active) {
    this.active = active;
    this.toggleClass('game-object-inactive', !active);
};

/**
 * @param {string} className
 * @protected
 */
GameObject.prototype.addClass = function (className) {
    this.classNames.add(className);
    this.applyClassesAndId();
};

/**
 * @param {string} className
 * @protected
 */
GameObject.prototype.removeClass = function (className) {
    this.classNames.delete(className);
    this.applyClassesAndId();
};

/**
 * @param {string} className
 * @param {boolean} force
 * @protected
 */
GameObject.prototype.toggleClass = function (className, force = undefined) {
    if (force !== undefined) {
        if (force) {
            this.addClass(className);
        } else {
            this.removeClass(className);
        }
    } else {
        if (this.classNames.has(className)) {
            this.addClass(className);
        } else {
            this.removeClass(className);
        }
    }
};

/**
 * Translate the object.
 * @param {number} x
 * @param {number} y
 */
GameObject.prototype.translate = function (x, y) {
    this.x = x;
    this.y = y;
    this.applyStyle();
};

/**
 * Rotate the object.
 * @param {number} deg
 */
GameObject.prototype.rotate = function (deg) {
    this.deg = deg;
    this.applyStyle();
};

/**
 * Scale the object.
 * @param {number} size
 */
GameObject.prototype.scale = function (size) {
    this.sizeX = this.sizeY = size;
    this.applyStyle();
};

/**
 * Scale the object by X axis.
 * @param {number} sizeX
 */
GameObject.prototype.scaleX = function (sizeX) {
    this.sizeX = sizeX;
    this.applyStyle();
};

/**
 * Scale the object by Y axis.
 * @param {number} sizeY
 */
GameObject.prototype.scaleY = function (sizeY) {
    this.sizeY = sizeY;
    this.applyStyle();
};

/**
 * Draw the object.
 * @abstract
 */
GameObject.prototype.applyStyle = function () {
    throw new Error('applyStyle method not implemented');
};

/**
 * Apply the classes.
 * @private
 */
GameObject.prototype.applyClassesAndId = function () {
    this.element.id = String(this.id);
    this.element.className = Array.from(this.classNames).join(' ');
};

/**
 * Set the event handlers.
 * @param {Record<string, ActionHandler>} actionHandlers
 */
GameObject.prototype.applyEventListeners = function (actionHandlers) {
    for (const [eventType, handler] of Object.entries(this.eventHandlers)) {
        this.element.addEventListener(eventType, (event) => {
            if (this.active) {
                handler(event, actionHandlers[eventType]);
            }
        });
    }
};

/**
 * Remove the event handlers.
 */
GameObject.prototype.removeEventListeners = function () {
    for (const [event, handler] of Object.entries(this.eventHandlers)) {
        this.element.removeEventListener(event, handler);
    }
};

function getCardImg(suit, rank, hidden) {
    return hidden
        ? 'assets/png/cards/card-hidden.png'
        : `assets/png/cards/card-${suit}-${rank}.png`;
}

/**
 * Card object
 * @param {Card} card
 * @param {HTMLDivElement} element
 * @constructor
 * @augments SpriteObject
 */
export function CardObject(card, element = document.createElement('div')) {
    SpriteObject.call(
        this,
        getCardImg(card.suit, card.rank, card.hidden),
        element,
        this.getEventHandlers(),
    );

    /** @type {Card} */
    this.card = card;

    this.setHidden(card.hidden);

    /** @type {boolean} */
    this.drag = false;

    /** @type {number} */
    this.anchorX = 0;

    /** @type {number} */
    this.anchorY = 0;

    /** @type {number} */
    this.dragOffsetX = 0;

    /** @type {number} */
    this.dragOffsetY = 0;

    this.addClass('game-card');
    if (card.hidden) {
        this.addClass('hidden');
    }
}
CardObject.prototype = Object.create(SpriteObject.prototype);

/**
 * Get event handlers for the card.
 * @returns {ActionEventHandlers}
 * @private
 */
CardObject.prototype.getEventHandlers = function () {
    let clickStartTime = Date.now();
    return {
        mousedown: (event, dragOther) => {
            clickStartTime = Date.now();
            if (this.card.hidden) {
                return;
            }
            dragOther(this);
            this.setDrag(true);
            this.dragOffsetX = event.offsetX;
            this.dragOffsetY = event.offsetY;
        },
        mousemove: (event, moveOther) => {
            if (this.drag) {
                this.translate(
                    event.clientX - this.dragOffsetX,
                    event.clientY - this.dragOffsetY,
                );
                moveOther(this);
            }
        },
        mouseleave: (event, leaveOther) => {
            if (this.card.hidden) {
                return;
            }
            leaveOther(this);
            this.setDrag(false);
            this.translate(this.anchorX, this.anchorY);
        },
        mouseup: (event, actionHandler) => {
            this.setDrag(false);
            if (Date.now() - clickStartTime > 200) {
                if (!actionHandler(this, 'drag')) {
                    this.translate(this.anchorX, this.anchorY);
                }
            } else {
                actionHandler(this, 'click');
            }
        },
    };
};

/**
 * Set the hidden status of the card.
 * @param {boolean} hidden
 */
CardObject.prototype.setHidden = function (hidden) {
    this.toggleClass('hidden', hidden);
    this.scaleX(hidden ? -1 : 1);
    this.setActive(!hidden);
    this.card.hidden = hidden;

    setTimeout(() => {
        this.setSprite(getCardImg(this.card.suit, this.card.rank, hidden));
    }, 100);
};

/**
 * Set the drag status of the card.
 * @param {boolean} drag
 */
CardObject.prototype.setDrag = function (drag) {
    this.drag = drag;
    this.toggleClass('drag', drag);
    this.scale(1);
    this.rotate(0);
    this.setInFront(drag);
};

/**
 * Translate card anchor position
 * @param {number} x
 * @param {number} y
 */
CardObject.prototype.anchorTranslate = function (x, y) {
    this.anchorX = x;
    this.anchorY = y;
    this.translate(x, y);
};

function getCardImg(suit, rank, hidden) {
    return hidden
        ? 'assets/png/cards/card-hidden.png'
        : `assets/png/cards/card-${suit}-${rank}.png`;
}

/**
 * Card object
 * @param {Card} card
 * @param {HTMLDivElement} element
 * @constructor
 * @augments SpriteObject
 */
export function CardObject(card, element = document.createElement('div')) {
    SpriteObject.call(
        this,
        getCardImg(card.suit, card.rank, card.hidden),
        element,
        this.getEventHandlers(),
    );

    /** @type {Card} */
    this.card = card;

    this.setHidden(card.hidden);

    /** @type {boolean} */
    this.drag = false;

    /** @type {number} */
    this.anchorX = 0;

    /** @type {number} */
    this.anchorY = 0;

    /** @type {number} */
    this.dragOffsetX = 0;

    /** @type {number} */
    this.dragOffsetY = 0;

    this.addClass('game-card');
    if (card.hidden) {
        this.addClass('hidden');
    }
}
CardObject.prototype = Object.create(SpriteObject.prototype);

/**
 * Get event handlers for the card.
 * @returns {ActionEventHandlers}
 * @private
 */
CardObject.prototype.getEventHandlers = function () {
    let clickStartTime = Date.now();
    return {
        mousedown: (event, dragOther) => {
            clickStartTime = Date.now();
            if (this.card.hidden) {
                return;
            }
            dragOther(this);
            this.setDrag(true);
            this.dragOffsetX = event.offsetX;
            this.dragOffsetY = event.offsetY;
        },
        mousemove: (event, moveOther) => {
            if (this.drag) {
                this.translate(
                    event.clientX - this.dragOffsetX,
                    event.clientY - this.dragOffsetY,
                );
                moveOther(this);
            }
        },
        mouseleave: (event, leaveOther) => {
            if (this.card.hidden) {
                return;
            }
            leaveOther(this);
            this.setDrag(false);
            this.translate(this.anchorX, this.anchorY);
        },
        mouseup: (event, actionHandler) => {
            this.setDrag(false);
            if (Date.now() - clickStartTime > 200) {
                if (!actionHandler(this, 'drag')) {
                    this.translate(this.anchorX, this.anchorY);
                }
            } else {
                actionHandler(this, 'click');
            }
        },
    };
};

/**
 * Set the hidden status of the card.
 * @param {boolean} hidden
 */
CardObject.prototype.setHidden = function (hidden) {
    this.toggleClass('hidden', hidden);
    this.scaleX(hidden ? -1 : 1);
    this.setActive(!hidden);
    this.card.hidden = hidden;

    setTimeout(() => {
        this.setSprite(getCardImg(this.card.suit, this.card.rank, hidden));
    }, 100);
};

/**
 * Set the drag status of the card.
 * @param {boolean} drag
 */
CardObject.prototype.setDrag = function (drag) {
    this.drag = drag;
    this.toggleClass('drag', drag);
    this.scale(1);
    this.rotate(0);
    this.setInFront(drag);
};

/**
 * Translate card anchor position
 * @param {number} x
 * @param {number} y
 */
CardObject.prototype.anchorTranslate = function (x, y) {
    this.anchorX = x;
    this.anchorY = y;
    this.translate(x, y);
};

/**
 * Button object
 * @param {string} label
 * @param {string} className
 * @param {ActionHandler} onClick
 * @param {boolean} disabled
 * @constructor
 * @augments GameObject
 */
export function ButtonObject(
    label,
    className = '',
    onClick = () => {},
    disabled = false,
) {
    GameObject.call(this, document.createElement('button'), {
        click: onClick,
    });

    /** @type {string} */
    this.label = label;

    /** @type {boolean} */
    this.disabled = disabled;

    this.addClass('game-button');
    this.addClass(className);
}
ButtonObject.prototype = Object.create(GameObject.prototype);

/**
 * @override
 */
ButtonObject.prototype.applyStyle = function () {
    this.element.style.transform = `translate(${this.x}px, ${this.y}px)`;
    this.element.innerText = this.label;
    this.element.disabled = this.disabled;
};
