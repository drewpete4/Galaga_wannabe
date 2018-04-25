/**
 * Initialize the Game and starts it.
 */
var game = new Game();

function init() {
    if (game.init())
        game.start();
}

/**
 * Define an object to hold all our images for the game so images
 * are only ever created once. This type of object is known as a
 * singleton.
 */
var imageRepository = new function () {
    // Define images
    this.background = new Image();
    this.spaceship = new Image();
    this.bullet = new Image();
    this.enemy = new Image();
    this.enemyBullet = new Image();

    // Ensure all images have loaded before starting the game
    var numImages = 5;
    var numLoaded = 0;
    function imageLoaded() {
        numLoaded++;
        if (numLoaded === numImages) {
            window.init();
        }
    }
    this.background.onload = function () {
        imageLoaded();
    }
    this.spaceship.onload = function () {
        imageLoaded();
    }
    this.bullet.onload = function () {
        imageLoaded();
    }
    this.enemy.onload = function () {
        imageLoaded();
    }
    this.enemyBullet.onload = function () {
        imageLoaded();
    }

    // Set images src
    this.background.src = "imgs/bg.png";
    this.spaceship.src = "imgs/ship.png";
    this.bullet.src = "imgs/bullet.png";
    this.enemy.src = "imgs/enemy.png";
    this.enemyBullet.src = "imgs/bullet_enemy.png";
}

/**
 * Creates the Drawable object which will be the base class for
 * all drawable objects in the game. Sets up defualt variables
 * that all child objects will inherit, as well as the defualt
 * functions. 
 */
function Drawable() {
    this.init = function (x, y, width, height) {
        // Defualt variables
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    this.speed = 0;
    this.canvasWidth = 0;
    this.canvasHeight = 0;

    // Define abstract function to be implemented in child objects
    this.draw = function () {
    };
    this.move = function () {
    };
}


/**
 * Creates the Background object which will become a child of
 * the Drawable object. The background is drawn on the "background"
 * canvas and creates the illusion of moving by panning the image.
 */
function Background() {
    this.speed = 1; // Redefine speed of the background for panning

    // Implement abstract function
    this.draw = function () {
        // Pan background
        this.y += this.speed;
        this.context.drawImage(imageRepository.background, this.x, this.y);

        // Draw another image at the top edge of the first image
        this.context.drawImage(imageRepository.background, this.x, this.y - this.canvasHeight);

        // If the image scrolled off the screen, reset
        if (this.y >= this.canvasHeight)
            this.y = 0;
    };
}
// Set Background to inherit properties from Drawable
Background.prototype = new Drawable();

//creates the bullet object which the ship fires. the bullets are
//drawn on the "main" canvas
function Bullet(object) {
    this.alive = false; // Is true if the bullet is currently in use
    var self = object;
	/*
	 * Sets the bullet values
	 */
    this.spawn = function (x, y, speed) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.alive = true;
    };
    //Uses a dirty rectangle to erase the bullet and moves it. Return true
    //if the bullet moved off the screen indicating that the bullet is ready
    //to be cleared by the pool, otherwise draws the bullet.
    this.draw = function () {
        this.context.clearRect(this.x - 1, this.y - 1, this.width + 1, this.height + 1);
        this.y -= this.speed;
        if (self === "bullet" && this.y <= 0 - this.height) {
            return true;
        }
        else if (self === "enemyBullet" && this.y >= this.canvasHeight) {
            return true;
        }
        else {
            if (self === "bullet") {
                this.context.drawImage(imageRepository.bullet, this.x, this.y);
            }
            else if (self === "enemyBullet") {
                this.context.drawImage(imageRepository.enemyBullet, this.x, this.y);
            }

            return false;
        }
    };

    //resets the bullet values
    this.clear = function () {
        this.x = 0;
        this.y = 0;
        this.speed = 0;
        this.alive = false;
    };
}
Bullet.prototype = new Drawable();

/**
 * Custom Pool object. Holds Bullet objects to be managed to prevent
 * garbage collection.
 */
