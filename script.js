// ==========================================
// GAME DATA
// ==========================================

let player = {};
let currentFloorNumber = 1;

// ==========================================
// SHOP DATA
// ==========================================

const shopItems = [
  {
    id: 'health-potion',
    name: 'Health Potion',
    description: 'Restore 30 HP',
    cost: 25,
    effect: () => {
      player.hp = Math.min(player.hp + 30, player.maxHp);
    }
  },
  {
    id: 'mega-potion',
    name: 'Mega Potion',
    description: 'Restore 60 HP',
    cost: 50,
    effect: () => {
      player.hp = Math.min(player.hp + 60, player.maxHp);
    }
  },
  {
    id: 'max-heal',
    name: 'Full Restoration',
    description: 'Restore all HP',
    cost: 100,
    effect: () => {
      player.hp = player.maxHp;
    }
  },
  {
    id: 'armor-upgrade',
    name: 'Armor Upgrade',
    description: '+5 Max HP',
    cost: 40,
    effect: () => {
      player.maxHp += 5;
      player.hp = Math.min(player.hp + 5, player.maxHp);
    }
  },
  {
    id: 'heal-bonus',
    name: 'Healing Tome',
    description: '+2 Heal Bonus',
    cost: 35,
    effect: () => {
      player.healBonus = (player.healBonus || 0) + 2;
    }
  },
  {
    id: 'dice-upgrade',
    name: 'Blessed Dice',
    description: '+2 Dice Sides',
    cost: 60,
    effect: () => {
      playerDiceSides += 2;
    }
  },
  {
    id: 'strength-potion',
    name: 'Strength Elixir',
    description: '+3 Dice Sides (Temp)',
    cost: 45,
    effect: () => {
      playerDiceSides += 3;
    }
  },
  {
    id: 'resilience',
    name: 'Resilience Buff',
    description: '+10 Max HP & +2 Heal Bonus',
    cost: 75,
    effect: () => {
      player.maxHp += 10;
      player.hp = Math.min(player.hp + 10, player.maxHp);
      player.healBonus = (player.healBonus || 0) + 2;
    }
  }
];

// ==========================================
// PLAYER ANIMATION
// ==========================================

let playerIdleImages = [];
let playerAttackImages = [];

let playerIdleFrameIndex = 0;
let playerAttackFrameIndex = 0;

let playerIdleTimer = null;
let playerAttackTimer = null;

const playerSpriteInfo = {
  thief: { 
    folder: "characters/class-select/thief/", 
    idleFrames: 4,
    attackFrames: 0
  },
  mage: { 
    folder: "characters/class-select/mage/", 
    idleFrames: 4, 
    attackFrames: 0 
  },
  swordsman: { 
    folder: "characters/class-select/swordsman/", 
    idleFrames: 4, 
    attackFrames: 4
  }
};

// ==========================================
// DOM HELPERS
// ==========================================

function getCurrentFloor() {
  return document.querySelector('#floor-1:not(.hidden), #floor-2:not(.hidden), #floor-3:not(.hidden)');
}

function getElementInCurrentFloor(selector) {
  const floor = getCurrentFloor();
  return floor ? floor.querySelector(selector) : document.querySelector(selector);
}

// ==========================================
// PLAYER ANIMATION FUNCTIONS
// ==========================================

function loadPlayerIdleAnimation() {
  const spriteInfo = playerSpriteInfo[player.class];
  if (!spriteInfo) return;

  playerIdleImages = [];
  for (let i = 1; i <= spriteInfo.idleFrames; i++) {
    playerIdleImages.push(spriteInfo.folder + `idle${i}.png`);
  }
  playerIdleFrameIndex = 0;
}

function loadPlayerAttackAnimation() {
  const spriteInfo = playerSpriteInfo[player.class];
  if (!spriteInfo) return;

  if (!spriteInfo.attackFrames || spriteInfo.attackFrames <= 0) {
    playerAttackImages = playerIdleImages.slice();
  } else {
    playerAttackImages = [];
    for (let i = 1; i <= spriteInfo.attackFrames; i++) {
      playerAttackImages.push(spriteInfo.folder + `attack${i}.png`);
    }
  }
  playerAttackFrameIndex = 0;
}

