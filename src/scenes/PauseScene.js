// this is a file to store the pause scene of the game, 
// which will be shown when players click the pause button during the game

import { PauseUI } from '../ui/PauseUI.js';

export class PauseScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PauseScene' });
    }

    create() {
        // use the PauseUI class to create the pause screen
        this.ui = new PauseUI(this);
    }
}