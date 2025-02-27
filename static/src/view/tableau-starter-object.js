import { GameObject } from './game-object.js';

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
