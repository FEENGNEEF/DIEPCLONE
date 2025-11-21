import { setupInput, getInputState } from './js/input.js';
import { setupNetwork } from './js/network.js';
import { createRenderer } from './js/render.js';
import { setupUi } from './js/ui.js';

const canvas = document.getElementById('game-canvas');
setupInput(canvas);
setupNetwork(() => getInputState());
createRenderer(canvas);
setupUi();
