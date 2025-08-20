## 0.1.3 - 2025-08-20 (UTC)

- Remove duplicate Attack/Block pills; mannequins are now the sole inputs
  - Large tap areas via invisible SVG hitboxes
  - Hover/pulse feedback on touch for clearer interaction
- Add sticky helper bar above the CTA
  - Shows “You will block: … • You will attack: …”
  - Tiny “Change” chips to refocus the relevant mannequin
  - Shows “2 blocks left” indicator until complete
- Lock CTA until a valid selection (one attack, two blocks) to reduce cognitive load

## 0.1.4 - 2025-08-20 (UTC)

- Tuning and correctness for battle UX
  - Remove hover pop-out scaling; keep subtle press scale
  - Add small visual gap between `Chest` and `Torso` on mannequins
  - Enlarge and slow damage numbers; extract FX TTL into constants
  - Place damage FX on the correct mannequin (yours vs opponent)
  - First-move hints shown at the top of mannequins: “Block 2 areas” (you) and “Hit 1” (opponent)
    - Hints only appear for Level 1, Round 1, and disappear as soon as a selection is made
  - Fix duplicate “Make your move” button; only one CTA rendered
  - Keep FAB for Telegram quick resolve/play-again
  
- Tests
  - Add `EffectsLayer.test.mjs` to assert larger text + slower animation
  - Extend `BattlePrototype.test.mjs` to assert helper bar and first-move hints
  
- Documentation
  - Update `USER_MANUAL.md` to reflect mannequins-only interaction, sticky helper bar, Level 1/Round 1 hints, FX placement/size/timing, CTA lock, and enlarged tap targets

## 0.1.5 - 2025-08-20 (UTC)

- Build hygiene: remove assets not used by the app build (kept anything referenced by tests)
  - Deleted unused public icons: `public/next.svg`, `public/vercel.svg`, `public/file.svg`, `public/globe.svg`, `public/window.svg`
  - Deleted unused tiles assets: `public/assets/road-tile.svg`, `public/assets/tiles-svgrepo-com.svg`
  - Deleted duplicate icon copies under `app/assets/` (MapScene uses `public/assets/*`)
  - Verified all tests still pass after cleanup

## 0.1.6 - 2025-08-20 (UTC)

- Bug fix: Game now always starts from Round 1 instead of restoring saved round number
  - Fixed `loadGameState()` in both `BattlePrototype.tsx` and `game/Battle.tsx`
  - Previously, loading a saved game would start from Round 2+ if that's what was saved
  - Now always starts fresh from Round 1 for better user experience
  - Added test assertions to prevent regression

## 0.1.2 - 2025-08-19 (UTC)

- **Major Feature**: Add comprehensive Telegram Game SDK integration
  - Haptic feedback for all game interactions (hits, blocks, wins, losses)
  - Dynamic main button management with progress indicators
  - Back button handling for navigation
  - Theme-aware UI that adapts to Telegram's light/dark themes
  - Viewport-aware responsive design
  - User personalisation with Telegram user info
  - Enhanced visual effects with Telegram-specific animations
  - Game state persistence with auto-save/load functionality
  - Floating action buttons for quick game actions
  - Enhanced notification system with custom alerts
  - Share functionality for game results
- **Compatibility**: Maintain full web browser compatibility with graceful fallbacks
  - All Telegram features are optional and won't break web experience
  - Automatic detection of Telegram environment vs web browser
  - Fallback notifications and interactions for non-Telegram users
  - Responsive design that works on all devices
- **UX Improvements**: Enhanced game experience with modern mobile-first design
  - Improved button interactions with haptic feedback
  - Better visual feedback for zone selections
  - Enhanced game state management
  - Improved accessibility and user guidance

## 0.1.1 - 2025-08-19 (UTC)

- Configure Next.js for static export to GitHub Pages (`output: "export"`).
- Add conditional `basePath` and `assetPrefix` for `four-quarters` when running on GitHub Actions.
- Set `images.unoptimized` and `trailingSlash` for better Pages compatibility.
- Update GitHub Actions workflow to upload the `out` directory instead of `dist`.
- Add a verification step to ensure `out/index.html` is produced before deployment.
- Fix TypeScript/ESLint issues in `app/components/BattlePrototype.tsx` to restore green build.


