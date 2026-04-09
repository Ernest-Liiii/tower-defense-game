// this is a file to store the start scene of the game,
// which is the first scene that players will see when they launch the game

import { StartUI } from '../ui/StartUI.js';

export class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' });
    }

    create() {
        // use the StartUI class to create the start screen
        this.ui = new StartUI(this);
    }
}