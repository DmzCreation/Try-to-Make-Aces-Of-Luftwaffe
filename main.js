function handleCollision(rect1, rect2) {
    // Mengecek apakah dua persegi panjang saling tumpang tindih
    if (rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y) {
        // Jika tumpang tindih, kembalikan true
        return true;
    }
    // Jika tidak tumpang tindih, kembalikan false
    return false;
}

function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}


class InputHandler {
    constructor(game) {
        this.game = game;

        document.addEventListener('keydown', (e) => {
            const key = e.key;
            if (!this.game.keys.includes(key) && ['a', 's', 'd', 'w', ' '].includes(key)) {
                this.game.keys.push(key);
                if (key === ' ') {
                    this.game.player.weapon.handleShoot(this.game.deltaTime);
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            const index = this.game.keys.indexOf(e.key);
            if (index > -1) {
                this.game.keys.splice(index, 1);
            }
        });
    }
}

class Mouse {
    constructor(game) {
        this.game = game;
        this.x = 0;
        this.y = 0;

        document.addEventListener('mousemove', (e) => {
            const canvasRect = this.game.canvas.getBoundingClientRect();
            this.x = e.clientX - canvasRect.left;
            this.y = e.clientY - canvasRect.top;
        });

        document.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                this.game.mouseDown = true;
            }
        });

        document.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.game.mouseDown = false;
            }
        });
    }
}

class Basic {
    constructor(game, x, y) {
        this.game = game;
        this.width = 5;
        this.x = x;
        this.y = y;
        this.height = 30;
        this.dmg = 25;
        this.color = 'yellow';
        this.markedForDeletion = false;
    }

    update() {
        this.y -= 10; // Move the projectile up
        this.handleCollision();
    }

    draw(context) {
        context.fillStyle = this.color;
        context.fillRect(this.x, this.y, this.width, this.height);
    }

    handleCollision() { 
        this.game.enemies.forEach((enemy) => {
            if (this.x <= enemy.x + enemy.width &&
                this.x + this.width >= enemy.x &&
                this.y <= enemy.y + enemy.height &&
                this.y + this.height >= enemy.y) {
                enemy.takeDamage(this.dmg);
                this.markedForDeletion = true; // Mark for deletion on hit
            }
        });

        // context.strokeRect(this.x, this.y + 30, this.width, this.height - 80)
        let boss = this.game.boss
        if(boss.x <= this.x + this.width && this.x <= boss.x + boss.width && this.y <= boss.baseHitboxY + boss.baseHitboxHeight && boss.baseHitboxY <= this.height + this.y){
            this.markedForDeletion = true
        }

        boss.propellers.forEach(propeller => {
            if(boss.propellerDestroyed < 2 && propeller.x <= this.x + this.width && this.x <= propeller.x + propeller.width && this.y <= propeller.y + propeller.height && propeller.y <= this.height + this.y){
                propeller.takeDamage(this.dmg)
                this.markedForDeletion = true
                

            }
        })

        let turret = boss.turret
        if(boss.propellerDestroyed == 2 && turret.x <= this.x + this.width && this.x <= turret.x + turret.width && this.y <= turret.y + turret.height && turret.y <= this.height + this.y ){
            turret.takeDamage(this.dmg)
            this.markedForDeletion = true

        }

    }
}

class Fire {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        // Define properties for fire projectiles
    }
    update() {
        // Update the position or other properties of the fire projectile
    }
    draw(context) {
        // Draw the fire projectile
    }
}

class RedBall {
    constructor(game, x, y, angle) {
        this.game = game;
        this.radius = 6;
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.dmg = 10;
        this.speed = 5;
        this.color = 'maroon';
        this.markedForDeletion = false;
    }

    update() {
        this.x += this.speed * Math.cos(this.angle);
        this.y += this.speed * Math.sin(this.angle);
        this.handleCollision();
    }

