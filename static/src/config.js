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