function startPlayerIdleAnimation() {
  const playerSprite = getElementInCurrentFloor("#player-character");
  if (!playerSprite) {
    console.warn("Player sprite not found");
    return;
  }
  
  if (playerIdleTimer) clearInterval(playerIdleTimer);

  playerSprite.src = playerIdleImages[0];

  playerIdleTimer = setInterval(() => {
    playerSprite.src = playerIdleImages[playerIdleFrameIndex];
    playerIdleFrameIndex = (playerIdleFrameIndex + 1) % playerIdleImages.length;
  }, 200);
}

function startPlayerAttackAnimation() {
  const playerSprite = getElementInCurrentFloor("#player-character");
  
  if (playerIdleTimer) clearInterval(playerIdleTimer);
  if (playerAttackTimer) clearInterval(playerAttackTimer);

  playerSprite.src = playerAttackImages[0];
  playerAttackFrameIndex = 0;

  playerAttackTimer = setInterval(() => {
    playerSprite.src = playerAttackImages[playerAttackFrameIndex];
    playerAttackFrameIndex++;
    
    if (playerAttackFrameIndex >= playerAttackImages.length) {
      playerAttackFrameIndex = 0;
      clearInterval(playerAttackTimer);
      playerAttackTimer = null;
    }
  }, 150);
}

function stopPlayerAttackAnimation() {
  clearInterval(playerAttackTimer);
  playerAttackTimer = null;
}

function stopPlayerIdleAnimation() {
  clearInterval(playerIdleTimer);
  playerIdleTimer = null;
}

// ==========================================
// ENEMY DATA AND ANIMATION
// ==========================================

let enemyIdleImages = [];
let enemyAttackImages = [];

let enemyIdleFrameIndex = 0;
let enemyAttackFrameIndex = 0;

let enemyIdleTimer = null;
let enemyAttackTimer = null;

let allEnemiesInBattle = [];
let currentEnemyTargetIndex = 0;
let currentEnemyTurnIndex = 0;

const enemyTypes = {
  slime: {
    name: "Slime",
    maxHp: 15,
    idleFrames: 4,
    attackFrames: 0,
    folder: "enemies/slime/",
    goldReward: 50
  },
  enemy1: {
    name: "Enemy 1",
    maxHp: 25,
    idleFrames: 4,
    attackFrames: 4,
    folder: "enemies/1/",
    goldReward: 60
  },
  enemy2: {
    name: "Enemy 2",
    maxHp: 40,
    idleFrames: 4,
    attackFrames: 4,
    folder: "enemies/2/",
    goldReward: 75
  },
  enemy3: {
    name: "Enemy 3",
    maxHp: 55,
    idleFrames: 4,
    attackFrames: 4,
    folder: "enemies/3/",
    goldReward: 90
  },
  enemy4: {
    name: "Enemy 4",
    maxHp: 70,
    idleFrames: 4,
    attackFrames: 4,
    folder: "enemies/4/",
    goldReward: 100
  },
  enemy5: {
    name: "Enemy 5",
    maxHp: 85,
    idleFrames: 4,
    attackFrames: 4,
    folder: "enemies/5/",
    goldReward: 120
  },
  boss: {
    name: "Boss",
    maxHp: 120,
    idleFrames: 4,
    attackFrames: 4,
    folder: "enemies/boss/",
    goldReward: 300
  }
};

function loadEnemyIdleAnimation(enemyType) {
  const enemyInfo = enemyTypes[enemyType];
  if (!enemyInfo) return;

  enemyIdleImages = [];
  for (let i = 1; i <= enemyInfo.idleFrames; i++) {
    enemyIdleImages.push(enemyInfo.folder + `idle${i}.png`);
  }
  enemyIdleFrameIndex = 0;
}

function loadEnemyAttackAnimation() {
  const aliveEnemy = allEnemiesInBattle.find(enemy => enemy && enemy.hp > 0);
  if (!aliveEnemy) return;

  const enemyInfo = enemyTypes[aliveEnemy.type];
  if (!enemyInfo) return;

  if (!enemyInfo.attackFrames || enemyInfo.attackFrames <= 0) {
    enemyAttackImages = enemyIdleImages.slice();
  } else {
    enemyAttackImages = [];
    for (let i = 1; i <= enemyInfo.attackFrames; i++) {
      enemyAttackImages.push(enemyInfo.folder + `attack${i}.png`);
    }
  }
  enemyAttackFrameIndex = 0;
}