    draw(context) {
        context.beginPath();
        context.fillStyle = this.color;
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.fill();
    }

    handleCollision() {
        const player = this.game.player;
        const dx = this.x - (player.x + player.width / 2);
        const dy = this.y - (player.y + player.height / 2);
        const distance = Math.hypot(dx, dy);

        if (distance < this.radius + player.width / 2) {
            player.takeDamage(this.dmg);
            this.markedForDeletion = true;
        }
    }
}

class BigRedBall extends RedBall{
    constructor(game, x, y){
        super(game, x, y)
        this.radius = 10
        this.damage = 15
        this.speed = 6
    }

    update() {
        this.y += this.speed 
        this.handleCollision();
    }

    setDamage(dmg){this.damage = dmg}
}

class SpliterBullet {
    constructor(game, x, y, angle) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.radius = 15;
        this.color = 'lime';
        this.angle = angle;
        this.speed = 4;
        this.dmg = 35;

        this.exploded = false;
        this.travelDistance = 0;
        this.travelMax = 150;
        this.miniBullet = [];
        this.markedForDeletion = false
    }

    update(deltaTime) {
        if (this.travelDistance >= this.travelMax && !this.exploded) {
            this.exploded = true;
            this.handleTravel();
        }

        if (!this.exploded) {
            this.x += this.speed * Math.cos(this.angle);
            this.y += this.speed * Math.sin(this.angle);

            this.travelDistance += this.speed;

            this.handleBorder();
        } else {
            if(this.miniBullet.length == 0){
                this.markedForDeletion = true
            }
            this.miniBullet.forEach(bullet => bullet.update(deltaTime));
            this.miniBullet = this.miniBullet.filter(bullet => !bullet.markedForDeletion); // Filter out bullets marked for deletion
        }

        this.handleCollision();
    }

    draw(context) {
        if (this.exploded) {
            this.miniBullet.forEach(bullet => bullet.draw(context));
        } else {
            context.fillStyle = 'salmon';
            context.beginPath();
            context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            context.fill();
            context.closePath();
        }
    }

    handleCollision() {
        const player = this.game.player;
        const dx = this.x - (player.x + player.width / 2);
        const dy = this.y - (player.y + player.height / 2);
        const distance = Math.hypot(dx, dy);

        if (distance < this.radius + player.width / 2) {
            player.takeDamage(this.dmg);
            this.markedForDeletion = true;
        }
    }

    handleTravel() {
        const numberOfBullet = 18;
        const angleGap = 360 / numberOfBullet; // Degree
        const angleGapR = degreesToRadians(angleGap); // Radians

        for (let i = 0; i < numberOfBullet; i++) {
            this.miniBullet.push(new TinyBullet(this.game, this.x, this.y, degreesToRadians(i * angleGap)));
        }
    }

    handleBorder() {
        if (this.x < 0 || this.x > this.game.width || this.y < 0 || this.y > this.game.height) {
            this.markedForDeletion = true;
        }
    }
}

class TinyBullet {
    constructor(game, x, y, angle) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 6;
        this.angle = angle;
        this.speed = 5;
        this.damage = 15;
        this.markedForDeletion = false;
    }

    update(deltaTime) {
        this.x += this.speed * Math.cos(this.angle);
        this.y += this.speed * Math.sin(this.angle);

        this.handleBorder();
        this.handleCollision();
    }

    draw(context) {
        context.save();
        context.translate(this.x, this.y);
        context.rotate(this.angle);
        context.fillStyle = 'lime';
        context.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        context.restore();
    }

    handleCollision() {
        if (handleCollision(this, this.game.player)) {
            this.game.player.takeDamage(this.damage);
            this.markedForDeletion = true;
        }
    }

    handleBorder() {
        if (this.x < 0 || this.x > this.game.width || this.y < 0 || this.y > this.game.height) {
            this.markedForDeletion = true;
        }
    }
}