function Pool(maxSize) {
    var size = maxSize; // Max bullets allowed in the pool
    var pool = [];

    //Populates the pool array with bullet objects
    this.init = function (object) {
        if (object == "bullet") {
            for (var i = 0; i < size; i++) {
                // Initalize the object
                var bullet = new Bullet("bullet");
                bullet.init(0, 0, imageRepository.bullet.width, imageRepository.bullet.height);
                pool[i] = bullet;
            }
        }
        else if (object == "enemy") {
            for (var i = 0; i < size; i++) {
                var enemy = new Enemy();
                enemy.init(0, 0, imageRepository.enemy.width, imageRepository.enemy.height);
                pool[i] = enemy;
            }
        }
        else if (object == "enemyBullet") {
            for (var i = 0; i < size; i++) {
                var bullet = new Bullet("enemyBullet");
                bullet.init(0, 0, imageRepository.enemyBullet.width, imageRepository.enemyBullet.height);
                pool[i] = bullet;
            }
        }
    };

    //Grabs the last item in the list snd initializes it and pushes it
    //to the front of the array
    this.get = function (x, y, speed) {
        if (!pool[size - 1].alive) {
            pool[size - 1].spawn(x, y, speed);
            pool.unshift(pool.pop());
        }
    };
    //used for the ship to be able to get two bullets at once
    //if only the get()function is used twcie the ship is able
    //to fire and only have 1 bullet spawn instead of two
    this.getTwo = function (x1, y1, speed1, x2, y2, speed2) {
        if (!pool[size - 1].alive && !pool[size - 2].alive) {
            this.get(x1, y1, speed1);
            this.get(x2, y2, speed2);
        }
    };
    //Draws any in use bullets. If a bullet goes off the screen, clears
    //it and pushes it to the front of the array.
    this.animate = function () {
        for (var i = 0; i < size; i++) {
            // Only draw until we find a bullet that is not alive
            if (pool[i].alive) {
                if (pool[i].draw()) {
                    pool[i].clear();
                    pool.push((pool.splice(i, 1))[0]);
                }
            }
            else
                break;
        }
    };
}

//Create the Ship object that the player controls.the ship is drawn on 
// the ship canvas and uses dirty rectangles to move around the screen 
function Ship() {
    this.speed = 3;
    this.bulletPool = new Pool(30);
    this.bulletPool.init("bullet");
    var fireRate = 15;
    var counter = 0;

    this.draw = function () {
        this.context.drawImage(imageRepository.spaceship, this.x, this.y);
    };
    this.move = function () {
        counter++;
        // Determine if the action is move action
        if (KEY_STATUS.left || KEY_STATUS.right ||
            KEY_STATUS.down || KEY_STATUS.up) {
            // The ship moved, so erase it's current image so it can
            // be redrawn in it's new location
            this.context.clearRect(this.x, this.y, this.width, this.height);
            // Update x and y according to the direction to move and
            // redraw the ship. Change the else if's to if statements
            // to have diagonal movement.
            if (KEY_STATUS.left) {
                this.x -= this.speed
                if (this.x <= 0) // Keep player within the screen
                    this.x = 0;
            }
            if (KEY_STATUS.right) {
                this.x += this.speed
                if (this.x >= this.canvasWidth - this.width)
                    this.x = this.canvasWidth - this.width;
            }
            if (KEY_STATUS.up) {
                this.y -= this.speed
                if (this.y <= this.canvasHeight / 4 * 3)
                    this.y = this.canvasHeight / 4 * 3;
            }
            if (KEY_STATUS.down) {
                this.y += this.speed
                if (this.y >= this.canvasHeight - this.height)
                    this.y = this.canvasHeight - this.height;
            }
            // Finish by redrawing the ship
            this.draw();
        }
        if (KEY_STATUS.space && counter >= fireRate) {
            this.fire();
            counter = 0;
        }
    };
	/*
	 * Fires two bullets
	 */
    this.fire = function () {
        this.bulletPool.getTwo(this.x + 6, this.y, 3,
            this.x + 33, this.y, 3);
    };
}
Ship.prototype = new Drawable();

//creates the enemy ship object
function Enemy() {
    var percentFire = .01;
    var chance = 0;
    this.alive = false;

	/*
	 * Sets the Enemy values
	 */
    this.spawn = function (x, y, speed) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.speedX = 0;
        this.speedY = speed;
        this.alive = true;
        this.leftEdge = this.x - 90;
        this.rightEdge = this.x + 90;
        this.bottomEdge = this.y + 140;
    };

    // Move the enemy

    this.draw = function () {
        this.context.clearRect(this.x - 1, this.y, this.width + 1, this.height);
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x <= this.leftEdge) {
            this.speedX = this.speed;
        }
        else if (this.x >= this.rightEdge + this.width) {
            this.speedX = -this.speed;
        }
        else if (this.y >= this.bottomEdge) {
            this.speed = 1.5;
            this.speedY = 0;
            this.y -= 5;
            this.speedX = -this.speed;
        }

        this.context.drawImage(imageRepository.enemy, this.x, this.y);

        // Enemy has a chance to shoot every movement
        chance = Math.floor(Math.random() * 101);
        if (chance / 100 < percentFire) {
            this.fire();
        }
    };
    //  Fires a bullet

    this.fire = function () {
        game.enemyBulletPool.get(this.x + this.width / 2, this.y + this.height, -2.5);
    }

    // Resets the enemy values

    this.clear = function () {
        this.x = 0;
        this.y = 0;
        this.speed = 0;
        this.speedX = 0;
        this.speedY = 0;
        this.alive = false;
    };
}
Enemy.prototype = new Drawable();

