# Steps to generate iOS Splash Screens

## Install tools

```bash
npm install --global pwa-asset-generator
brew install pngquant
```
PWA Asset Generator brings in puppeteer, Google Chrome etc
so not worth installing locally.
pngquant at least in this project's case produces smaller
PNGs than the JPG output.

## Usage

```bash
npx pwa-asset-generator icon/combined-bare.png ./src/img --splash-only --portrait-only --background=#263238 --type=png
pngquant ./src/img/apple-splash-*
```
Copy any new splash screen sizes into `src/index.html`.
Note that `pngquant` adds a `-fs8` prefix to the filename.
Delete the un-prefixed versions as well.
