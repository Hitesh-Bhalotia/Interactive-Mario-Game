let config = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.FIT, // to fit to screen
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 800,
    height: 600,
  },
  backgroundColor: 0xffffff,

  //physics engine
  physics: {
    default: "arcade",
    arcade: {
      gravity: {
        y: 1000, // apply only in y direction
      },
    },
  },

  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

let game = new Phaser.Game(config);

let player_config = {
  player_speed: 150,
  player_jumpspeed: -700,
};

function preload() {
  this.load.image("ground", "Assets/topground.png");
  this.load.image("sky", "Assets/background.png");
  this.load.spritesheet("dude", "Assets/dude.png", {
    frameWidth: 32,
    frameHeight: 48,
  }); //size of each character
  this.load.image("apple", "Assets/apple.png");
  this.load.image("ray", "Assets/ray.png");
  this.load.spritesheet("fullscreen", "Assets/fullscreen.png", {
    frameWidth: 64,
    frameHeight: 64,
  });
}

function create() {
  W = game.config.width;
  H = game.config.height;
  this.score = 0;
  this.scoreText = null;

  //try to create a background
  let background = this.add.sprite(0, 0, "sky");
  background.setOrigin(0, 0);
  background.displayWidth = W;
  background.depth = -2;

  //add tilesprites
  let ground = this.add.tileSprite(0, H - 128, W, 128, "ground"); // repeating the tile image to cover the entire width
  ground.setOrigin(0, 0); //changing the origin to the top left corner of the tile image from the centre

  //create rays on the top of the background
  let rays = [];

  for (let i = -10; i <= 10; i++) {
    let ray = this.add.sprite(W / 2, H - 100, "ray");
    ray.displayHeight = 1.2 * H;
    ray.setOrigin(0.5, 1);
    ray.alpha = 0.2;
    ray.angle = i * 10;
    ray.depth = -1;
    rays.push(ray);
  }

  this.tweens.add({
    targets: rays,
    props: {
      angle: {
        value: "+=20",
      },
    },
    duration: 8000,
    repeat: -1,
  });

  //player
  this.player = this.physics.add.sprite(100, 100, "dude", 4); //4th frame by default
  this.player.setBounce(0.3); //set the bounce value
  this.player.setCollideWorldBounds(true); //do not allow outside the boundary

  //player animations and player movements
  this.anims.create({
    key: "left",
    frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1,
  });

  this.anims.create({
    key: "center",
    frames: this.anims.generateFrameNumbers("dude", { start: 4, end: 4 }),
    frameRate: 10,
  });

  this.anims.create({
    key: "right",
    frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 8 }),
    frameRate: 10,
    repeat: -1,
  });

  // to identify any keyboard strokes
  this.cursors = this.input.keyboard.createCursorKeys();

  //Add a bunch of apples
  let fruits = this.physics.add.group({
    key: "apple",
    repeat: 8,
    setScale: { x: 0.2, y: 0.2 },
    setXY: { x: 10, y: 0, stepX: 100 },
  });

  //add bouncing effect on all the apples
  fruits.children.iterate(function (f) {
    f.setBounce(Phaser.Math.FloatBetween(0.4, 0.7));
  });

  //Adding score
  this.scoreText = this.add.text(16, 16, "score: 0", {
    fontSize: "32px",
    fill: "#000",
  });

  //display fullscreen logo
  var button = this.add
    .image(800 - 16, 16, "fullscreen", 0)
    .setOrigin(1, 0)
    .setInteractive();

  button.on(
    "pointerup",
    function () {
      if (this.scale.isFullscreen) {
        button.setFrame(0);

        this.scale.stopFullscreen();
      } else {
        button.setFrame(1);

        this.scale.startFullscreen();
      }
    },
    this
  );

  this.scoreText.setText("Score: 0");

  var FKey = this.input.keyboard.addKey("F");

  FKey.on(
    "down",
    function () {
      if (this.scale.isFullscreen) {
        button.setFrame(0);
        this.scale.stopFullscreen();
      } else {
        button.setFrame(1);
        this.scale.startFullscreen();
      }
    },
    this
  );
  //create more platforms
  let platforms = this.physics.add.staticGroup();
  platforms.create(450, 350, "ground").setScale(2.0, 0.5).refreshBody(); // height,width -- > in setScale
  //refreshBody is used to change the shape of the body and not just in image
  platforms.create(700, 150, "ground").setScale(2.0, 0.5).refreshBody();
  platforms.create(100, 200, "ground").setScale(2.0, 0.5).refreshBody();
  platforms.add(ground);

  //add physics to ground
  this.physics.add.existing(ground);
  //ground.body.allowGravity = false;
  //ground.body.immovable = true;

  //detect collision
  this.physics.add.collider(platforms, this.player);
  //this.physics.add.collider(ground, fruits);
  this.physics.add.collider(fruits, platforms);
  this.physics.add.overlap(this.player, fruits, eatFruit, null, this);

  //create cameras
  this.cameras.main.setBounds(0, 0, W, H);
  this.physics.world.setBounds(0, 0, W, H);

  this.cameras.main.startFollow(this.player, true, true);
  this.cameras.main.setZoom(1);
}

function update() {
  if (this.cursors.left.isDown) {
    this.player.setVelocityX(-player_config.player_speed);
    this.player.anims.play("left", true);
  } else if (this.cursors.right.isDown) {
    this.player.setVelocityX(player_config.player_speed);
    this.player.anims.play("right", true);
  } else {
    this.player.setVelocityX(0);
    this.player.anims.play("center", true);
  }

  //add jumping ability, stop the player when in air
  if (this.cursors.up.isDown && this.player.body.touching.down) {
    this.player.setVelocityY(player_config.player_jumpspeed);
  }
}

function eatFruit(player, fruit) {
  fruit.disableBody(true, true);
  this.score += 10;
  this.scoreText.setText("Score: " + this.score);
}