class SupplyEnemy {
    constructor(game, x, y, direction, code) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.code = code;
        this.width = 96;
        this.height = 96;
        this.direction = direction;
        this.speed = 4;
        this.velocityX = 0;
        this.velocityY = 0;
        this.health = 100;

        this.shootCooldown = 500; // Time between shots in milliseconds
        this.shootTimer = 0;
        this.markedForDeletion = false;
    }

    update(deltaTime) {
        if (this.health <= 0) {
            this.handleDeath();
            this.markedForDeletion = true;
        }

        // Update the shoot timer
        this.shootTimer += deltaTime;
        
        // Handle shooting
        if (this.shootTimer >= this.shootCooldown) {
            this.handleShoot();
            this.shootTimer = 0; // Reset shoot timer after shooting
        }

        this.handleMovement();
        this.handleBorder();
    }

    draw(context) {
        context.lineWidth = 1;
        context.strokeStyle = 'black';
        context.fillStyle = 'purple';
        context.fillRect(this.x, this.y, this.width, this.height);
        context.strokeRect(this.x, this.y, this.width, this.height);

        context.fillStyle = 'black'
        context.font = '16px Arial'
        context.fillText(this.health, this.x, this.y)
    }

    handleMovement() {
        switch (this.direction) {
            case 'up':
                this.velocityX = 0;
                this.velocityY = -this.speed;
                break;
            case 'down':
                this.velocityX = 0;
                this.velocityY = this.speed;
                break;
            case 'left':
                this.velocityX = -this.speed;
                this.velocityY = 0;
                break;
            case 'right':
                this.velocityX = this.speed;
                this.velocityY = 0;
                break;
        }

        this.x += this.velocityX;
        this.y += this.velocityY;
    }

    handleShoot() {
        const dx = this.game.player.x - this.x;
        const dy = this.game.player.y - this.y;
        const angle = Math.atan2(dy, dx);

        this.game.projectiles.push(new RedBall(this.game, this.x, this.y, angle));
    }

    handleBorder() {
        if (this.x >= this.game.width + 400 || this.x <= -400 || this.y <= -400 || this.y >= this.game.height + 400) {
            // Mark for deletion if it goes out of bounds
            this.markedForDeletion = true;
        }
    }

    handleDeath() {
        this.game.supplies.push(new SupplyCrate(this.game, this.x, this.y));
    }

    takeDamage(dmg) {
        this.health -= dmg;
    }
}

class SupplyCrate {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 64;
        this.height = 64;
        this.markedForDeletion = false;
        this.lifetime = 6000;
        this.timer = 0;

        this.speed = 4
        this.accumulatedFall = 0
        this.fallDistance = 100
    }

    update(deltaTime) {
        if(this.accumulatedFall< this.fallDistance){
            this.y += this.speed
            this.accumulatedFall += this.speed
        }
        this.handleDeletion(deltaTime);
        this.handleCollision();
        this.followPlayer()
    }

    draw(context) {
        context.strokeStyle = 'black';
        context.lineWidth = 2;
        context.fillStyle = 'lime';
        context.fillRect(this.x, this.y, this.width, this.height);
        context.strokeRect(this.x, this.y, this.width, this.height);
    }

    handleCollision() {
        let player = this.game.player;
        if (this.x <= player.x + player.width &&
            this.x + this.width >= player.x &&
            this.y + this.height >= player.y &&
            this.y <= player.y + player.height) {
            player.weapon.number++;
            this.markedForDeletion = true;
        }
    }

    handleDeletion(deltaTime) {
        if (this.timer >= this.lifetime) {
            this.markedForDeletion = true;
        } else {
            this.timer += deltaTime;
        }
    }

    followPlayer() {
        const player = this.game.player;
        const playerX = player.x + player.width / 2;
        const playerY = player.y + player.height / 2;
    
        // Hitung jarak dan arah ke pemain
        const dx = playerX - (this.x + this.width / 2);
        const dy = playerY - (this.y + this.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Hanya ikuti jika pemain dalam zona tertentu (radius)
        if (distance < 300) {
            // Normalisasi arah dan gerakkan crate
            const angle = Math.atan2(dy, dx);
            this.x += this.speed * Math.cos(angle);
            this.y += this.speed * Math.sin(angle);
        }
    }
}

