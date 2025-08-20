# FOUR QUARTERS - User Manual

## What is FOUR QUARTERS?

FOUR QUARTERS is a turn-based combat game built as a Telegram Web App and web browser game. It's a strategic fighting game where you battle against an AI opponent using tactical zone-based attacks and defences. The game combines elements of strategy, probability, and visual feedback to create an engaging combat experience.

## Game Overview

### Core Concept
FOUR QUARTERS is a tactical combat game where you control a fighter in turn-based battles. Each turn, you must choose:
- **One attack zone** to strike your opponent
- **Two block zones** to protect yourself from incoming attacks

### Game Modes
- **Telegram Web App**: Optimised for mobile play within Telegram
- **Web Browser**: Full-featured version for desktop and mobile browsers

## How It Works

### Technical Architecture
- Built with **Next.js 15** and **React 19**
- Uses **TypeScript** for type safety
- Styled with **Tailwind CSS** for responsive design
- Integrates with **Telegram Web App SDK** for mobile optimisation
- Features **Web Audio API** for sound effects
- Includes **local storage** for game state persistence

### Game Engine
The game uses a sophisticated damage calculation system:
- Base damage: 18% of attacker's maximum HP
- Bonus damage system with probability-based increments:
  - +0% bonus: 64% chance
  - +2% bonus: 20% chance  
  - +4% bonus: 10% chance
  - +6% bonus: 5% chance
  - +8% bonus: 1% chance

## Gameplay Mechanics

### Combat Zones
The game features five distinct body zones:
1. **Head** - High-risk, high-reward target
2. **Chest** - Balanced target zone
3. **Torso** - Mid-section target
4. **Knees** - Lower body target
5. **Feet** - Ground-level target

### Turn Structure
Each turn consists of:
1. **Planning Phase**: Select your attack and block zones
2. **Resolution Phase**: Both fighters' choices are revealed simultaneously
3. **Combat Phase**: Damage is calculated and applied
4. **Feedback Phase**: Visual effects, sounds, and haptic feedback

### Combat Rules
- **Attacks**: Choose exactly one zone to attack
- **Blocks**: Select exactly two zones to defend
- **Damage**: Blocked attacks deal 0 damage
- **HP System**: Level 1 fighters have 50 HP, Level 2 have 120 HP
- **Victory**: Reduce opponent's HP to 0 or less

### Reward System
- **Winner**: Receives 100% of damage dealt as rewards
- **Loser**: Receives 50% of damage dealt as rewards
- **Draw**: Both fighters receive 50% of damage dealt

## How to Play

### Getting Started

#### For Telegram Users:
1. Open the game through a Telegram bot or link
2. The game automatically detects your Telegram account
3. Your username and preferences are automatically loaded
4. The interface adapts to Telegram's theme (light/dark mode)

#### For Web Browser Users:
1. Open the game in any modern web browser
2. The game runs in standalone mode
3. Choose your preferred theme (light/dark)
4. All features are available without Telegram integration

### Basic Controls

#### Zone Selection
- **Mannequins are the inputs**: Tap/click directly on the mannequins. There are no duplicate pill buttons.
- **Attack Zone**: Tap your opponent's mannequin to select where to attack (pick exactly one).
- **Block Zones**: Tap your own mannequin to toggle up to two defence zones (pick exactly two).
- **Large tap targets**: Each zone has an enlarged invisible hitbox for easier selection. Subtle press feedback is shown; hover pop-out is removed.
- **Visual Feedback**: Selected zones are highlighted with clear colours. Blocked/Hit results are shown with blue/red overlays respectively.

#### Helper Bar (Sticky Summary)
- **Always visible while planning**: A helper bar sits above the main CTA summarising your current plan.
- **Summary**: “You will block: Head, Knees • You will attack: Chest”.
- **Change chips**: Tiny “Change” chips quickly refocus the relevant mannequin to adjust selections.
- **Blocks left**: Shows “2 blocks left” until you’ve selected both blocks.
- **CTA lock**: The main action button stays disabled until your plan is valid (exactly 2 blocks and 1 attack).

#### Game Controls
- **Resolve Turn**: Execute your chosen attack and defence strategy
- **Reset**: Clear your current selections and start over
- **Restart**: Begin a new battle with the same level settings
- **Level Selection**: Choose between Level 1 (50 HP) and Level 2 (120 HP)
- **Telegram FAB**: When running inside Telegram, a floating action button mirrors the primary action for quick access.

#### First‑Move Hints
- **When shown**: Only for Level 1, Round 1, and only before any selections have been made.
- **What you’ll see**: A small hint above each mannequin — “Block 2 areas” above yours and “Hit 1” above the opponent.
- **When they disappear**: As soon as you pick any attack or block, the hints hide automatically.

### Advanced Features

#### Telegram Integration
- **Haptic Feedback**: Feel the game through your device's vibration
- **Main Button**: Large, accessible button for primary actions
- **Back Button**: Navigate through game states
- **Theme Integration**: Automatically matches Telegram's appearance
- **Viewport Management**: Optimises for different screen sizes