/**
 * Creates the Game object which will hold all objects and data for
 * the game.
 */
function Game() {
	/*
	 * Gets canvas information and context and sets up all game
	 * objects. 
	 * Returns true if the canvas is supported and false if it
	 * is not. This is to stop the animation script from constantly
	 * running on browsers that do not support the canvas.
	 */
    this.init = function () {
        // Get the canvas elements
        this.bgCanvas = document.getElementById('background');
        this.shipCanvas = document.getElementById('ship');
        this.mainCanvas = document.getElementById('main');

        // Test to see if canvas is supported. Only need to
        // check one canvas
        if (this.bgCanvas.getContext) {
            this.bgContext = this.bgCanvas.getContext('2d');
            this.shipContext = this.shipCanvas.getContext('2d');
            this.mainContext = this.mainCanvas.getContext('2d');

            // Initialize objects to contain their context and canvas
            // information
            Background.prototype.context = this.bgContext;
            Background.prototype.canvasWidth = this.bgCanvas.width;
            Background.prototype.canvasHeight = this.bgCanvas.height;

            Ship.prototype.context = this.shipContext;
            Ship.prototype.canvasWidth = this.shipCanvas.width;
            Ship.prototype.canvasHeight = this.shipCanvas.height;

            Bullet.prototype.context = this.mainContext;
            Bullet.prototype.canvasWidth = this.mainCanvas.width;
            Bullet.prototype.canvasHeight = this.mainCanvas.height;

            Enemy.prototype.context = this.mainContext;
            Enemy.prototype.canvasWidth = this.mainCanvas.width;
            Enemy.prototype.canvasHeight = this.mainCanvas.height;

            // Initialize the background object
            this.background = new Background();
            this.background.init(0, 0); // Set draw point to 0,0

            // Initialize the ship object
            this.ship = new Ship();
            // Set the ship to start near the bottom middle of the canvas
            var shipStartX = this.shipCanvas.width / 2 - imageRepository.spaceship.width;
            var shipStartY = this.shipCanvas.height / 4 * 3 + imageRepository.spaceship.height * 2;
            this.ship.init(shipStartX, shipStartY, imageRepository.spaceship.width,
                imageRepository.spaceship.height);

            // Initialize the enemy pool object
            this.enemyPool = new Pool(30);
            this.enemyPool.init("enemy");
            var height = imageRepository.enemy.height;
            var width = imageRepository.enemy.width;
            var x = 100;
            var y = -height;
            var spacer = y * 1.5;
            for (var i = 1; i <= 18; i++) {
                this.enemyPool.get(x, y, 2);
                x += width + 25;
                if (i % 6 == 0) {
                    x = 100;
                    y += spacer
                }
            }

            this.enemyBulletPool = new Pool(50);
            this.enemyBulletPool.init("enemyBullet");

            return true;
        } else {
            return false;
        }
    };

    // Start the animation loop
    this.start = function () {
        this.ship.draw();
        animate();
    };
}


/**
 * The animation loop. Calls the requestAnimationFrame shim to
 * optimize the game loop and draws all game objects. This
 * function must be a gobal function and cannot be within an
 * object.
 */
function animate() {
    requestAnimFrame(animate);
    game.background.draw();
    game.ship.move();
    game.ship.bulletPool.animate();
    game.enemyPool.animate();
    game.enemyBulletPool.animate();
}


//the keycodes that will be mapped when a user presses a button.
KEY_CODES = {
    32: 'space',
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down',
}

//creates the array to hole the KEY_CODES and sets all their values 
//to fase checking true/false is the quickest way to check the status 
//of a  key pressand which one was pressed when determining when to 
//move ans which direction
KEY_STATUS = {};
for (code in KEY_CODES) {
    KEY_STATUS[KEY_CODES[code]] = false;
}
//sets up the document to listen to onkeydown events when a key is
//when a key is pressed it sets the appropriate direction to truen to 
//let us know which key it was 
document.onkeydown = function (e) {
    var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
    if (KEY_CODES[keyCode]) {
        e.preventDefault();
        KEY_STATUS[KEY_CODES[keyCode]] = true;
    }
}
//sets up the document to listen to ownkeyup event (fired when any key
//is released) when a key is released it sets the direction to false 
//to let us know which key it was
document.onkeyup = function (e) {
    var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
    if (KEY_CODES[keyCode]) {
        e.preventDefault();
        KEY_STATUS[KEY_CODES[keyCode]] = false;
    }
}

/**	
 * requestAnim shim layer by Paul Irish
 * Finds the first API that works to optimize the animation loop, 
 * otherwise defaults to setTimeout().
 */
window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (/* function */ callback, /* DOMElement */ element) {
            window.setTimeout(callback, 1000 / 60);
        };
})();