class Boss {
    constructor(game) {
        this.game = game;
        this.width = 380;
        this.height = 180;
        this.x = (this.game.width - this.width) / 2;
        this.y = 80;
        this.speed = 2;
        this.health = 1000;
        this.shootCooldown = 1000;
        this.image = new Image();
        this.image.src = 'img/pesawat1.png';
        this.shootTimer = 0;
        this.propellers = [];
        this.turret = undefined;
        this.propellerDestroyed = 0;
        this.markedForDeletion = false;
        
        this.baseHitboxY = this.y + 30;
        this.baseHitboxHeight = this.height - 80;

        this.missileTimer = 0;
        this.missileCooldown = 4500;

        // Flags 
        this.supply1 = false;
        this.supply2 = false;
        this.instantMachineGun = false;

        this.setup();
    }

    update(deltaTime) {
        this.turret?.update(deltaTime);
        this.propellers.forEach(propeller => propeller.update(deltaTime));
        this.propellers = this.propellers.filter(propeller => !propeller.markedForDeletion);

        if (this.propellerDestroyed >= 1) {
            if (!this.instantMachineGun && this.propellerDestroyed === 1) {
                this.turret.rapidTimer = 7000;
                this.instantMachineGun = true;
            }

            this.handleMissileFiring(deltaTime);
            this.handleSupplyDrops();
        }

        if (this.propellerDestroyed === 2) {
            this.handleRapidFire();
            this.handleSupplyDrops();
        }

        // Example: Horizontal movement
        this.x += this.speed;
        if (this.x + this.width > this.game.width || this.x < 0) {
            this.speed = -this.speed;
        }
    }

    draw(context) {
        context.drawImage(this.image, 0, 0, 694, 309, this.x, this.y, this.width, this.height);
        context.strokeRect(this.x, this.baseHitboxY, this.width, this.baseHitboxHeight);

        this.turret?.draw(context);
        this.propellers.forEach(propeller => propeller.draw(context));
    }

    setup() {
        this.propellers.push(
            new Propeller(this.game, this.x + 40, this.y + 100),
            new Propeller(this.game, this.x + 100, this.y + 125),
            new Propeller(this.game, this.x + 260, this.y + 125),
            new Propeller(this.game, this.x + 317, this.y + 100)
        );
        this.turret = new Cannon(this.game, this.x + 150, this.y + 50);
    }

    handleMissileFiring(deltaTime) {
        if (this.missileTimer >= this.missileCooldown) {
            const x = Math.floor(this.x + Math.random() * this.width);
            const y = this.baseHitboxY;
            this.game.projectiles.push(new Missile(this.game, x, y));
            this.missileTimer = 0;
        } else {
            this.missileTimer += deltaTime;
        }
    }

    handleSupplyDrops() {
        if (!this.supply1 && this.propellerDestroyed === 1) {
            this.game.supplies.push(new SupplyCrate(this.game, this.x + 150, this.y + 50));
            this.supply1 = true;
        }
        if (!this.supply2 && this.propellerDestroyed === 2) {
            this.game.supplies.push(new SupplyCrate(this.game, this.x + 150, this.y + 50));
            this.supply2 = true;
        }
    }

    handleRapidFire() {
        if (this.instantMachineGun) {
            this.turret.rapidTimer = 7000;
            this.instantMachineGun = false;
        }
    }
}