#### Visual Effects
- **Damage Numbers**: Larger, clearer floating damage indicators that linger a little longer for readability.
- **Placement**: Damage appears on the correct mannequin at the red hit zone (your mannequin when you’re hit; opponent’s when they’re hit).
- **Slash Effects**: Visual representation of attacks
- **Block Effects**: Parry animations for successful defences
- **Screen Shake**: Impact feedback for combat actions

#### Audio System
- **Hit Sounds**: Distinct audio for successful attacks
- **Block Sounds**: Different audio for blocked attacks
- **Dynamic Audio**: Responsive sound based on combat outcomes

## Game Strategies

### Attack Strategies
- **Zone Targeting**: Focus on areas your opponent doesn't typically block
- **Pattern Recognition**: Learn your opponent's blocking habits
- **Risk Assessment**: Balance high-damage zones with predictability

### Defence Strategies
- **Zone Coverage**: Protect your most vulnerable areas
- **Predictive Blocking**: Anticipate where your opponent will attack
- **Adaptive Defence**: Change your blocking pattern each turn

### Level Considerations
- **Level 1 (50 HP)**: Faster-paced, more tactical gameplay
- **Level 2 (120 HP)**: Longer battles, more strategic depth

## User Interface

### Main Screen Layout
1. **Header**: Game title, player info, and level selectors
2. **Fighter Cards**: HP bars, status, and last actions for both fighters
3. **Combat Zone**: Interactive body diagrams for attack and defence
4. **Controls**: Action buttons and game state information
5. **Combat Log**: Detailed history of all actions and outcomes
6. **Floating Actions**: Quick access buttons for common actions

### Visual Elements
- **Colour Coding**: Different colours for different game states
- **Animations**: Smooth transitions and visual feedback
- **Responsive Design**: Adapts to different screen sizes
- **Accessibility**: High contrast and clear visual hierarchy

### Mobile Optimisation
- **Touch-Friendly**: Large touch targets for mobile devices
- **Gesture Support**: Intuitive tap and swipe interactions
- **Performance**: Optimised for mobile hardware
- **Battery Efficient**: Minimal resource usage

## Troubleshooting

### Common Issues

#### Game Not Loading
- Check your internet connection
- Ensure JavaScript is enabled
- Try refreshing the page
- Clear browser cache if needed

#### Audio Not Working
- Check device volume settings
- Ensure browser allows audio playback
- Try interacting with the page first (browser autoplay policies)

#### Performance Issues
- Close other browser tabs
- Restart the game
- Check device memory usage
- Use a modern browser version

### Getting Help
- Check the combat log for detailed game information
- Use the reset button if you're stuck
- Restart the game for a fresh start
- Contact support if issues persist

## Advanced Tips

### Combat Mastery
- **Study Patterns**: Observe your opponent's tendencies
- **Mix Strategies**: Vary your attack and defence patterns
- **Timing**: Use the reset button strategically to change tactics
- **Risk Management**: Balance aggressive and defensive play

### Technical Optimisation
- **Save States**: Use the auto-save feature for long sessions
- **Theme Switching**: Choose the theme that works best for your environment
- **Device Settings**: Adjust haptic feedback intensity if needed
- **Browser Choice**: Use modern browsers for best performance

## Future Features

The game is actively developed with planned additions:
- **Multiplayer Battles**: Fight against other players
- **Character Customisation**: Personalise your fighter
- **Achievement System**: Track your progress and accomplishments
- **Tournament Mode**: Compete in organised competitions
- **Advanced AI**: More sophisticated opponent behaviours

## Technical Requirements

### Minimum Requirements
- **Browser**: Modern web browser (Chrome 90+, Firefox 88+, Safari 14+)
- **Device**: Smartphone, tablet, or computer
- **Connection**: Stable internet connection
- **Storage**: Minimal local storage for game saves

### Recommended Setup
- **Browser**: Latest version of Chrome, Firefox, or Safari
- **Device**: Modern smartphone or computer
- **Connection**: Fast, stable internet
- **Audio**: Speakers or headphones for full experience

### Telegram Requirements
- **App Version**: Telegram 7.0 or later
- **Platform**: iOS, Android, or desktop
- **Permissions**: Allow web app access
- **Account**: Valid Telegram account

## Conclusion

FOUR QUARTERS offers a unique blend of strategy and action in a turn-based combat format. Whether you're playing on Telegram or in a web browser, the game provides an engaging experience with deep tactical gameplay, beautiful visuals, and responsive controls.

The game's design philosophy emphasises accessibility, performance, and user experience, making it enjoyable for players of all skill levels. With its sophisticated damage system, strategic depth, and modern web technologies, FOUR QUARTERS represents the cutting edge of browser-based gaming.

Jump into battle, master the zones, and become the ultimate fighter in FOUR QUARTERS!

