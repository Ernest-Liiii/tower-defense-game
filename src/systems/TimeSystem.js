// this file is used to manage the time-related logic in the game, such as tower shooting intervals and enemy spawn timing

export class TimeSystem {
    constructor(scene) {
        this.scene = scene;
        this.gameTime = 0;       // absolute game time in milliseconds
        this.timeScale = 1.0;    // current time scale (1.0 = normal speed, 0.5 = half speed, 2.0 = double speed)
        this.isPaused = false;   // whether the logic time is paused
    }

    update(delta) {
        if (this.isPaused) return; // if paused, do not update time

        // Update the absolute game time based on the delta and time scale
        this.gameTime += delta * this.timeScale;
    }

    setTimeScale(scale) {
        this.timeScale = scale;

        // Update the internal clock of the Phaser scene to reflect the new time scale
        this.scene.time.timeScale = scale;

        // For tweens, we also need to adjust their time scale
        this.scene.tweens.timeScale = scale;

        // For physics, we need to adjust the time scale of the world
        this.scene.physics.world.timeScale = 1.0 / scale;
    }

    get time() {
        return this.gameTime;
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
    }
}