class Propeller {
    constructor(game, x, y) {
        this.game = game;
        this.x = x - 5;
        this.y = y;
        this.width = 35;
        this.height = 50;
        this.hp = 500;

        this.shootCooldown = 5000;
        this.shootTimer = 2500;

        this.rushTime = 1500;
        this.rushLeft = 0;
        this.rushHour = false;
        this.markedForDeletion = false;

        this.bulletCooldown = 250;
        this.bulletTimer = 0;
    }

    update(deltaTime) {
        if (this.hp <= 0) {
            this.game.boss.propellerDestroyed++;
            this.markedForDeletion = true;
        }

        this.x += this.game.boss.speed;

        if (!this.rushHour && this.shootTimer >= this.shootCooldown) {
            this.rushHour = true;
            this.shootTimer = 0;
        } else {
            this.shootTimer += deltaTime;
        }

        if (this.rushHour) {
            this.handleShoot(deltaTime);
        }
    }

    draw(context) {
        context.strokeStyle = 'black';
        context.strokeRect(this.x, this.y, this.width, this.height);
    }

    handleShoot(deltaTime) {
        this.rushLeft += deltaTime;
        this.bulletTimer += deltaTime;

        if (this.bulletTimer >= this.bulletCooldown) {
            this.bulletTimer = 0;
            this.game.projectiles.push(new BigRedBall(this.game, this.x, this.y));
        }

        if (this.rushLeft >= this.rushTime) {
            this.rushHour = false;
            this.rushLeft = 0;
        }
    }

    takeDamage(dmg) {
        this.hp -= dmg;
    }
}

class Cannon {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 80;
        this.height = 90;
        this.hp = 1500;

        // Body
        this.centerX = this.x + this.width / 2;
        this.centerY = this.y + this.height / 2;
        this.radius = this.width / 2;

        // Head
        this.headWidth = 20;
        this.headHeight = 35;
        this.headX = -this.headWidth / 2;
        this.headY = -this.headHeight / 2 - this.radius;

        this.angleDeg = 360; // Initial angle in degrees

        this.shootCooldown = 6000;
        this.shootTimer = 0;

        this.rapidCooldown = 7000;
        this.rapidTimer = 6000;
        this.rapidOn = false;
        this.rapidBulletCooldown = 50;
        this.rapidBulletTimer = 0;

        this.markedForDeletion = false;
    }

    update(deltaTime) {
        this.centerX = this.x + this.width / 2;
        this.centerY = this.y + this.height / 2;

        if (this.hp <= 0) {
            this.markedForDeletion = true;
        }

        this.x += this.game.boss.speed;

        if (this.game.boss.propellerDestroyed >= 1) {
            this.handleShoot(deltaTime);
        }

        if (this.game.boss.propellerDestroyed >= 2) {
            const angle = Math.atan2(this.game.player.y - this.centerY, this.game.player.x - this.centerX);
            this.angleDeg = this.radiansToDegrees(angle);
        }
    }

    draw(context) {
        context.strokeStyle = 'black';
        context.lineWidth = 1;
        context.strokeRect(this.x, this.y, this.width, this.height);

        // Cannon Body
        context.beginPath();
        context.strokeStyle = 'yellow';
        context.arc(this.centerX, this.centerY, this.radius, 0, Math.PI * 2);
        context.stroke();
        context.closePath();

        // Save the current context state
        context.save();

        // Translate to the center of the cannon
        context.translate(this.centerX, this.centerY);

        // Rotate the context to the cannon head direction
        context.rotate(this.degreesToRadians(this.angleDeg));

        // Draw the cannon head
        context.strokeRect(this.headX, this.headY, this.headWidth, this.headHeight);

        // Restore the context to its original state
        context.restore();
    }

    handleShoot(deltaTime) {
        if (this.game.boss.propellerDestroyed >= 2) {
            this.shootTimer += deltaTime;
            if (this.shootTimer >= this.shootCooldown) {
                // Gunakan sudut yang benar dan konsisten
                const angle = this.degreesToRadians(this.angleDeg);
                const bulletX = this.centerX + Math.cos(angle) * (this.radius + this.headHeight / 2);
                const bulletY = this.centerY + Math.sin(angle) * (this.radius + this.headHeight / 2);
                this.game.projectiles.push(new SpliterBullet(this.game, bulletX, bulletY, angle));
                this.shootTimer = 0;
            }
        }
        
        if (this.rapidOn) {
            this.rapid(deltaTime);
        } else {
            this.rapidTimer += deltaTime;
            if (this.rapidTimer >= this.rapidCooldown) {
                this.rapidTimer = 0;
                this.rapidOn = true;
            }
        }
    }

    takeDamage(dmg) {
        if (this.game.boss.propellerDestroyed >= 2) {
            this.hp -= dmg;
        }
    }

    degreesToRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    radiansToDegrees(radians) {
        return radians * (180 / Math.PI);
    }

    rapid(deltaTime) {
        if (this.game.boss.propellerDestroyed < 2) {
            this.angleDeg -= 1;
            if (this.angleDeg < 0) {
                this.rapidOn = false;
                this.angleDeg += 360;
            }
            
            if (this.rapidBulletTimer >= this.rapidBulletCooldown) {
                this.rapidBulletTimer = 0;

                // Gunakan sudut yang benar dan konsisten
                const bulletAngle = this.degreesToRadians(this.angleDeg);
                const bulletX = this.centerX + Math.cos(bulletAngle) * (this.radius + this.headHeight / 2);
                const bulletY = this.centerY + Math.sin(bulletAngle) * (this.radius + this.headHeight / 2);

                this.game.projectiles.push(new TinyBullet(this.game, bulletX, bulletY, bulletAngle));
            } else {
                this.rapidBulletTimer += deltaTime;
            }
        }
    }
}


