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


