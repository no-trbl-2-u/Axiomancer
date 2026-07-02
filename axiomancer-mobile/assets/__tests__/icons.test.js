const fs = require('fs');
const path = require('path');

describe('App Icon Assets', () => {
  const assetsPath = path.join(__dirname, '../images');

  // Android adaptive-icon sources now live under
  // `assets/images/android/res/mipmap-xxxhdpi/` — the highest-density
  // layer from the user-supplied resource tree. `app.json`'s
  // `android.adaptiveIcon` points at these directly; EAS regenerates
  // per-density mipmaps from them at build time.
  const requiredIcons = [
    { file: 'icon.png', description: 'iOS app icon', expectedSize: 1024 },
    { file: 'android/res/mipmap-xxxhdpi/ic_launcher_foreground.png', description: 'Android adaptive foreground', expectedSize: 432 },
    { file: 'android/res/mipmap-xxxhdpi/ic_launcher_background.png', description: 'Android adaptive background', expectedSize: 432 },
    { file: 'android/res/mipmap-xxxhdpi/ic_launcher_monochrome.png', description: 'Android monochrome', expectedSize: 432 },
    { file: 'favicon.png', description: 'Web favicon', expectedSize: 192 },
    { file: 'splash-icon.png', description: 'Splash screen icon', expectedSize: 200 }
  ];

  test.each(requiredIcons)(
    '$description ($file) exists',
    ({ file }) => {
      const iconPath = path.join(assetsPath, file);
      expect(fs.existsSync(iconPath)).toBe(true);
    }
  );

  test.each(requiredIcons)(
    '$description ($file) has valid PNG extension and size',
    ({ file }) => {
      const iconPath = path.join(assetsPath, file);
      const stats = fs.statSync(iconPath);
      
      // File should exist and have reasonable size
      expect(stats.size).toBeGreaterThan(100);
      
      // File should have PNG extension
      expect(path.extname(file)).toBe('.png');
    }
  );

  test('All required icon assets have correct file sizes', () => {
    requiredIcons.forEach(({ file }) => {
      const iconPath = path.join(assetsPath, file);
      const stats = fs.statSync(iconPath);
      // Icons should not be empty and should be reasonable file sizes.
      // The launcher art is a full painted illustration (throne-room key
      // art), so the 1024px master is palette-compressed but still far
      // larger than the old flat crest — keep a generous upper bound.
      expect(stats.size).toBeGreaterThan(100);
      expect(stats.size).toBeLessThan(800000); // 800KB upper limit for the illustrated icon
    });
  });
});