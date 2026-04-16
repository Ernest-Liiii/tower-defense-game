// this file is used to control and play the audios in audio file
// when the game is playing

export class MusicSystem {
    constructor(scene) {
        this.scene = scene;
        this.currentMusic = null;
        this.targetVolume = 0.3; // default volume
        this.fadeDuration = 1000; // default fade duration in milliseconds
    }

    playBGM(audioKey, volume = this.targetVolume) {
        this.targetVolume = volume;
        if (this.currentBGM) {
            let oldBGM = this.currentBGM;

            this.scene.tweens.killTweensOf(oldBGM);
            this.scene.tweens.add({
                targets: oldBGM,
                volume: 0,
                duration: this.fadeDuration,
                onComplete: () => {
                    oldBGM.stop();
                    oldBGM.destroy();
                }
            });
        }

        this.currentBGM = this.scene.sound.add(audioKey, { 
            loop: true, 
            volume: 0 
        });

        this.currentBGM.play();

        this.scene.tweens.add({
            targets: this.currentBGM,
            volume: this.targetVolume,
            duration: this.fadeDuration
        });
    }

    // Function called when player opens pause scene
    // BGM will be paused, and when player closes pause scene, BGM will resume
    pauseBGM(activeScene = null) {
        if (this.currentBGM && this.currentBGM.isPlaying) {
            let tweenScene = activeScene ? activeScene : this.scene;

            tweenScene.tweens.killTweensOf(this.currentBGM);
            tweenScene.tweens.add({
                targets: this.currentBGM,
                volume: 0,
                duration: this.fadeDuration,
                onComplete: () => {
                    this.currentBGM.pause();
                }
            });
        }
    }

    // Function called when player closes pause scene
    // BGM will be resumed
    resumeBGM(activeScene = null) {
        if (this.currentBGM) {
            let tweenScene = activeScene ? activeScene : this.scene;

            tweenScene.tweens.killTweensOf(this.currentBGM);

            if (this.currentBGM.isPaused) {
                this.currentBGM.resume();
            }

            tweenScene.tweens.add({
                targets: this.currentBGM,
                volume: this.targetVolume,
                duration: this.fadeDuration
            });
        }
    }

    // Function called when player opens game over scene
    // BGM will be stopped, and when player closes game over scene, BGM will play again
    stopBGM(immediate = false) {
        if (this.currentBGM) {
            this.scene.tweens.killTweensOf(this.currentBGM);

            if (immediate) {
                // Force stop and destroy immediately without animation!
                this.currentBGM.stop();
                this.currentBGM.destroy(); // Free memory
                this.currentBGM = null;
            } else {
                // Normal fade out stop
                this.scene.tweens.add({
                    targets: this.currentBGM,
                    volume: 0,
                    duration: this.fadeDuration,
                    onComplete: () => {
                        this.currentBGM.stop();
                        this.currentBGM.destroy();
                        this.currentBGM = null;
                    }
                });
            }
        }
    }
}