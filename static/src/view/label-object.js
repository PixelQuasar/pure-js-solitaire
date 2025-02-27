import { GameObject } from './game-object.js';

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