function startMainEnemyIdleAnimation() {
  const enemySprite = getElementInCurrentFloor("#enemy-character");
  if (!enemySprite || !allEnemiesInBattle[0]) return;
  if (enemyIdleTimer) clearInterval(enemyIdleTimer);

  enemySprite.src = enemyIdleImages[0];
  
  const enemyType = allEnemiesInBattle[0].type;
  if (['enemy1', 'enemy2', 'enemy4', 'enemy5'].includes(enemyType)) {
    enemySprite.style.transform = 'scaleX(-1)';
  } else {
    enemySprite.style.transform = '';
  }

  enemyIdleTimer = setInterval(() => {
    enemySprite.src = enemyIdleImages[enemyIdleFrameIndex];
    enemyIdleFrameIndex = (enemyIdleFrameIndex + 1) % enemyIdleImages.length;
  }, 200);
}

function startMainEnemyAttackAnimation() {
  const enemySprite = getElementInCurrentFloor("#enemy-character");
  if (enemyIdleTimer) clearInterval(enemyIdleTimer);
  if (enemyAttackTimer) clearInterval(enemyAttackTimer);

  enemySprite.src = enemyAttackImages[0];
  
  const enemyType = allEnemiesInBattle[0].type;
  if (['enemy1', 'enemy2', 'enemy4', 'enemy5'].includes(enemyType)) {
    enemySprite.style.transform = 'scaleX(-1)';
  } else {
    enemySprite.style.transform = '';
  }
  
  enemyAttackFrameIndex = 0;

  enemyAttackTimer = setInterval(() => {
    enemySprite.src = enemyAttackImages[enemyAttackFrameIndex];
    enemyAttackFrameIndex++;
    
    if (enemyAttackFrameIndex >= enemyAttackImages.length) {
      enemyAttackFrameIndex = 0;
      clearInterval(enemyAttackTimer);
      enemyAttackTimer = null;
    }
  }, 150);
}

function stopMainEnemyAttackAnimation() {
  clearInterval(enemyAttackTimer);
  enemyAttackTimer = null;
}

function stopMainEnemyIdleAnimation() {
  clearInterval(enemyIdleTimer);
  enemyIdleTimer = null;
}

function startEnemyAttackAnimationByIndex(enemyIndex) {
  if (!allEnemiesInBattle[enemyIndex]) return;
  
  const spriteId = enemyIndex === 0 ? "#enemy-character" : `#enemy-character${enemyIndex + 1}`;
  const enemySprite = getElementInCurrentFloor(spriteId);
  if (!enemySprite || enemyAttackImages.length === 0) return;

  if (!allEnemiesInBattle[enemyIndex].attackFrameIndex) {
    allEnemiesInBattle[enemyIndex].attackFrameIndex = 0;
  }
  if (!allEnemiesInBattle[enemyIndex].attackTimer) {
    allEnemiesInBattle[enemyIndex].attackTimer = null;
  }

  if (allEnemiesInBattle[enemyIndex].attackTimer) {
    clearInterval(allEnemiesInBattle[enemyIndex].attackTimer);
  }

  enemySprite.src = enemyAttackImages[0];
  
  const enemyType = allEnemiesInBattle[enemyIndex].type;
  if (['enemy1', 'enemy2', 'enemy4', 'enemy5'].includes(enemyType)) {
    enemySprite.style.transform = 'scaleX(-1)';
  } else {
    enemySprite.style.transform = '';
  }
  
  allEnemiesInBattle[enemyIndex].attackFrameIndex = 0;

  allEnemiesInBattle[enemyIndex].attackTimer = setInterval(() => {
    enemySprite.src = enemyAttackImages[allEnemiesInBattle[enemyIndex].attackFrameIndex];
    allEnemiesInBattle[enemyIndex].attackFrameIndex++;
    
    if (allEnemiesInBattle[enemyIndex].attackFrameIndex >= enemyAttackImages.length) {
      allEnemiesInBattle[enemyIndex].attackFrameIndex = 0;
      clearInterval(allEnemiesInBattle[enemyIndex].attackTimer);
      allEnemiesInBattle[enemyIndex].attackTimer = null;
    }
  }, 150);
}

function stopEnemyAttackAnimationByIndex(enemyIndex) {
  if (allEnemiesInBattle[enemyIndex] && allEnemiesInBattle[enemyIndex].attackTimer) {
    clearInterval(allEnemiesInBattle[enemyIndex].attackTimer);
    allEnemiesInBattle[enemyIndex].attackTimer = null;
  }
}

