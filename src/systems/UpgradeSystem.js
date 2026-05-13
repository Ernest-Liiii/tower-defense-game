// this file is used to manage the upgrade of the elemental towers, which is a new feature added in the game
// this file is used to manage the upgrade of the elemental towers

export class UpgradeSystem {
    constructor(scene) {
        this.scene = scene;
        
        // 升级配置表：定义塔在 2级 和 3级 时的各项数据
        // key: 塔的类型, value: 每个等级对应的数据字典
       this.upgradeData = {
            fire: {
                // 基础 HP 1500
                2: { cost: 50, range: 150, cooldown: 350, maxHp: 2000 }, 
                3: { cost: 120, range: 180, cooldown: 200, maxHp: 2500 }
            },
            wood: {
                // 基础 HP 1200
                2: { cost: 50, range: 150, cooldown: 600, maxHp: 1600 },
                3: { cost: 120, range: 180, cooldown: 400, maxHp: 2000 }
            },
            gold: {
                // 基础 HP 1000
                2: { cost: 60, baseGold: 20, buffedGold: 40, maxHp: 1500 }, 
                3: { cost: 150, baseGold: 40, buffedGold: 80, maxHp: 2000 }
            },
            water: {
                // 基础 HP 1500
                2: { cost: 70, healAmount: 40, shieldMax: 80, healRange: 120, maxHp: 2000 }, 
                3: { cost: 140, healAmount: 60, shieldMax: 120, healRange: 150, maxHp: 2500 }
            },
            earth: {
                // 基础 HP 4000 (肉盾)
                2: { cost: 80, stunDuration: 1500, baseCooldown: 4000, maxHp: 5500 }, 
                3: { cost: 160, stunDuration: 2000, baseCooldown: 3000, maxHp: 7000 }
            }
        };
        
        this.levelColors = {
            1: 0xaaaaaa, // 1级：银灰色
            2: 0x00d2ff, // 2级：天蓝色
            3: 0xffd700  // 3级：金黄色
        };
    }

    updateTowerLevelAura(tower) {
        // 如果塔身上还没有绘图对象，就创建一个
        if (!tower.levelAura) {
            tower.levelAura = this.scene.add.graphics();
            // 设置层级为 1，确保它在草地（0）之上，但在塔实体（2）之下
            tower.levelAura.setDepth(1); 
        }

        const graphics = tower.levelAura;
        graphics.clear(); // 清除之前的绘图

        const level = tower.level || 1;
        const color = this.levelColors[level];
        const radius = 22; // 基础半径（比塔的格子 20 稍微大一点点）

        // 根据等级绘制对应数量的圈
        // 1级画1个，2级画2个，3级画3个
        for (let i = 0; i < level; i++) {
            // 线条粗细随圈数略微变化，外圈更细一点
            const thickness = 3 - i; 
            const currentRadius = radius + (i * 4); // 每个圈往外扩大 4 像素
            
            graphics.lineStyle(thickness, color, 0.8 - (i * 0.2)); // 越外圈越透明
            graphics.strokeCircle(tower.x, tower.y, currentRadius);
        }
    }

    // 核心升级方法
    upgradeTower(tower) {
        if (!tower.active) return false;
        
        // 如果塔还没有等级，默认它现在是 1 级
        if (!tower.level) tower.level = 1;

        // 如果已经满级（3级），则无法继续升级
        if (tower.level >= 3) {
            this.showUpgradeText(tower, "MAX LEVEL!", '#ff0000');
            return false;
        }

        let nextLevel = tower.level + 1;
        let data = this.upgradeData[tower.type][nextLevel];

        // 检查玩家钱够不够
        if (this.scene.playerMoney >= data.cost) {
            // 1. 扣钱并更新 UI
            this.scene.playerMoney -= data.cost;
            this.scene.events.emit('updateMoney', this.scene.playerMoney);

            // 2. 更新塔的等级
            tower.level = nextLevel;

            // 3. 将配置表里的新属性直接注入到塔身上
            if (data.range) tower.range = data.range;
            if (data.cooldown) tower.cooldown = data.cooldown;
            if (data.baseGold) tower.baseGold = data.baseGold;
            if (data.buffedGold) tower.buffedGold = data.buffedGold;
            if (data.healAmount) tower.healAmount = data.healAmount;
            if (data.shieldMax) tower.shieldMax = data.shieldMax;
            if (data.healRange) tower.healRange = data.healRange;
            if (data.stunDuration) tower.stunDuration = data.stunDuration;
            if (data.baseCooldown) tower.baseCooldown = data.baseCooldown;

            // 4. 按比例提升当前血量，并提升血量上限
            if (data.maxHp) {
                let hpRatio = tower.hp / tower.maxHp;
                tower.maxHp = data.maxHp;
                tower.hp = Math.round(tower.maxHp * hpRatio);
            }

            this.updateTowerLevelAura(tower);

            // 5. 播放华丽的升级特效
            this.showUpgradeText(tower, `LV UP! (-${data.cost}$)`, '#00ff00');
            this.playUpgradeAnimation(tower);

            return true;
        } else {
            this.showUpgradeText(tower, "NO MONEY!", '#ff0000');
            return false;
        }
    }

    // --- 视觉特效辅助函数 ---
    showUpgradeText(tower, text, color) {
        let floatText = this.scene.add.text(tower.x, tower.y - 30, text, { 
            fontSize: '18px', fill: color, fontStyle: 'bold', stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: floatText, y: tower.y - 70, alpha: 0, duration: 1200,
            onComplete: () => floatText.destroy()
        });
    }

    playUpgradeAnimation(tower) {
        // 让塔产生一个放大的弹性动画，提示升级成功
        this.scene.tweens.add({
            targets: tower, scaleX: 1.3, scaleY: 1.3, duration: 150, yoyo: true, ease: 'Sine.easeInOut'
        });
    }
}