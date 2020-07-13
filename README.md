# TETRIS SWITCH

Tetris game version made with JavaScript & jQuery.

You can play it here: [Tetris Switch](https://bgonp.github.io/tetrisjs/)


## Description

This game follows the basis of traditional Tetris but adds a new feature: you can switch between two boards and decide which one will receive each piece (tetrimino). This board switching can be manual or auto.

## Controls

By the moment Tetris Switch works only in desktop mode and it can by controlled by keyboard:

- **Left / Right arrows**: Move blocks left /right
- **Down arrow**: Move blocks fast down
- **Space**: Translate blocks to the bottom
- **Up Arrow**: Rotate blocks
- **C key**: Switch between boards (only manual mode)
- **Escape**: Pause the game
- **S key**: Start a new game

## Settings

There are two different modes, you can choose which one to play before each game starts:
- **Auto-switch**: Everytime you clear a row (or a group of rows) the boards switch.
- **Manual**: You can switch between boards whenever you want by pressing `c` key.

In addition, before each game you can create your custom tetriminos which will replace traditional ones to make your game different.

![Tetris Switch settings](https://raw.githubusercontent.com/bgonp/tetrisjs/master/screenshots/settings.png)

## Scoring

The more lines you make at once, the more points you earn:

- **1 line**: 100 points
- **2 lines**: 800 points
- **3 lines**: 2700 points
- **4 lines**: 6400 points

Win small extra points by lower a tetrimino by pressing `space` key.

In manual mode you can get score multipliers by clearing rows alternatively between boards. Do it several times to increase the multiplier doing boards streaks.

Tetriminos falling speed will increase gradually to make them harder to handle if the game become longer and longer.

![Tetris Switch main game](https://raw.githubusercontent.com/bgonp/tetrisjs/master/screenshots/game.png)

## Twitch version: Tetrazos

I also developed a private version of this game with Twitch chat integration used in streams by [**Pazos64**](https://www.twitch.tv/pazos64). You can see it working in [**this video**](https://www.youtube.com/watch?v=H0d7MMKxMcE&feature=youtu.be&t=6678)

![Tetrazos](https://raw.githubusercontent.com/bgonp/tetrisjs/master/screenshots/pazos64.png)