function startEnemyIdleAnimationByIndex(enemyIndex) {
  if (!allEnemiesInBattle[enemyIndex]) return;
  
  const spriteId = enemyIndex === 0 ? "#enemy-character" : `#enemy-character${enemyIndex + 1}`;
  const enemySprite = getElementInCurrentFloor(spriteId);
  if (!enemySprite || enemyIdleImages.length === 0) return;

  if (!allEnemiesInBattle[enemyIndex].idleFrameIndex) {
    allEnemiesInBattle[enemyIndex].idleFrameIndex = 0;
  }
  if (!allEnemiesInBattle[enemyIndex].idleTimer) {
    allEnemiesInBattle[enemyIndex].idleTimer = null;
  }

  if (allEnemiesInBattle[enemyIndex].idleTimer) {
    clearInterval(allEnemiesInBattle[enemyIndex].idleTimer);
  }

  enemySprite.src = enemyIdleImages[0];
  
  const enemyType = allEnemiesInBattle[enemyIndex].type;
  if (['enemy1', 'enemy2', 'enemy4', 'enemy5'].includes(enemyType)) {
    enemySprite.style.transform = 'scaleX(-1)';
  } else {
    enemySprite.style.transform = '';
  }
  
  allEnemiesInBattle[enemyIndex].idleFrameIndex = 0;

  allEnemiesInBattle[enemyIndex].idleTimer = setInterval(() => {
    enemySprite.src = enemyIdleImages[allEnemiesInBattle[enemyIndex].idleFrameIndex];
    allEnemiesInBattle[enemyIndex].idleFrameIndex = 
      (allEnemiesInBattle[enemyIndex].idleFrameIndex + 1) % enemyIdleImages.length;
  }, 200);
}

function stopEnemyIdleAnimationByIndex(enemyIndex) {
  if (allEnemiesInBattle[enemyIndex] && allEnemiesInBattle[enemyIndex].idleTimer) {
    clearInterval(allEnemiesInBattle[enemyIndex].idleTimer);
    allEnemiesInBattle[enemyIndex].idleTimer = null;
  }
}

function createEnemy(enemyType) {
  const enemyInfo = enemyTypes[enemyType];
  if (!enemyInfo) return;

  const newEnemy = {
    type: enemyType,
    name: enemyInfo.name,
    maxHp: enemyInfo.maxHp,
    hp: enemyInfo.maxHp,
    idleFrameIndex: 0,
    idleTimer: null
  };

  allEnemiesInBattle.push(newEnemy);
  loadEnemyIdleAnimation(enemyType);
}

function getPlayerTarget() {
  const aliveEnemy = allEnemiesInBattle.find(enemy => enemy && enemy.hp > 0);
  return aliveEnemy;
}

// ==========================================
// CLASS SELECTION
// ==========================================

const characterClasses = {
  thief: { 
    name: "Thief", 
    maxHp: 20,
    healBonus: 0,
    diceSides: 25
  },
  mage: { 
    name: "Mage", 
    maxHp: 22,  
    healBonus: 2,
    diceSides: 20
  },
  swordsman: { 
    name: "Swordsman", 
    maxHp: 30, 
    healBonus: 0,
    diceSides: 20
  }
};

// ==========================================
// TUTORIAL
// ==========================================

const tutorialMessages = [
  "Welcome, adventurer.",
  "This tower is ruled by fate and the roll of the dice.",
  "Each turn, you may attack or heal.",
  "Your power depends on the number you roll.",
  "Defeat enemies to climb higher and earn gold.",
  "Use gold to buy upgrades between floors.",
  "Beware, for each floor grows more dangerous.",
  "Every fifth floor houses a formidable boss.",
  "Now go. Your ascent begins."
];

let currentTutorialIndex = 0;

// ==========================================
// SCREEN MANAGEMENT
// ==========================================

function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.add("hidden");
  });
  
  const targetScreen = document.getElementById(screenId);
  if (targetScreen) {
    targetScreen.classList.remove("hidden");
  }
}

function startGame() {
  showScreen("class-select");
}

function exitGame() {
  alert("Thanks for playing!");
}

// ==========================================
// CLASS SELECTION SCREEN
// ==========================================

function selectClass(classKey) {
  const chosenClass = characterClasses[classKey];
  if (!chosenClass) return;

  player = {
    class: classKey,
    name: chosenClass.name,
    maxHp: chosenClass.maxHp,
    hp: chosenClass.maxHp,
    healBonus: chosenClass.healBonus,
    gold: 0,
    floor: 1
  };

  playerDiceSides = chosenClass.diceSides;

  loadPlayerIdleAnimation();
  startTutorial();
}

// ==========================================
// TUTORIAL FLOW
// ==========================================

