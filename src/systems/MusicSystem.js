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

    // this function will be used when the player open the pasueScene, 
    // then the bgm will be paused, and when the player close the pauseScene, the bgm will be resumed
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

    // this function will be used when the player close the pauseScene, 
    // then the bgm will be resumed
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

    // this function will be used when the player open the gameoverScene,
    // then the bgm will be stopped, and when the player close the gameoverScene, the bgm will be played again
    stopBGM(immediate = false) {
        if (this.currentBGM) {
            this.scene.tweens.killTweensOf(this.currentBGM);

            if (immediate) {
                // 强制立即停止并销毁，不播任何动画！
                this.currentBGM.stop();
                this.currentBGM.destroy(); // 释放内存
                this.currentBGM = null;
            } else {
                // 正常的淡出停止
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