class Missile {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 10;
        this.speed = 6;

        this.homingTime = 4000;
        this.homingTimer = 0;
        this.angle = 0;
        this.damage = 15;
        this.markedForDeletion = false;

        // Pusat rotasi berada di bawah misil, misalnya di bagian belakang
        this.rotationOffsetX = 0;
        this.rotationOffsetY = this.height / 2;  // Menggeser pusat rotasi ke bagian belakang misil
    }

    update(deltaTime) {
        this.homingTimer += deltaTime;
        if (this.homingTimer <= this.homingTime) {
            this.handleHoming();
        } else {
            this.x += this.speed * Math.cos(this.angle);
            this.y += this.speed * Math.sin(this.angle);
        }

        this.handleBorder();
        this.handleCollision();
    }

    draw(context) {
        context.fillStyle = 'gray';
        context.save();
        
        // Pindahkan konteks ke pusat rotasi baru
        context.translate(this.x + this.width / 2 + this.rotationOffsetX, 
                          this.y + this.height / 2 + this.rotationOffsetY);
        context.rotate(this.angle);
        
        // Gambar misil, dengan posisi dikompensasi karena pusat rotasi telah bergeser
        context.fillRect(-this.width / 2 - this.rotationOffsetX, 
                         -this.height / 2 - this.rotationOffsetY, 
                         this.width, this.height);
                         
        context.restore();
    }

    handleBorder() {
        if (this.x < 0 || this.x > this.game.width || this.y < 0 || this.y > this.game.height) {
            this.markedForDeletion = true;
        }
    }

    handleCollision() {
        if (handleCollision(this, this.game.player)) {
            this.game.player.takeDamage(this.damage);
            this.markedForDeletion = true;
        }
    }

    handleHoming() {
        // Hitung jarak dari pusat rotasi yang baru ke player
        const dX = this.game.player.x - (this.x + this.width / 2 + this.rotationOffsetX);
        const dY = this.game.player.y - (this.y + this.height / 2 + this.rotationOffsetY);
        this.angle = Math.atan2(dY, dX);

        // Perbarui posisi berdasarkan sudut baru
        this.x += this.speed * Math.cos(this.angle);
        this.y += this.speed * Math.sin(this.angle);
    }
}