function startTutorial() {
  currentTutorialIndex = 0;
  updateTutorialText();
  showScreen("tutorial");
}

function updateTutorialText() {
  const textElement = document.getElementById("dialogue-text");
  if (textElement) {
    textElement.innerText = tutorialMessages[currentTutorialIndex];
  }
}

function advanceDialogue() {
  currentTutorialIndex++;
  if (currentTutorialIndex < tutorialMessages.length) {
    updateTutorialText();
  } else {
    startFirstFloor();
  }
}

document.addEventListener("keydown", () => {
  const tutorialScreen = document.getElementById("tutorial");
  if (!tutorialScreen.classList.contains("hidden")) {
    advanceDialogue();
  }
});

// ==========================================
// FLOOR MANAGEMENT
// ==========================================

const floorConfig = {
  1: { enemies: ["slime"], layout: "floor-1" },
  2: { enemies: ["slime", "slime"], layout: "floor-2" },
  3: { enemies: ["enemy1"], layout: "floor-3" },
  4: { enemies: ["enemy1", "enemy1"], layout: "floor-2" },
  5: { enemies: ["enemy2"], layout: "floor-3" },
  6: { enemies: ["enemy2", "enemy2"], layout: "floor-2" },
  7: { enemies: ["enemy3"], layout: "floor-3" },
  8: { enemies: ["enemy3", "enemy3"], layout: "floor-2" },
  9: { enemies: ["enemy4"], layout: "floor-3" },
  10: { enemies: ["enemy4", "enemy4"], layout: "floor-2" },
  11: { enemies: ["enemy5"], layout: "floor-3" },
  12: { enemies: ["boss"], layout: "floor-3" }
};

function loadFloor() {
  const config = floorConfig[currentFloorNumber];
  if (!config) {
    console.error("No floor config for floor:", currentFloorNumber);
    return;
  }

  stopPlayerIdleAnimation();
  stopPlayerAttackAnimation();
  stopMainEnemyIdleAnimation();
  stopMainEnemyAttackAnimation();
  
  if (allEnemiesInBattle.length > 0) {
    for (let i = 0; i < allEnemiesInBattle.length; i++) {
      stopEnemyIdleAnimationByIndex(i);
    }
  }

  showScreen("game");

  for (let i = 1; i <= 3; i++) {
    const floor = document.getElementById(`floor-${i}`);
    if (floor) floor.classList.add("hidden");
  }

  const layoutFloor = document.getElementById(config.layout);
  if (layoutFloor) layoutFloor.classList.remove("hidden");

  setTimeout(() => {
    loadPlayerIdleAnimation();
    startPlayerIdleAnimation();
  }, 50);

  allEnemiesInBattle = [];
  config.enemies.forEach((enemyType, index) => {
    createEnemy(enemyType);
    startEnemyIdleAnimationByIndex(index);
  });

  currentEnemyTurnIndex = 0;
  currentEnemyTargetIndex = 0;
  startBattle();
}

function startFirstFloor() {
  currentFloorNumber = 1;
  loadFloor();
}

// ==========================================
// HEALTH BAR DISPLAY
// ==========================================

function updateHealthBars() {
  const playerHealthBar = getElementInCurrentFloor(".player-health-bar");
  if (playerHealthBar) {
    const playerHealthPercent = (player.hp / player.maxHp) * 100;
    playerHealthBar.style.width = `${playerHealthPercent}%`;
  }

  const enemySlot = getElementInCurrentFloor(".enemy-slot");
  const enemyGroups = enemySlot ? enemySlot.querySelectorAll(".enemy-group") : [];
  
  allEnemiesInBattle.forEach((enemy, index) => {
    if (!enemy || !enemyGroups[index]) return;
    
    const healthBar = enemyGroups[index].querySelector("[class*='enemy-health-bar']");
    if (healthBar) {
      const enemyHealthPercent = (enemy.hp / enemy.maxHp) * 100;
      healthBar.style.width = `${enemyHealthPercent}%`;
    }
  });
}

// ==========================================
// DICE AND EFFECTS
// ==========================================

let playerDiceSides = 20;
let enemyDiceSides = 10;
let bossDiceSides = 25;

function rollDice(numberOfSides) {
  return Math.floor(Math.random() * numberOfSides) + 1;
}

