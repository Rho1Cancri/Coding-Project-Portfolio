'''
Hello, this is the code for the game "Infinite Shooter".

See credits for assets not made by me.

Pygame module needed.
'''

import pygame, math, random, os

# Global variables

pygame.mixer.pre_init(44100, 16, 2, 4096)
pygame.init()
clock = pygame.time.Clock()
score = 0
lives = 3
deadTick = 0
keys = []
stage = -1
currentMsg = None
nextMsg = []
paused = False
mousePos = (0, 0)
gameTick = 0
mouseTick = 0
pygame.display.set_caption("Infinite Shooter")
display = pygame.display.set_mode((800, 600))
objList = []
loadImage = pygame.image.load
loadSound = pygame.mixer.Sound
running = True
smallFont = pygame.font.Font(os.path.join(os.path.dirname(__file__), "Orbitron-Bold.ttf"), 14)
bigFont = pygame.font.Font(os.path.join(os.path.dirname(__file__), "Orbitron-Bold.ttf"), 40)

# Global functions

def dist(x1, y1, x2, y2):
    return ((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5

def createObj(className, x, y):
    newObj = className(round(x), round(y))
    objList.append(newObj)
    return newObj

def deleteObj(oldObj):
    objList.pop(objList.index(oldObj))

def findTarget(obj, targetTeam):
    target = None
    for i in objList:
        if i != obj and i.team == targetTeam and (not target or dist(obj.x, obj.y, i.x, i.y) < dist(obj.x, obj.y, target.x, target.y)):
            target = i
    return target

def setAlpha(surface, alpha):
    surface_alpha = pygame.Surface(surface.get_size(), pygame.SRCALPHA)
    surface_alpha.fill((255, 255, 255, round(alpha)))
    surface.blit(surface_alpha, (0, 0), special_flags = pygame.BLEND_RGBA_MULT)

def findObjOfClass(className):
    target = None
    for i in objList:
        if type(i).__name__ == className:
            target = i
    return target

def addScore(amount):
    global score
    score += amount

def blitText(text, colour, font = smallFont, x = 0, y = 0, center = False):
    textImage = font.render(text, True, colour)
    if center:
        display.blit(textImage, (round((display.get_width() - textImage.get_width()) / 2 + x), round((display.get_height() - textImage.get_height()) / 2 + y)))
    else:
        display.blit(textImage, (round(x), round(y)))

# Loading images

images = {
    "player": loadImage(os.path.join(os.path.dirname(__file__), "PNG", "Player.png")).convert_alpha(),
    "playerIcon": loadImage(os.path.join(os.path.dirname(__file__), "PNG", "PlayerIcon.png")).convert_alpha(),
    "playerIcon2": loadImage(os.path.join(os.path.dirname(__file__), "PNG", "PlayerIcon2.png")).convert_alpha(),
    "compIcon": loadImage(os.path.join(os.path.dirname(__file__), "PNG", "CompIcon.png")).convert_alpha(),
    "enemy1": loadImage(os.path.join(os.path.dirname(__file__), "PNG", "Enemy1.png")).convert_alpha(),
    "enemy2": loadImage(os.path.join(os.path.dirname(__file__), "PNG", "Enemy2.png")).convert_alpha(),
    "enemy3": loadImage(os.path.join(os.path.dirname(__file__), "PNG", "Enemy3.png")).convert_alpha(),
    "enemyIcon": loadImage(os.path.join(os.path.dirname(__file__), "PNG", "EnemyIcon.png")).convert_alpha(),
    "friendly": loadImage(os.path.join(os.path.dirname(__file__), "PNG", "Friendly.png")).convert_alpha(),
    "frndIcon": loadImage(os.path.join(os.path.dirname(__file__), "PNG", "FrndIcon.png")).convert_alpha(),
    "playerShot": loadImage(os.path.join(os.path.dirname(__file__), "PNG", "PlayerShot.png")).convert_alpha(),
    "enemyShot": loadImage(os.path.join(os.path.dirname(__file__), "PNG", "EnemyShot.png")).convert_alpha(),
    "homingMine": loadImage(os.path.join(os.path.dirname(__file__), "PNG", "HomingMine.png")).convert_alpha(),
    "fireball": loadImage(os.path.join(os.path.dirname(__file__), "PNG", "Fireball.png")).convert_alpha(),
    "reticle": loadImage(os.path.join(os.path.dirname(__file__), "PNG", "Reticle.png")).convert_alpha(),
    "barCont": loadImage(os.path.join(os.path.dirname(__file__), "PNG", "BarCont.png")).convert_alpha(),
    "msgCont": loadImage(os.path.join(os.path.dirname(__file__), "PNG", "MsgCont.png")).convert_alpha(),
    "spaceTile": loadImage(os.path.join(os.path.dirname(__file__), "PNG", "SpaceTile.png")).convert_alpha(),
    "escapePod": loadImage(os.path.join(os.path.dirname(__file__), "PNG", "EscapePod.png")).convert_alpha(),
}
sounds = {
    "laser": loadSound(os.path.join(os.path.dirname(__file__), "WAV", "LaserMGMod.wav")),
    "explosion": loadSound(os.path.join(os.path.dirname(__file__), "WAV", "DepthChargeShort.wav")),
    "notif": loadSound(os.path.join(os.path.dirname(__file__), "WAV", "Notification.wav")),
    "alarm": loadSound(os.path.join(os.path.dirname(__file__), "WAV", "Alarm.wav")),
    "launch": loadSound(os.path.join(os.path.dirname(__file__), "WAV", "MissileLaunchKibblesbob.wav")),
    "victory": loadSound(os.path.join(os.path.dirname(__file__), "WAV", "Victory.wav")),
    "gameOver": loadSound(os.path.join(os.path.dirname(__file__), "WAV", "GameOver.wav"))
}

# Classes

class player:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.image = images["player"]
        self.team = "good"
        self.cooldown = 0
        self.shield = 100
        self.radius = 32
    def step(self):
        # Retrieving globals
        global lives, deadTick, stage
         
        # Player movement
        xMove = ((keys[pygame.K_LEFT] or keys[pygame.K_a]) and -1 or 0)
        xMove += ((keys[pygame.K_RIGHT] or keys[pygame.K_d]) and 1 or 0)
        yMove = ((keys[pygame.K_UP] or keys[pygame.K_w]) and -1 or 0)
        yMove += ((keys[pygame.K_DOWN] or keys[pygame.K_s]) and 1 or 0)
        if (xMove != 0 or yMove != 0):
            self.x += 12 * xMove / (xMove ** 2 + yMove ** 2) ** 0.5
            self.y += 12 * yMove / (xMove ** 2 + yMove ** 2) ** 0.5
        self.x = min(max(self.x, 8), display.get_width() - 8)
        self.y = min(max(self.y, 8), display.get_height() - 8)

        # Player weapon
        if self.cooldown > 0:
            self.cooldown -= 1
        elif keys[pygame.K_SPACE]:
            self.cooldown = 5
            sounds["laser"].set_volume(0.10)
            sounds["laser"].play()
            if pygame.mouse.get_focused():
                createObj(playerShot, self.x, self.y)
            else:
                createObj(playerShot, self.x - 16, self.y)
                createObj(playerShot, self.x + 16, self.y)
        
        # Player health
        if self.shield <= 0:
            createObj(fireball, self.x, self.y)
            lives -= 1
            if lives == 1:
                sounds["alarm"].set_volume(0.20)
                sounds["alarm"].play()
                nextMsg.append(["compIcon", "Warning! Only one life left!", 240])
            if lives == 0:
                sounds["gameOver"].set_volume(0.20)
                sounds["gameOver"].play()
                if gameTick < 3000:
                    nextMsg.clear()
                    nextMsg.append(["enemyIcon", "These feds are tough, but not that tough.", 240])
                elif gameTick < 7200:
                    nextMsg.clear()
                    nextMsg.append(["frndIcon", "Oh no, oh no... come on warp drive! Faster!", 180])
                    nextMsg.append(["enemyIcon", "Let nobody escape!", 120])
                    nextMsg.append(["frndIcon", "AIIIEEEEEE!", 90])
                else:
                    nextMsg.clear()
                    nextMsg.append(["frndIcon", "The Federation will not like the news.", 180])
                    nextMsg.append(["frndIcon", "Jumping!", 60])
            deadTick = 300
            sounds["explosion"].set_volume(0.20)
            sounds["explosion"].play()
            deleteObj(self)
        elif self.shield < 100:
            self.shield = min(100, self.shield + 1 / 3)

        # Appearance when respawning
        if deadTick > 0:
            tempImage = images["player"].copy()
            setAlpha(tempImage, 128)
            self.image = tempImage
        else:
            self.image = images["player"]

class playerShot:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.image = images["playerShot"]
        self.team = None
        if pygame.mouse.get_focused():
            angle = math.atan2(mousePos[1] - self.y, mousePos[0] - self.x)
            self.vx = 32 * math.cos(angle)
            self.vy = 32 * math.sin(angle)
        else:
            self.vx = 0
            self.vy = -32
    def step(self):
        self.x += self.vx
        self.y += self.vy
        hit = None
        for i in objList:
            if i != self and i.team == "evil" and i.radius + 6 > dist(self.x, self.y, i.x, i.y):
                hit = i
        if hit:
            hit.shield -= 45
            if hit.shield > 0:
                newFireball = createObj(fireball, self.x, self.y)
                newFireball.scale = 0.15
        if hit or self.x < 0 or self.x > display.get_width() or self.y < 0 or self.y > display.get_height():
            deleteObj(self)

class enemy1:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.image = images["enemy1"]
        self.team = "evil"
        self.cooldown = random.randrange(90)
        self.shield = 100
        self.radius = 32
    def step(self):
        # Enemy movement
        self.y += 2
        
        # Enemy health
        if self.shield <= 0:
            createObj(fireball, self.x, self.y)
            sounds["explosion"].set_volume(0.20)
            sounds["explosion"].play()
            addScore(10)
        if self.shield <= 0 or self.y > display.get_height() + self.radius:
            deleteObj(self)
        
        # Enemy weapon: bullets
        if self.cooldown > 0:
            self.cooldown -= 1
        else:
            self.cooldown = 89
            sounds["laser"].set_volume(0.075)
            sounds["laser"].play()
            createObj(enemyShot, self.x, self.y)

class enemy2:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.image = images["enemy2"]
        self.team = "evil"
        self.cooldown = random.randrange(240)
        self.shield = 100
        self.radius = 32
    def step(self):
        # Enemy movement
        self.y += 2
        
        # Enemy health
        if self.shield <= 0:
            createObj(fireball, self.x, self.y)
            sounds["explosion"].set_volume(0.20)
            sounds["explosion"].play()
            addScore(10)
        if self.shield <= 0 or self.y > display.get_height() + self.radius:
            deleteObj(self)
        
        # Enemy weapon: homing mines
        if self.cooldown > 0:
            self.cooldown -= 1
        elif findTarget(self, "good"):
            self.cooldown = 239
            createObj(homingMine, self.x, self.y)

class enemy3:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.image = images["enemy3"]
        self.team = "evil"
        self.cooldown = random.randrange(24)
        self.cooldown2 = random.randrange(90)
        self.shield = 400
        self.radius = 48
    def step(self):
        # Enemy movement
        self.y += 1.5
        
        # Enemy health
        if self.shield <= 0:
            newFireball = createObj(fireball, self.x, self.y)
            newFireball.scale = 1.5
            sounds["explosion"].set_volume(0.20)
            sounds["explosion"].play()
            addScore(40)
        if self.shield <= 0 or self.y > display.get_height() + self.radius:
            deleteObj(self)
        
        # Enemy weapon: bullet turret
        if self.cooldown > 0:
            self.cooldown -= 1
        else:
            target = findTarget(self, "good")
            if target:
                self.cooldown = 23
                sounds["laser"].set_volume(0.075)
                sounds["laser"].play()
                angle = math.atan2(target.y - self.y, target.x - self.x)
                newEnemyShot = createObj(enemyShot, self.x, self.y)
                newEnemyShot.vx = 12 * math.cos(angle)
                newEnemyShot.vy = 12 * math.sin(angle)

        # Enemy weapon: dual bullets
        if self.cooldown2 > 0:
            self.cooldown2 -= 1
        else:
            self.cooldown2 = 89
            sounds["laser"].set_volume(0.075)
            sounds["laser"].play()
            createObj(enemyShot, self.x + 24, self.y)
            createObj(enemyShot, self.x - 24, self.y)

class enemyShot:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.image = images["enemyShot"]
        self.team = None
        self.vx = 0
        self.vy = 12
    def step(self):
        # Retrieving globals
        global deadTick
        
        # Bullet movement
        self.x += self.vx
        self.y += self.vy
        
        # Bullet actions
        hit = None
        for i in objList:
            if i != self and i.team == "good" and i.radius + 6 > dist(self.x, self.y, i.x, i.y):
                hit = i
        if hit:
            if (deadTick <= 0 or type(hit).__name__ != "player"):
                hit.shield -= 30
            if hit.shield > 0:
                newFireball = createObj(fireball, self.x, self.y)
                newFireball.scale = 0.15
            
        if hit or self.x < 0 or self.x > display.get_width() or self.y < 0 or self.y > display.get_height():
            deleteObj(self)

class homingMine:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.image = images["homingMine"]
        self.team = "evil"
        self.shield = 50
        self.radius = 12
    def step(self):
        # Retrieving globals
        global deadTick
        
        # Homing mine movement
        target = findTarget(self, "good")
        if target:
            angle = math.atan2(target.y - self.y, target.x - self.x)
            self.x += 5 * math.cos(angle)
            self.y += 5 * math.sin(angle)
            
        # Homing mine actions and health
        hit = target and self.radius + target.radius > dist(self.x, self.y, target.x, target.y)
        if hit:
            if (deadTick <= 0 or type(target).__name__ != "player"):
                target.shield -= 60
            if target.shield > 0:
                newFireball = createObj(fireball, self.x, self.y)
                newFireball.scale = 0.3
        if self.shield <= 0 or not target:
            newFireball = createObj(fireball, self.x, self.y)
            sounds["explosion"].set_volume(0.10)
            sounds["explosion"].play()
            newFireball.scale = 0.3
        if hit or not target or self.shield <= 0:
            deleteObj(self)
        if self.shield <= 0:
            addScore(4)

class friendly:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.image = images["friendly"]
        self.team = "good"
        self.shield = 10000
        self.radius = 40
    def step(self):
        # Friendly movement
        self.y += 5

        # Friendly existence
        if self.y > display.get_height() + self.radius:
            deleteObj(self)

class escapePod:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.image = images["escapePod"]
        self.team = "good"
        self.shield = 10000
        self.radius = 8
    def step(self):
        # Friendly movement
        self.x -= 2
        self.y += 4

        # Friendly existence
        if self.y > display.get_height() + self.radius:
            deleteObj(self)

class fireball:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.image = images["fireball"]
        self.team = None
        self.timer = 0
        self.scale = 1
    def step(self):
        if self.timer > 15:
            deleteObj(self)
        else:
            fireball_image = pygame.transform.scale(images["fireball"], (round((1 + self.timer / 10) * self.scale * 64), round((1 + self.timer / 10) * self.scale * 64)))
            setAlpha(fireball_image, 255 - self.timer * 17)
            self.image = fireball_image
            self.image.set_alpha(0.5)
            self.timer += 1

# Creating player

createObj(player, display.get_width() / 2, display.get_height() - 96)

# Main loop

while running:
    # Setting constants
    keys = pygame.key.get_pressed()
    if pygame.mouse.get_focused():
        pygame.mouse.set_visible(False)
        mousePos = pygame.mouse.get_pos()
    else:
        pygame.mouse.set_visible(True)
        mousePos = (display.get_width() / 2, display.get_height() / 2)
    currentPlayer = findObjOfClass("player")
    
    # Pygame event handling
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_F4:
                if (event.mod == pygame.KMOD_LALT or event.mod == pygame.KMOD_RALT):
                    running = False
            if event.key == pygame.K_f and gameTick >= 7830 and currentPlayer:
                stage = gameTick
                lives = 0
                createObj(escapePod, currentPlayer.x, currentPlayer.y)
                createObj(fireball, currentPlayer.x, currentPlayer.y)
                sounds["explosion"].set_volume(0.20)
                sounds["explosion"].play()
                sounds["launch"].set_volume(0.20)
                sounds["launch"].play()
                nextMsg.append(["playerIcon", "Ejecting!", 90])
                deleteObj(currentPlayer)
                addScore(500)
            if event.key == pygame.K_f and gameTick < 960:
                nextMsg.clear()
                currentMsg = None
                gameTick = 960
            if event.key == pygame.K_p:
                paused = not paused

    # Custom event handling
    if gameTick > 1320 and lives > 0 and not paused:
        if random.randrange(60) == 0:
            createObj(enemy1, random.randint(32, display.get_width() - 32), -32)
        if random.randrange(180) == 0:
            createObj(enemy2, random.randint(32, display.get_width() - 32), -32)
        if random.randrange(600) == 0 and not findObjOfClass("enemy3"):
            createObj(enemy3, random.randint(48, display.get_width() - 48), -48)
    if deadTick > 0 and not paused:
        deadTick -= 1
    if deadTick == 180 and lives > 0:
        createObj(player, display.get_width() / 2, display.get_height() - 96)

    # Storyline events
    if lives > 0:
        if gameTick == 0:
            nextMsg.append(["compIcon", "Reminder. Use WASD or arrow keys to move. Press and hold space bar to fire.", 360])
            nextMsg.append(["compIcon", "Move your mouse in or out of this window for alternate firing modes.", 360])
            nextMsg.append(["compIcon", "Also press P to pause the game if you need a break.", 240])
        if gameTick == 960:
            nextMsg.append(["playerIcon", "So far so good. All systems seem OK.", 240])
            nextMsg.append(["compIcon", "Imperial fighters inbound.", 120])
            nextMsg.append(["playerIcon", "They never quit, do they? Let's go.", 180])
        if gameTick == 1200:
            sounds["alarm"].set_volume(0.20)
            sounds["alarm"].play()
        if gameTick == 3000:
            nextMsg.append(["frndIcon", "This is Captain Larie Monaisa of a merchant fleet!", 240])
            nextMsg.append(["frndIcon", "We need help! We have innocent people onboard!", 240])
            nextMsg.append(["frndIcon", "The Imperials destroyed two of our ships already!", 240])
            nextMsg.append(["playerIcon", "Larie, this is callsign Blitz. Fly to my position.", 210])
            nextMsg.append(["frndIcon", "Okay Blitz!", 90])
            nextMsg.append(["enemyIcon", "Where are they going?", 180])
        if gameTick == 4800:
            nextMsg.append(["frndIcon", "Friendly ships coming through!", 150])
            nextMsg.append(["playerIcon", "You're crazy!", 90])
            nextMsg.append(["enemyIcon", "What the...", 60])
        if gameTick == 5040:
            createObj(friendly, display.get_width() / 2, -40)
            createObj(friendly, display.get_width() / 2 + 48, -64)
            createObj(friendly, display.get_width() / 2 - 48, -64)
            createObj(friendly, display.get_width() / 2 + 96, -88)
            createObj(friendly, display.get_width() / 2 - 96, -88)
        if gameTick == 5070 or gameTick == 5080 or gameTick == 5090 or gameTick == 5100 or gameTick == 5110 or gameTick == 5120:
            newFireball = createObj(fireball, random.randrange(display.get_width()), -32)
            newFireball.scale = 3
            sounds["explosion"].set_volume(0.30)
            sounds["explosion"].play()
        if gameTick == 5090:
            nextMsg.append(["enemyIcon", "Watch your flying!", 120])
            nextMsg.append(["playerIcon", "Your crazy plan worked, Larie. Your pursuers crashed.", 240])
            nextMsg.append(["frndIcon", "Still need time to charge up my warp drive.", 210])
        if gameTick == 7200:
            nextMsg.append(["playerIcon", "My warp drive's damaged from dogfighting.", 210])
            nextMsg.append(["frndIcon", "You have an escape pod, right?", 150])
            nextMsg.append(["playerIcon", "Yeah, I do. Why?", 120])
            nextMsg.append(["frndIcon", "Escape to my ship. About to enter hyperspace.", 210])
        if gameTick == 7830:
            nextMsg.append(["compIcon", "Press F key to escape.", 120])
    if stage > 0 and gameTick == stage + 180:
        sounds["victory"].set_volume(0.10)
        sounds["victory"].play()
        nextMsg.append(["frndIcon", "Caught you! Jumping now!", 150])
        nextMsg.append(["playerIcon", "Thanks. Just fly me back to Earth.", 180])
    
    # Object actions
    if not paused:
        for i in objList:
            i.step()
    
    # Background rendering
    display.fill((0, 16, 32))
    display.blit(images["spaceTile"], (round((display.get_width() - images["spaceTile"].get_width()) / 2), round(gameTick / 2 % images["spaceTile"].get_height())))
    display.blit(images["spaceTile"], (round((display.get_width() - images["spaceTile"].get_width()) / 2), round(gameTick / 2 % images["spaceTile"].get_height()) - images["spaceTile"].get_height()))
    
    # Object rendering
    for i in objList:
        if i.image:
            display.blit(i.image, (round(i.x - i.image.get_width() / 2), round(i.y - i.image.get_height() / 2)))
    
    # Status bars
    if currentPlayer:
        # Bar container
        barContImage = images["barCont"].copy()
        setAlpha(barContImage, 192)
        display.blit(barContImage, (display.get_width() - barContImage.get_width(), 0))
        
        # Shield measurement
        shieldBar = pygame.Surface((12, 96)).convert_alpha()
        shieldBar.fill((0, 128, 255, 192), (0, round(96 * (1 - currentPlayer.shield / 100)), 12, round(96 * (currentPlayer.shield / 100))))
        display.blit(shieldBar, (display.get_width() - 32, 8))
        
        # Cool down measurement
        cooldownBar = pygame.Surface((12, 96)).convert_alpha()
        cooldownBar.fill((255, 128, 0, 192), (0, round(96 * (1 - currentPlayer.cooldown / 6)), 12, round(96 * (currentPlayer.cooldown / 6))))
        display.blit(cooldownBar, (display.get_width() - 20, 8))
    
    # Score keeping text
    blitText("Score: " + str(score), (255, 192, 0, 255), smallFont, 8, 8, False)
    
    # Lives keeping images
    lifeImage = pygame.transform.scale(images["player"], (24, 24))
    setAlpha(lifeImage, 192)
    for i in range(lives):
        display.blit(lifeImage, (8 + 28 * i, 33))

    # Next message
    if not currentMsg and len(nextMsg) > 0:
        sounds["notif"].set_volume(0.20)
        sounds["notif"].play()
        currentMsg = nextMsg.pop(0)
        currentMsg[2] += gameTick
        msgWords = currentMsg[1].split()
        currentMsg[1] = []
        i = 1
        while len(msgWords) > 0:
            if smallFont.size(" ".join(msgWords[0 : i]))[0] > 256 or i > len(msgWords):
                currentMsg[1].append(" ".join(msgWords[0 : i - 1]))
                del msgWords[0 : i - 1]
                i = 1
            i += 1
    
    # Current message
    if currentMsg:
        # Container
        msgCont = images["msgCont"].copy()
        setAlpha(msgCont, 192)
        display.blit(msgCont, (round((display.get_width() - msgCont.get_width()) / 2), 8))
        
        # Icon
        icon = images[currentMsg[0]].copy()
        setAlpha(icon, 192)
        display.blit(icon, (round((display.get_width() - msgCont.get_width()) / 2 + 8), 16))
        
        # Text
        for i in range(len(currentMsg[1])):
            msgTextImage = smallFont.render(currentMsg[1][i], True, (70, 209, 230, 255))
            display.blit(msgTextImage, (round((display.get_width() - msgCont.get_width()) / 2) + 80, 16 + msgTextImage.get_height() * i))
        
        # Delete message if timeout
        if currentMsg[2] <= gameTick:
            currentMsg = None

    # Big text at start and end of game
    if stage > 0 and gameTick >= stage + 300:
        blitText("Mission Success!", (0, 128, 255, 255), bigFont, 0, 0, True)
    if stage > 0 and gameTick >= stage + 420:
        blitText("Orbitron font by The League of Moveable Type.", (255, 192, 0, 255), smallFont, 0, 40, True)
        blitText("Space background by webtreats on Flickr.", (255, 192, 0, 255), smallFont, 0, 57, True)
        blitText("Sounds by Mike Koenig and kibblesbob.", (255, 192, 0, 255), smallFont, 0, 74, True)
        blitText("More sounds by Oney and Jimbobsthebest on Newgrounds.", (255, 192, 0, 255), smallFont, 0, 91, True)
    if stage == -1 and deadTick == 0 and lives == 0:
        blitText("Game Over!", (255, 0, 0, 255), bigFont, 0, 0, True)
    if paused:
        blitText("Press P again to resume game.", (255, 192, 0, 255), smallFont, 0, 0, True)
    elif gameTick < 180:
        blitText("Press F to skip tutorial!", (255, 192, 0, 255), smallFont, 0, 0, True)
    
    # Mouse cursor
    if pygame.mouse.get_focused():
        # Setting transparency in pygame is complicated though
        reticleImage = images["reticle"].copy()
        setAlpha(reticleImage, 191.5 + math.cos(mouseTick / 30 * math.pi) * 63.5)
        display.blit(reticleImage, (round(mousePos[0] - 16), round(mousePos[1] - 16)))
    
    # Refresh screen and set frames per second
    pygame.display.update()
    clock.tick(60)
    gameTick += not paused
    mouseTick += 1

# Uninitialise everything
pygame.quit()