class Weapon {
    constructor(game, player) {
        this.game = game;
        this.player = player;
        this.width = 40;
        this.x = this.player.x + this.player.width / 2 - this.width / 2;
        this.y = this.player.y - 24;
        this.height = 16;
        this.type = 'normal';
        this.number = 2;

        this.shootCooldown = 200;
        this.shootTimer = 0;
    }

    update(deltaTime) {
        this.x = this.player.x + this.player.width / 2 - this.width / 2;
        this.y = this.player.y - 36;
    }

    draw(context) {
        context.strokeStyle = 'black';
        context.strokeRect(this.x, this.y, this.width, this.height);
    }

    handleShoot(deltaTime) {
        this.shootTimer += deltaTime;

        if (this.shootTimer >= this.shootCooldown) {
            let bulletWidth = 5;
            let bulletHeight = 30;
            let totalProjectileWidth = this.number * bulletWidth;
            let totalGapWidth = this.width - totalProjectileWidth;
            let gapWidth = totalGapWidth > 0 ? totalGapWidth / (this.number + 1) : 0;

            for (let i = 0; i < this.number; i++) {
                let x = this.x + gapWidth * (i + 1) + bulletWidth * i;
                let y = this.y + this.height / 2 - bulletHeight;
                if (this.type === 'normal') {
                    this.game.projectiles.push(new Basic(this.game, x, y));
                } else if (this.type === 'fire') {
                    this.game.projectiles.push(new Fire(this.game, x, y));
                }
            }
            this.shootTimer = 0;
        }
    }
}


class Player {
    constructor(game) {
        this.game = game;
        this.health = 200;
        this.width = 80;
        this.height = 80;
        this.x = this.game.width / 2 - this.width / 2;
        this.y = this.game.height - this.height - 64;
        this.baseSpeed = 550;
        this.velocityX = 0;
        this.velocityY = 0;
        this.maxMouseSpeed = 10; // Maximum speed when following the mouse

        // Initialize weapon after player properties are set
        this.weapon = new Weapon(this.game, this);
        this.dead = false
        this.deadAnimationTime = 5000
        this.deadAnimationTimer = 0
    }

    update(deltaTime) {
        if(this.hp <= 0){
            handleDeath(deltaTime)
        }
        else{
            if (this.game.mouseDown) {
                this.mouseMovement(deltaTime);
            } else {
                this.movementHandling(deltaTime);
            }
            this.weapon.update(deltaTime);

        }
    }

    draw(context) {
        if(this.dead){

        }
        this.weapon.draw(context);
        context.lineWidth = 1;
        context.strokeRect(this.x, this.y, this.width, this.height);

        context.fillStyle = 'black'
        context.font = '16px Arial'
        context.fillText(this.health, this.x, this.y)
    }

