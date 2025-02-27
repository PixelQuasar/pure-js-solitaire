import { DefaultConfig } from './config.js';
import { Renderer } from './renderer.js';
import { GameState } from './game-state.js';

const config = new DefaultConfig();

const gameState = new GameState(config.gameSettings);

const renderer = new Renderer(gameState, config.viewSettings);

renderer.initRender(document.getElementById('root'));
