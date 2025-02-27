import { GameObject } from './game-object.js';

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
