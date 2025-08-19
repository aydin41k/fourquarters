## 0.1.1 - 2025-08-19 (UTC)

- Configure Next.js for static export to GitHub Pages (`output: "export"`).
- Add conditional `basePath` and `assetPrefix` for `four-quarters` when running on GitHub Actions.
- Set `images.unoptimized` and `trailingSlash` for better Pages compatibility.
- Update GitHub Actions workflow to upload the `out` directory instead of `dist`.
- Add a verification step to ensure `out/index.html` is produced before deployment.
- Fix TypeScript/ESLint issues in `app/components/BattlePrototype.tsx` to restore green build.