function showPlayerHealEffect(elementId) {
  const healElement = getElementInCurrentFloor(`#${elementId}`) || document.getElementById(elementId);
  if (!healElement) return;
  
  healElement.classList.add("hidden");
  
  setTimeout(() => {
    healElement.classList.remove("hidden");
    
    void healElement.offsetWidth; 
    healElement.style.animation = "none";
    setTimeout(() => {
      healElement.style.animation = "";
    }, 10);
  }, 10);
  
  setTimeout(() => {
    healElement.classList.add("hidden");
  }, 2000);
}

function showEnemyHealEffect(enemyIndex) {
  const enemySlot = getElementInCurrentFloor('.enemy-slot');
  if (!enemySlot) return;
  
  const groups = enemySlot.querySelectorAll('.enemy-group');
  const healElement = groups[enemyIndex]?.querySelector('.enemy-heal-effect');
  if (!healElement) return;

  healElement.classList.add('hidden');
  setTimeout(() => {
    healElement.classList.remove('hidden');
    void healElement.offsetWidth;
    healElement.style.animation = 'none';
    setTimeout(() => {
      healElement.style.animation = '';
    }, 10);
  }, 10);

  setTimeout(() => {
    healElement.classList.add('hidden');
  }, 2000);
}

// ==========================================
// GAME LOOP
// ==========================================

let turnNumber = 0;
let isBattleActive = false;

function startBattle() {
  isBattleActive = true;
  turnNumber = 0;
  updateHealthBars();
  startPlayerTurn();
}

// ==========================================
// PLAYER TURN
// ==========================================

function startPlayerTurn() {
  if (!isBattleActive) return;
  
  turnNumber++;
  
  document.getElementById("whose-turn").classList.remove("hidden");
  document.getElementById("whose-turn").textContent = `Your Turn`;
  document.getElementById("roll-number").classList.add("hidden");
  document.getElementById("information").classList.remove("hidden");
  
  document.getElementById("attack-card").classList.remove("hidden");
  document.getElementById("heal-card").classList.remove("hidden");
}

function playerAttack() {
  if (!isBattleActive) return;
  
  document.getElementById("attack-card").classList.add("hidden");
  document.getElementById("heal-card").classList.add("hidden");
  
  const playerSprite = getElementInCurrentFloor("#player-character");
  const playerContainer = getElementInCurrentFloor(".player-slot");
  
  stopPlayerIdleAnimation();
  
  const targetEnemy = getPlayerTarget();
  const targetIndex = allEnemiesInBattle.findIndex(e => e === targetEnemy);
  const slideDistances = currentFloorNumber === 1 ? [600, 590, 770] : [600, 900, 1200];
  const slideDistance = slideDistances[targetIndex] || 600;
  
  playerContainer.classList.add("player-slide-right");
  playerContainer.style.setProperty('--slide-distance', slideDistance + 'px');
  
  setTimeout(() => {
    loadPlayerAttackAnimation();
    startPlayerAttackAnimation();
    
    const damageRoll = rollDice(playerDiceSides);
    if (targetEnemy) {
      targetEnemy.hp = Math.max(targetEnemy.hp - damageRoll, 0);
      // Check if enemy died and collect gold
      if (targetEnemy.hp <= 0) {
        const goldReward = enemyTypes[targetEnemy.type]?.goldReward || 0;
        player.gold += goldReward;
        console.log(`Enemy defeated! Earned ${goldReward} gold!`);
      }
    }
    updateHealthBars();
    
    document.getElementById("roll-number").classList.remove("hidden");
    document.getElementById("roll-number").textContent = `Player attacked for: ${damageRoll}`;
  }, 1000);
  
  setTimeout(() => {
    stopPlayerAttackAnimation();
    startPlayerIdleAnimation();
    playerContainer.classList.remove("player-slide-right");
    playerContainer.classList.add("player-slide-left");
    playerContainer.style.setProperty('--slide-distance', slideDistance + 'px');
  }, 1600);
  
  setTimeout(() => {
    document.getElementById("roll-number").classList.add("hidden");
    document.getElementById("whose-turn").classList.add("hidden");
    playerContainer.classList.remove("player-slide-left");
    playerContainer.style.setProperty('--slide-distance', '0px');
    
    if (checkIfGameOver()) return;
    
    setTimeout(startEnemyTurn, 300);
  }, 2600);
}

