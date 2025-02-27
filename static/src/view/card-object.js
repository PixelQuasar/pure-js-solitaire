import { SpriteObject } from './sprite-object.js';
import { GameObject } from './game-object.js';

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
