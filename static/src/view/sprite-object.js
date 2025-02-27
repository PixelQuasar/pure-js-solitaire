import { GameObject } from './game-object.js';

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
