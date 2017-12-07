/* need to fix animations and stop repeating code so much */

window.onload = function() {
    //will use to rotate screen based on tilt of mobile device
    if (window.DeviceMotionEvent) {
        window.addEventListener("devicemotion", function() {
            
        }, false);
    } else {
        console.log("DeviceMotionEvent is not supported");
    }

    var a_canvas = document.getElementById("a");
    var context = a_canvas.getContext("2d");
    var showOptionsMenu = false;

    var cursor = new Image();
    cursor.src = "res/swordicon.png";
    var boat = new Image();
    boat.src = "res/boat.png";

    function Tile(width, height, image) {
        this.width = screen.tileWidth * width;
        this.height = screen.tileHeight * height;
        this.image = new Image();
        this.image.src = image;
    }
    var notifications = [];
    notifications.push("Move with W,A,S,D keys or by clicking/tapping");
    notifications.push("Press Esc to open options menu");
    notifications.push("Use number keys to select inventory slot");
    var map = {};
    var screen = {
        offsetX: 0,
        offsetY: 0,
        //TODO: base numrows and columns on screensize
        numRows: 15,
        numColumns: 15,
        mouseCanvasCoords: [0, 0],
        oldSelectionBoxCoords: [0, 0],
        selectionBoxCoords: [0, 0],
        tileX: 0,
        tileY: 0,
        notificationX: a_canvas.width * 0.02,
        notificationY: a_canvas.height * 0.045,
        notificationSpacing: 30,
        numOfInventorySlots: 4
    };
    screen.tileWidth = a_canvas.width / screen.numColumns;
    screen.tileHeight = a_canvas.height / screen.numRows;

    //TODO: function to update npc positions. Animate the movement if they are inside the player's vision
    var sounds = {
        walking: new Audio("res/walking.mp3")
    };
    var player = {
        name: "Jordan",
        screenTileX: Math.floor(screen.numRows / 2),
        screenTileY: Math.floor(screen.numColumns / 2),
        worldX: 150,
        worldY: 150,
        img: document.getElementById("player"),
        imgWidth: screen.tileWidth,
        imgHeight: screen.tileHeight * 2,
        moveSpeed: 5,
        isMoving: false,
        animationFrame: 0,
        movementQueue:[]
    };
    player.name = window.prompt("What is your name?");
    player.pixelX = player.screenTileX * screen.tileWidth;
    player.pixelY = player.screenTileY * screen.tileHeight - screen.tileHeight;
    player.animateMovement = function(direction) {
        //todo:change animation time to be based on distance to move, player's movement speed
        var animationTime = 1000;
        var numFrames = config.fps;
        screen.offsetX = 0;
        screen.offsetY = 0;
        player.isMoving = true;
        switch (direction) {
            case "east":
                player.worldX += screen.tileWidth;
                break;
            case "west":
                player.worldX -= screen.tileWidth;
                break;
            case "north":
                player.worldY -= screen.tileHeight;
                break;
            case "south":
                player.worldY += screen.tileHeight;
                break;
        }
    }

    var interface = {
        inventorySlotSelected: 0,
            icons: {
                hatchet: document.getElementById("hatchet"),
                treeSapling: document.getElementById("appletreesapling")
            },
    };
    var graphics = {
        redrawMap: function() {
            //camera centered on player so numRows and numColumns should always be odd
            var distLeftRight = (screen.numColumns - 1) / 2;
            var distTopBot = (screen.numRows - 1) / 2;
            var leftEdge = player.worldX - distLeftRight;
            var topEdge = player.worldY - distTopBot;
            for (var i = 0; i < screen.numColumns; i++) {
                for (var j = 0; j < screen.numRows; j++) {
                    switch (map.tileMap[Math.floor(leftEdge + i)][Math.floor(topEdge + j)]) {
                        case 0:
                            context.drawImage(tiles.grass.image, screen.tileWidth * i + screen.offsetX, screen.tileHeight * j + screen.offsetY, tiles.grass.width, tiles.grass.height);
                            break;
                        case 1:
                            context.drawImage(tiles.water.image, screen.tileWidth * i + screen.offsetX, screen.tileHeight * j + screen.offsetY, tiles.water.width, tiles.water.height);
                            break;
                        case 2:
                            context.drawImage(tiles.dirt.image, screen.tileWidth * i + screen.offsetX, screen.tileHeight * j + screen.offsetY, tiles.dirt.width, tiles.dirt.height);
                            break;
                    }
                }
            }
        },
        drawSelectionBox: function(newCoords, oldCoords) {
            context.beginPath();
            context.lineWidth = 3;
            context.strokeStyle = "yellow";
            context.rect(newCoords[0], newCoords[1], screen.tileWidth, screen.tileHeight);
            context.stroke();
        },
        drawPlayer: function() {
            //animation is completely broken
            var animationClips = [[8,7],[55,2],[102,2],[153,2],[8,150],[51,150],[104,150],[155,150],[8,76],[51,76],[104,76],[155,76],[8,220],[51,220],[104,220],[155,220]];
            var xClip = animationClips[player.animationFrame][0];
            var yClip = animationClips[player.animationFrame][1];
           
            context.font = "40px Comic Sans MS";
            context.strokeStyle = "yellow";
            context.lineWidth = 2;
            context.strokeText(player.name, player.pixelX - player.imgWidth / 2, player.pixelY);
            if (map.tileMap[Math.floor(player.worldX)][Math.floor(player.worldY)] === 1) {
                context.drawImage(boat, player.pixelX, player.pixelY, player.imgWidth, player.imgHeight);
            } else {
                context.drawImage(player.img, xClip, yClip, 32, 64, player.pixelX, player.pixelY, player.imgWidth, player.imgHeight);
            }
        },
        drawEnemies: function() {
            var distLeftRight = (screen.numColumns - 1) / 2;
            var distTopBot = (screen.numRows - 1) / 2;
            var leftEdge = player.worldX - distLeftRight;
            var rightEdge = player.worldX + distLeftRight;
            var topEdge = player.worldY - distTopBot;
            var botEdge = player.worldY + distTopBot;
            if (leftEdge < enemies.worldX < rightEdge && topEdge < enemies.worldY < botEdge) {
                var xClip;
                var yClip;
                switch (enemies.animationFrame) {
                    case 0:
                        xClip = 8;
                        yClip = 7;
                        break;
                    case 1:
                        xClip = 55;
                        yClip = 2;
                        break;
                    case 2:
                        xClip = 102;
                        yClip = 2;
                        break;
                    case 3:
                        xClip = 153;
                        yClip = 2;
                        break;
                    case 4:
                        xClip = 8;
                        yClip = 150;
                        break;
                    case 5:
                        xClip = 51;
                        yClip = 150;
                        break;
                    case 6:
                        xClip = 104;
                        yClip = 150;
                        break;
                    case 7:
                        xClip = 155;
                        yClip = 150;
                        break;
                    case 8:
                        xClip = 8;
                        yClip = 76;
                        break;
                    case 9:
                        xClip = 51;
                        yClip = 76;
                        break;
                    case 10:
                        xClip = 104;
                        yClip = 76;
                        break;
                    case 11:
                        xClip = 155;
                        yClip = 76;
                        break;
                    case 12:
                        xClip = 8;
                        yClip = 220;
                        break;
                    case 13:
                        xClip = 51;
                        yClip = 220;
                        break;
                    case 14:
                        xClip = 104;
                        yClip = 220;
                        break;
                    case 15:
                        xClip = 155;
                        yClip = 220;
                        break;
                }
                context.drawImage(enemies.img, xClip, yClip, 32, 64, player.pixelX, player.pixelY, enemies.imgWidth, enemies.imgHeight);
            }

        },
        drawCursor: function() {
            context.drawImage(cursor, screen.mouseCanvasCoords[0], screen.mouseCanvasCoords[1], 100, 100);
        },
        drawInterface: function() {
            var inventoryWidth = a_canvas.width * 0.7;
            var inventoryHeight = a_canvas.height * 0.15;
            var inventoryX = (a_canvas.width - inventoryWidth) / 2.0;
            var inventoryY = (a_canvas.height - inventoryHeight) * 0.9;
            context.beginPath();
            context.rect(inventoryX, inventoryY, inventoryWidth, inventoryHeight);
            context.lineWidth = 3;
            context.strokeStyle = "rgba(0,0,255,0.7)";
            context.stroke();
            context.fillStyle = "rgba(0,255,255,0.3)";
            context.fill();

            var numOfSlots = 6;
            var slotWidth = inventoryWidth / numOfSlots;
            var slotHeight = inventoryHeight;
            for (var i = 0; i < numOfSlots; i++) {
                var slotX = inventoryX + (slotWidth * i);
                var slotY = inventoryY;
                context.beginPath();
                context.lineWidth = 3;
                context.rect(slotX, slotY, slotWidth, slotHeight);
                //Todo: animate selection change, blue square sliding to the selected slot
                context.strokeStyle = "yellow";
                context.stroke();
                var fontSize = 72;
                context.fillStyle = "white";
                context.font = fontSize + "px Arial";
                context.fillText(i + 1,slotX + (slotWidth / 2) - (fontSize / 3),slotY + (slotHeight / 2) + (fontSize / 3),slotWidth);
                //slot numbers are not quite centered
            }
            var selectedSlotX = inventoryX + (slotWidth * interface.inventorySlotSelected);
            var selectedSlotY = inventoryY;
            context.lineWidth = 6;
            context.strokeStyle = "rgb(150,0,0)";
            context.beginPath();
            context.rect(selectedSlotX,selectedSlotY,slotWidth,slotHeight);
            context.stroke();
            context.drawImage(interface.icons.hatchet, inventoryX, inventoryY, slotWidth, slotHeight);
        },
        drawPlayerCoords: function() {
            context.fillStyle = "yellow";
            context.fillText("Screen Coords: (" + player.squareX + "," + player.squareY + ")", player.pixelX, player.pixelY + player.imgHeight + 20);
            context.fillText("Chunk Coords: ( , ) ", player.pixelX, player.pixelY + player.imgHeight + 40);
        },
        drawTrees: function() {
            var distLeftRight = (screen.numColumns - 1) / 2;
            var distTopBot = (screen.numRows - 1) / 2;
            var leftEdge = player.worldX - distLeftRight;
            var topEdge = player.worldY - distTopBot;
            //instead of looping throught each square and checking if there is a tree there
            //I should just loop through the trees
            for (var i = 0; i < screen.numColumns; i++) {
                for (var j = 0; j < screen.numRows; j++) {
                    switch (map.treeMap[Math.floor(leftEdge + i)][Math.floor(topEdge + j)]) {
                        case 1:
                            context.drawImage(tiles.tree1.image, (screen.tileWidth * i) - screen.tileWidth / 2 + screen.offsetX, screen.tileHeight * j + screen.offsetY, tiles.tree1.width, tiles.tree1.height);
                            break;
                        case 2:
                            context.drawImage(tiles.tree2.image, screen.tileWidth * i - screen.tileWidth / 2 + screen.offsetX, screen.tileHeight * j + screen.offsetY, tiles.tree2.width, tiles.tree2.height);
                            break;
                        case 4:
                            context.drawImage(tiles.flower.image, screen.tileWidth * i + screen.offsetX, screen.tileHeight * j + screen.offsetY, tiles.flower.width, tiles.flower.height);
                            break;
                    }
                }
            }
        },
        drawMouseCoords: function() {
            var tileX = Math.floor(screen.mouseCanvasCoords[0] / screen.tileWidth);
            var tileY = Math.floor(screen.mouseCanvasCoords[1] / screen.tileHeight);
            context.font = "20px Arial";
            context.fillStyle = "yellow";
            context.fillText("(" + tileX + "," + tileY + ")", screen.selectionBoxCoords[0], screen.selectionBoxCoords[1] + screen.tileHeight + 20);
        },
        drawNotifications: function() {
            context.font = "40px Arial";
            context.lineWidth = 4;
            context.strokeStyle = "red";
            context.beginPath();
            context.rect(a_canvas.width * 0.01, a_canvas.height * 0.01, a_canvas.width * 0.6, 200);
            context.stroke();
            context.fillStyle = "rgba(0,150,150,0.5)";
            context.fill();
            for (var i = 0; i < notifications.length; i++) {
                if (notifications.length > 6) {
                    notifications.shift();
                }
                context.fillStyle = "yellow";
                context.fillText(notifications[i], screen.notificationX, screen.notificationY + screen.notificationSpacing * i);
            }
        },
        drawOptionsMenu: function() {
            if (showOptionsMenu === true) {
                var menuWidth = a_canvas.width * 0.9;
                var menuHeight = a_canvas.height * 0.9;
                
                //vert. and horiz. centered
                var menuX = (a_canvas.width - menuWidth) / 2;
                var menuY = (a_canvas.height - menuHeight) / 2;
                
                context.beginPath();
                context.rect(menuX, menuY, menuWidth, menuHeight);
                context.lineWidth = 3;
                context.strokeStyle = "yellow";
                context.stroke();
                context.fillStyle = "rgb(50,50,50)";
                context.fill();
            }
        }
    };

    var math = {
        calculateTileClicked: function(coords) {
            var x = Math.floor(coords[0] / screen.tileWidth) * Math.floor(screen.tileWidth);
            var y = Math.floor(coords[1] / screen.tileHeight) * Math.floor(screen.tileHeight);
            return [x, y];
        },
        calculateCanvasCoordsFromWindowCoords: function(windowX, windowY) {
            var rect = context.canvas.getBoundingClientRect();
            var canvasX = Math.round((windowX - rect.left) / (rect.right - rect.left) * context.canvas.width);
            var canvasY = Math.round((windowY - rect.top) / (rect.bottom - rect.top) * context.canvas.height);
            return [canvasX, canvasY];
        }
    };
    var tiles = {
        grass: new Tile(1, 1, "res/grass.jpg"),
        water: new Tile(1, 1, "res/water1.png"),
        tree1: new Tile(2, 5, "res/tree1.png"),
        tree2: new Tile(2, 5, "res/tree2.png"),
        flower: new Tile(1, 2, "res/flower.png"),
        rock: new Tile(1, 1, "res/rock.png"),
        dirt: new Tile(1, 1, "res/dirt.jpg")
    };
    var config = {
        fps: 60
    };
    /*
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini/i.test(navigator.userAgent)) {
        config.fps = 30;
    }
    */
    var generator = {

        generateChunk: function() {

            var chunkHeight = 300;
            var chunkWidth = 300;
            var tilesList = new Array();
            map.tileMap = new Array(chunkHeight);
            map.treeMap = new Array(chunkHeight);

            for (var i = 0; i < map.tileMap.length; i++) {
                map.tileMap[i] = new Array(chunkWidth);
                map.treeMap[i] = new Array(chunkWidth);
            }

            seed();

            //the more times you run this, the more the different terrain types should cluster
            for (var i = 0; i < 150; i++) {
                makeLikeSurroundingTiles();
            }

            function seed() {
                for (var i = 0; i < chunkHeight; i++) {
                    for (var j = 0; j < chunkWidth; j++) {
                        switch (Math.floor((Math.random() * 3) + 1)) {
                            case 1:
                                map.tileMap[i][j] = 0;
                                break;
                            case 2:
                                map.tileMap[i][j] = 2;
                                break;
                            case 3:
                                map.tileMap[i][j] = 1;
                                break;
                        }
                        tilesList.push([i, j]);
                    }
                }
            }

            function makeLikeSurroundingTiles() {
                //probably too much code repetition here
                for (var i = 0; i < chunkHeight; i++) {
                    for (var j = 0; j < chunkWidth; j++) {
                        var grassSurrounding = 0;
                        var waterSurrounding = 0;
                        var dirtSurrounding = 0;

                        var center = map.tileMap[i][j];
                        switch (center) {
                            case 0:
                                grassSurrounding += 1;
                                break;
                            case 1:
                                waterSurrounding += 1;
                                break;
                            case 2:
                                dirtSurrounding += 1;
                                break;
                        }
                        //don't check left of left edge because they are undefined
                        if (i > 0) {
                            var left = map.tileMap[i - 1][j];
                            switch (left) {
                                case 0:
                                    grassSurrounding += 1;
                                    break;
                                case 1:
                                    waterSurrounding += 1;
                                    break;
                                case 2:
                                    dirtSurrounding += 1;
                                    break;
                            }
                        }
                        //don't check topleft corner of corner pieces
                        if (i > 0 && j > 0) {
                            var topLeft = map.tileMap[i - 1][j - 1];
                            switch (topLeft) {
                                case 0:
                                    grassSurrounding += 1;
                                    break;
                                case 1:
                                    waterSurrounding += 1;
                                    break;
                                case 2:
                                    dirtSurrounding += 1;
                                    break;
                            }
                        }
                        var top = map.tileMap[i][j - 1];
                        switch (top) {
                            case 0:
                                grassSurrounding += 1;
                                break;
                            case 1:
                                waterSurrounding += 1;
                                break;
                            case 2:
                                dirtSurrounding += 1;
                                break;
                        }
                        if (i < chunkWidth - 1 && j > 0) {
                            var topRight = map.tileMap[i + 1][j - 1];
                            switch (topRight) {
                                case 0:
                                    grassSurrounding += 1;
                                    break;
                                case 1:
                                    waterSurrounding += 1;
                                    break;
                                case 2:
                                    dirtSurrounding += 1;
                                    break;
                            }
                        }
                        if (i < chunkWidth - 1) {
                            var right = map.tileMap[i + 1][j];
                            switch (right) {
                                case 0:
                                    grassSurrounding += 1;
                                    break;
                                case 1:
                                    waterSurrounding += 1;
                                    break;
                                case 2:
                                    dirtSurrounding += 1;
                                    break;
                            }
                        }
                        if (i < chunkWidth - 1 && j < chunkHeight - 1) {
                            var bottomRight = map.tileMap[i + 1][j + 1];
                            switch (bottomRight) {
                                case 0:
                                    grassSurrounding += 1;
                                    break;
                                case 1:
                                    waterSurrounding += 1;
                                    break;
                                case 2:
                                    dirtSurrounding += 1;
                                    break;
                            }
                        }
                        var bottom = map.tileMap[i][j + 1];
                        switch (bottom) {
                            case 0:
                                grassSurrounding += 1;
                                break;
                            case 1:
                                waterSurrounding += 1;
                                break;
                            case 2:
                                dirtSurrounding += 1;
                                break;
                        }
                        if (i > 0 && j < chunkHeight) {
                            var bottomLeft = map.tileMap[i - 1][j + 1];
                            switch (bottomLeft) {
                                case 0:
                                    grassSurrounding += 1;
                                    break;
                                case 1:
                                    waterSurrounding += 1;
                                    break;
                                case 2:
                                    dirtSurrounding += 1;
                                    break;
                            }
                        }
                        var total = grassSurrounding + waterSurrounding + dirtSurrounding;
                        var grassChance = grassSurrounding / total;
                        var waterChance = waterSurrounding / total;
                        var dirtChance = dirtSurrounding / total;

                        var randNum = Math.random();

                        if (randNum < grassChance) {
                            map.tileMap[i][j] = 0;
                        } else if (randNum < waterChance + grassChance) {
                            map.tileMap[i][j] = 1;
                        } else {
                            map.tileMap[i][j] = 2;
                        }
                        //alert("Grass: " + grassSurrounding + " Water: " + waterSurrounding);
                    }
                }
            }
            numTiles = tilesList.length;
        },
    };

    var waterAnimationFrame = 0;
    setInterval(function() {
        if (waterAnimationFrame === 0) {
            tiles.water.image.src = "res/water1.png";
            waterAnimationFrame = 1;
        } else {
            tiles.water.image.src = "res/water2.png";
            waterAnimationFrame = 0;
        }
    }, 500);

    //pre-gameloop setup
    generator.generateChunk();
    
    var processPlayerMovement = setInterval(function(){
        //need to refactor to allow diagonal movement
        if(player.movementQueue.length > 0){
            var direction = player.movementQueue.shift();
            switch(direction){
                case "west":
                    moveWest();
                    break;
                case "east":
                    moveEast();
                    break;
                case "north":
                    moveNorth();
                    break;
                case "south":
                    moveSouth();
                    break;
            }
        }
    }, 1000 / player.moveSpeed);

    var gameLoop = setInterval(function() {
        graphics.redrawMap();
        graphics.drawSelectionBox(screen.oldSelectionBoxCoords, screen.selectionBoxCoords);
        graphics.drawPlayer();
        graphics.drawTrees();
        graphics.drawCursor();
        graphics.drawNotifications();
        graphics.drawInterface();   
        graphics.drawOptionsMenu();
    }, 1000 / config.fps);

    //TODO: MAKE DRY
    function moveNorth() {
        sounds.walking.play();
        if (player.animationFrame > 2) {
            player.animationFrame = 0;
        } else {
            player.animationFrame++;
        }

        if (map.treeMap[player.worldX][player.worldY + 1] === 3) {
            notifications.push("There is a rock right there!");
        } else {
            if (!player.IsMoving) {
                player.isMoving = true;
                var moveUp = setInterval(function() {
                    screen.offsetY += screen.tileHeight / 15;
                }, 250 / 15);
                setTimeout(function() {
                    player.worldY -= 1;
                    clearInterval(moveUp);
                    player.isMoving = false;
                    screen.offsetY = 0;
                }, 250);
            }
        }
    }

    function moveSouth() {
        sounds.walking.play();
        if (player.animationFrame > 2) {
            player.animationFrame = 0;
        } else {
            player.animationFrame++;
        }

        if (map.treeMap[player.worldX][player.worldY + 1] === 3) {
            notifications.push("There is a rock right there!");
        } else {
            if (!player.IsMoving) {
                player.isMoving = true;
                var moveDown = setInterval(function() {
                    screen.offsetY -= screen.tileHeight / 15;
                }, 250 / 15);
                setTimeout(function() {
                    player.worldY += 1;
                    clearInterval(moveDown);
                    player.isMoving = false;
                    screen.offsetY = 0;
                }, 250);
            }
        }
    }

    function moveEast() {
        sounds.walking.play();
        player.animationFrame++;
        if (map.treeMap[player.worldX + 1][player.worldY] === 3) {
            notifications.push("There is a rock right there!");
        } else {
            if (!player.IsMoving)
                player.isMoving = true;
            var moveRight = setInterval(function() {
                screen.offsetX -= screen.tileWidth / 15;
            }, 250 / 15);
            setTimeout(function() {
                player.worldX += 1;
                clearInterval(moveRight);
                player.isMoving = false;
                screen.offsetX = 0;
            }, 250);
        }
    }

    function moveWest() {
        sounds.walking.play();
        player.animationFrame = 8;
        if (map.treeMap[player.worldX - 1][player.worldY] === 3) {
            notifications.push("There is a rock right there!");
        } else {
            if (!player.IsMoving) {
                player.isMoving = true;
                var moveLeft = setInterval(function() {
                    screen.offsetX += screen.tileWidth / 15;
                }, 250 / 15);
                setTimeout(function() {
                    player.worldX -= 1;
                    clearInterval(moveLeft);
                    player.isMoving = false;
                    screen.offsetX = 0;
                }, 250);
            }
        }
    }

    a_canvas.addEventListener('mousemove', function(evt) {
        screen.mouseCanvasCoords = math.calculateCanvasCoordsFromWindowCoords(evt.clientX, evt.clientY);
        screen.oldSelectionBoxCoords = screen.selectionBoxCoords;
        screen.selectionBoxCoords = math.calculateTileClicked(screen.mouseCanvasCoords);
    }, false);
    
    a_canvas.addEventListener('click', function(evt) {
        var canvasCoords = math.calculateCanvasCoordsFromWindowCoords(evt.clientX, evt.clientY);
        var tileCoords = [Math.floor(canvasCoords[0] / screen.tileWidth), Math.floor(canvasCoords[1] / screen.tileHeight)];
        
        if (tileCoords[0] < player.screenTileX){
            var distance = player.screenTileX - tileCoords[0];
            for(var i = 0; i < distance; i++){
                player.movementQueue.push("west");
            }
        }
        
        else if (tileCoords[0] > player.screenTileX){
            var distance = tileCoords[0] - player.screenTileX;
            for(var i = 0; i < distance; i++){
                player.movementQueue.push("east");
            }
        }
        
        if (tileCoords[1] < player.screenTileY){
            var distance = player.screenTileY - tileCoords[1];
            for(var i = 0; i < distance; i++){
                player.movementQueue.push("north");
            }
        }
        
        else if (tileCoords[1] > player.screenTileY){
            var distance = tileCoords[1] - player.screenTileY;
            for(var i = 0; i < distance; i++){
                player.movementQueue.push("south");
            }
        }

    }, false);
    
    a_canvas.addEventListener('contextmenu', function(evt) {
        evt.preventDefault();
        return false;
    }, false);
    
    window.addEventListener("keydown", function(e) {
        switch (e.keyCode) {
            case 87:
                player.movementQueue.push("north");
                break;
            case 83:
                player.movementQueue.push("south");
                break;
            case 65:
                player.movementQueue.push("west");
                break;
            case 68:
                player.movementQueue.push("east");
                break;
            case 46:
                notifications = [];
                break;
            case 49:
                interface.inventorySlotSelected = 0;
                break;
            case 50:
                interface.inventorySlotSelected = 1;
                break;
            case 51:
                interface.inventorySlotSelected = 2;
                break;
            case 52:
                interface.inventorySlotSelected = 3;
                break;
            case 53:
                interface.inventorySlotSelected = 4;
                break;
            case 54:
                interface.inventorySlotSelected = 5;
                break;
            case 107: //zoom out
                //has to be 2 because numRows and numColumns need to stay odd
                screen.numRows -= 2;
                screen.numColumns -= 2;
                screen.tileWidth = a_canvas.width / screen.numColumns;
                screen.tileHeight = a_canvas.height / screen.numRows;
                break;
            case 109: //zoom in
                screen.numRows += 2;
                screen.numColumns += 2;
                screen.tileWidth = a_canvas.width / screen.numColumns;
                screen.tileHeight = a_canvas.height / screen.numRows;
                break;
            case 187:
                break;

            //TODO: rotate from center instead of top left edge
            case 39: //right arrow, rotate camera clockwise
                //move to center to rotate around that point
                context.rotate(1 * Math.PI / 180);
                break;
            case 37: //left arrow
                context.rotate(-1 * Math.PI / 180);
                break;

            case 27:
                if (showOptionsMenu === true) showOptionsMenu = false;
                else showOptionsMenu = true;
        }
    }, false)
}