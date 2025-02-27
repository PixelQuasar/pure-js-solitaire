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