function playerHeal() {
  if (!isBattleActive) return;
  
  document.getElementById("attack-card").classList.add("hidden");
  document.getElementById("heal-card").classList.add("hidden");
  document.getElementById("information").classList.add("hidden");
  
  const healRoll = rollDice(playerDiceSides);
  const totalHealAmount = healRoll + player.healBonus;
  const actualHeal = Math.ceil(totalHealAmount / 2);
  player.hp = Math.min(player.hp + actualHeal, player.maxHp);
  updateHealthBars();
  
  showPlayerHealEffect("player-heal-effect");
  
  document.getElementById("roll-number").classList.remove("hidden");
  document.getElementById("roll-number").textContent = "You healed for: " + actualHeal;
  document.getElementById("information").classList.remove("hidden");

  if (checkIfGameOver()) return;

  setTimeout(startEnemyTurn, 1000);
}

// ==========================================
// ENEMY TURN
// ==========================================

function startEnemyTurn() {
  if (!isBattleActive) return;
  
  turnNumber++;
  
  while (currentEnemyTurnIndex < allEnemiesInBattle.length && 
         allEnemiesInBattle[currentEnemyTurnIndex].hp <= 0) {
    currentEnemyTurnIndex++;
  }
  
  if (currentEnemyTurnIndex >= allEnemiesInBattle.length) {
    currentEnemyTurnIndex = 0;
    setTimeout(startPlayerTurn, 300);
    return;
  }
  
  const activeEnemy = allEnemiesInBattle[currentEnemyTurnIndex];
  
  document.getElementById("information").classList.remove("hidden");
  document.getElementById("whose-turn").classList.remove("hidden");
  document.getElementById("whose-turn").textContent = `Enemy ${currentEnemyTurnIndex + 1}'s Turn`;
  document.getElementById("roll-number").classList.add("hidden");
  
  document.getElementById("attack-card").classList.add("hidden");
  document.getElementById("heal-card").classList.add("hidden");
  
  const randomChoice = Math.random();
  
  if (randomChoice < 0.7) {
    const spriteId = currentEnemyTurnIndex === 0 ? "#enemy-character" : `#enemy-character${currentEnemyTurnIndex + 1}`;
    const enemySprite = getElementInCurrentFloor(spriteId);
    const enemyContainer = enemySprite ? enemySprite.closest(".enemy-group") : null;

    stopEnemyIdleAnimationByIndex(currentEnemyTurnIndex);

    const enemySlideDistances = currentFloorNumber === 1 ? [410, 590, 770] : [600, 900, 1200];
    const slideDistance = -(enemySlideDistances[currentEnemyTurnIndex]);
    
    if (enemyContainer) {
      enemyContainer.classList.add("enemy-slide-left");
      enemyContainer.style.setProperty('--enemy-slide-distance', slideDistance + 'px');
    }

    setTimeout(() => {
      loadEnemyAttackAnimation();
      startEnemyAttackAnimationByIndex(currentEnemyTurnIndex);
      
      const damageRoll = rollDice(enemyDiceSides);
      player.hp = Math.max(player.hp - damageRoll, 0);
      updateHealthBars();
      
      document.getElementById("roll-number").classList.remove("hidden");
      document.getElementById("roll-number").textContent = `Enemy ${currentEnemyTurnIndex + 1} attacked for: ${damageRoll}`;
    }, 1000);
    
    setTimeout(() => {
      stopEnemyAttackAnimationByIndex(currentEnemyTurnIndex);
      startEnemyIdleAnimationByIndex(currentEnemyTurnIndex);
      if (enemyContainer) {
        enemyContainer.classList.remove("enemy-slide-left");
        enemyContainer.classList.add("enemy-slide-right");
        enemyContainer.style.setProperty('--enemy-slide-distance', slideDistance + 'px');
      }
    }, 1600);

    setTimeout(() => {
      document.getElementById("information").classList.add("hidden");
      
      if (enemyContainer) {
        enemyContainer.classList.remove("enemy-slide-right");
        enemyContainer.style.setProperty('--enemy-slide-distance', '0px');
      }
      
      if (checkIfGameOver()) return;
      
      currentEnemyTurnIndex++;
      setTimeout(startEnemyTurn, 300);
    }, 2600);

  } else {
    const healRoll = rollDice(enemyDiceSides) + 2;
    const actualHeal = Math.ceil(healRoll / 2);
    activeEnemy.hp = Math.min(activeEnemy.hp + actualHeal, activeEnemy.maxHp);
    updateHealthBars();
    
    showEnemyHealEffect(currentEnemyTurnIndex);
    
    document.getElementById("roll-number").classList.remove("hidden");
    document.getElementById("roll-number").textContent = `Enemy ${currentEnemyTurnIndex + 1} healed for: ${actualHeal}`;
    
    if (checkIfGameOver()) return;
    
    setTimeout(() => {
      document.getElementById("information").classList.add("hidden");
      
      if (checkIfGameOver()) return;
      
      currentEnemyTurnIndex++;
      setTimeout(startEnemyTurn, 300);
    }, 2000);
  }
}