    movementHandling(deltaTime) {
    
        const left = this.game.keys.includes('a');
        const right = this.game.keys.includes('d');
        const up = this.game.keys.includes('w');
        const down = this.game.keys.includes('s');

        this.velocityX = 0;
        this.velocityY = 0;

        if (left) this.velocityX = -this.baseSpeed;
        if (right) this.velocityX = this.baseSpeed;
        if (up) this.velocityY = -this.baseSpeed;
        if (down) this.velocityY = this.baseSpeed;

        // Normalize diagonal movement
        if ((left || right) && (up || down)) {
            const normalizationFactor = Math.sqrt(2) / 2;
            this.velocityX *= normalizationFactor;
            this.velocityY *= normalizationFactor;
        }

        this.x += this.velocityX * deltaTime / 1000;
        this.y += this.velocityY * deltaTime / 1000;

        // Ensure the player stays within the canvas boundaries
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > this.game.width) this.x = this.game.width - this.width;
        if (this.y < 0) this.y = 0;
        if (this.y + this.height > this.game.height) this.y = this.game.height - this.height;
    }

    mouseMovement(deltaTime) {
        const mouse = this.game.mouse;
        const planeTailX = this.x + this.width / 2;
        const planeTailY = this.y + this.height;
        const dx = mouse.x - planeTailX;
        const dy = mouse.y - planeTailY;
        const distance = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);

        if (distance > 1) {
            // Adjust speed based on distance to make it smoother
            const speed = Math.min(distance / 7, this.maxMouseSpeed);
            this.x += Math.cos(angle) * speed;
            this.y += Math.sin(angle) * speed;
        }

        this.weapon.handleShoot(deltaTime);
    }

    takeDamage(dmg) {
        this.health -= dmg;
    }
    
    deathAnimation(deltaTime){
        if(!this.dead){
            this.dead = true
        }
        else{
            if(this.deadAnimationTimer >= this.deadAnimationTime){
                this.game.gameOver = true
            }
            else{
                this.deadAnimationTimer += deltaTime
            }
        }
    }
}

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.width = canvas.width;
        this.height = canvas.height;
        this.player = new Player(this);
        this.mouse = new Mouse(this);
        this.input = new InputHandler(this);
        this.mouseDown = false;
        this.keys = [];
        this.projectiles = [];
        this.enemies = [];
        this.supplies = [];
        this.boss = new Boss(this)

        this.enemyTimer = 5000;
        this.enemyCooldown = 10000;

        this.gameOver = false
    }

    update(deltaTime) {
        this.projectiles.forEach((projectile, index) => {
            projectile.update(deltaTime);
            if (projectile.y < 0 || projectile.markedForDeletion) {
                this.projectiles.splice(index, 1); // Remove projectile if it goes off-screen
            }
        });
        this.player.update(deltaTime);
        this.supplies.forEach((supply, index) => {
            supply.update(deltaTime);
            if (supply.markedForDeletion) {
                this.supplies.splice(index, 1);
            }
        });
        this.enemies.forEach((enemy, index) => {
            enemy.update(deltaTime);
            if (enemy.markedForDeletion) {
                this.enemies.splice(index, 1);
            }
        });
        this.boss.update(deltaTime)

        if (this.enemyTimer >= this.enemyCooldown) {
            // this.spawnSupply();
            this.enemyTimer = 0;
        } else {
            this.enemyTimer += deltaTime;
        }
    }

    draw(context) {
        this.boss.draw(context)
        this.player.draw(context);
        this.projectiles.forEach(projectile => {
            projectile.draw(context);
        });
        this.supplies.forEach(supply => supply.draw(context));
        this.enemies.forEach(enemy => enemy.draw(context));

    }

    spawnSupply() {
        let x = Math.random() > 0.5 ? -400 : this.width + 400;
        let direction = x < 0 ? 'right' : 'left';
        let y = 200 + Math.floor(Math.random() * (this.height - 200));
        let code = ['!', '@', '#', '$', '%', '^', '&', '*'];
        let randomCode = code[Math.floor(Math.random() * code.length)];
    
        for (let i = 0; i < 3; i++) {
            let spawnX = direction === 'right' ? x + 200 * i : x - 200 * i;
    
            // Ensure the enemy stays within the new extended boundaries
            if (spawnX < -400) spawnX = -400;
            if (spawnX > this.width + 400) spawnX = this.width + 400;
    
            this.enemies.push(new SupplyEnemy(this, spawnX, y, direction, randomCode));
        }
    }
    
    
}

window.onload = () => {
    const canvas = document.getElementById('my-canvas');
    const ctx = canvas.getContext('2d');
    canvas.height = 960;
    canvas.width = 640;
    const game = new Game(canvas);

    canvas.addEventListener('contextmenu', function (event) {
        event.preventDefault();
    });

    let lastTime = 0;
    function animate(timeStamp) {
        const deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        game.update(deltaTime);
        game.draw(ctx);
        requestAnimationFrame(animate);
    }

    animate(0);
};