// ==========================================
// GAME OVER CHECK
// ==========================================

function checkIfGameOver() {
  if (player.hp <= 0) {
    isBattleActive = false;
    document.getElementById("attack-card").classList.add("hidden");
    document.getElementById("heal-card").classList.add("hidden");
    document.getElementById("roll-number").classList.remove("hidden");
    document.getElementById("roll-number").textContent = "You died! Game Over.";
    alert(`You were defeated on floor ${player.floor}!`);
    showScreen("menu");
    return true;
  }
  
  const allEnemiesDead = allEnemiesInBattle.every(enemy => enemy.hp <= 0);
  if (allEnemiesDead) {
    isBattleActive = false;
    document.getElementById("attack-card").classList.add("hidden");
    document.getElementById("heal-card").classList.add("hidden");
    document.getElementById("roll-number").classList.remove("hidden");
    document.getElementById("roll-number").textContent = "Floor cleared!";
    alert(`Floor cleared!`);

    const floorInfo = floorConfig[currentFloorNumber] || {};
    const defeatedBoss = floorInfo.enemies && floorInfo.enemies.includes("boss");
    if (defeatedBoss) {
      setTimeout(() => {
        showGameComplete();
      }, 500);
      return true;
    }
    
    player.floor++;
    currentFloorNumber++;
    
    playerDiceSides += 3;
    console.log(`Dice upgraded! Now rolling a ${playerDiceSides}-sided die.`);
    
    setTimeout(() => {
      showShop();
    }, 1000);
    
    return true;
  }
  
  return false;
}

function showGameComplete() {
  showScreen("game-complete");
}

// ==========================================
// SHOP SYSTEM
// ==========================================

function showShop() {
  // Hide combat elements
  for (let i = 1; i <= 3; i++) {
    const floor = document.getElementById(`floor-${i}`);
    if (floor) floor.classList.add("hidden");
  }
  
  // Update shop display
  document.getElementById("shop-floor").textContent = currentFloorNumber - 1;
  document.getElementById("shop-gold").textContent = player.gold;
  document.getElementById("shop-hp").textContent = player.hp;
  document.getElementById("shop-max-hp").textContent = player.maxHp;
  
  // Populate shop items
  populateShopItems();
  
  // Show shop
  showScreen("game");
  document.getElementById("shop").classList.remove("hidden");
}

function populateShopItems() {
  const container = document.getElementById("shop-items");
  container.innerHTML = "";
  
  shopItems.forEach(item => {
    const itemDiv = document.createElement("div");
    itemDiv.className = "shop-item";
    if (player.gold < item.cost) {
      itemDiv.classList.add("disabled");
    }
    
    const name = document.createElement("div");
    name.className = "shop-item-name";
    name.textContent = item.name;
    
    const description = document.createElement("div");
    description.className = "shop-item-description";
    description.textContent = item.description;
    
    const price = document.createElement("div");
    price.className = "shop-item-price";
    price.innerHTML = `Cost: <span class="gold">${item.cost}</span> ⭐`;
    
    const button = document.createElement("button");
    button.className = "shop-item-btn";
    button.textContent = player.gold >= item.cost ? "BUY" : "NOT ENOUGH";
    button.disabled = player.gold < item.cost;
    button.onclick = () => buyItem(item);
    
    itemDiv.appendChild(name);
    itemDiv.appendChild(description);
    itemDiv.appendChild(price);
    itemDiv.appendChild(button);
    
    container.appendChild(itemDiv);
  });
}

function buyItem(item) {
  if (player.gold >= item.cost) {
    player.gold -= item.cost;
    item.effect();
    
    // Update display
    document.getElementById("shop-gold").textContent = player.gold;
    document.getElementById("shop-hp").textContent = player.hp;
    document.getElementById("shop-max-hp").textContent = player.maxHp;
    
    // Refresh shop items display
    populateShopItems();
    
    console.log(`Purchased: ${item.name}`);
  }
}

function closeShop() {
  document.getElementById("shop").classList.add("hidden");
  loadFloor();
}

// ==========================================
// BUTTON CLICK LISTENERS
// ==========================================

document.getElementById("attack-card").onclick = playerAttack;
document.getElementById("heal-card").onclick = playerHeal;
