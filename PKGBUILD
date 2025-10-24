# Maintainer: Jan Kofron <jan.kofron@gmail.com>
pkgname=trello-electron-app
pkgver=1.0.0
pkgrel=1
pkgdesc="Single-board Trello wrapper (Electron) with tray and window restore"
arch=('x86_64')
url="https://github.com/jankofron/trello-electron-app"
license=('MIT')
depends=('electron' 'hicolor-icon-theme' 'libappindicator-gtk3')
makedepends=('nodejs' 'npm' 'asar' 'git')
source=("${pkgname}-${pkgver}.tar.gz::https://github.com/jankofron/trello-electron-app/archive/refs/tags/v${pkgver}.tar.gz")
sha256sums=('SKIP')  # set real sum

# App install dir (where we put app.asar and resources)
_appdir="usr/lib/${pkgname}"

build() {
  cd "${srcdir}/${pkgname}-${pkgver}"
  # install JS deps reproducibly
  npm i --omit=dev --no-optional --ignore-scripts
  # produce app.asar (no embedded electron)
  npx asar pack . app.asar
}

package() {
  cd "${srcdir}/${pkgname}-${pkgver}"

  # App resources
  install -d "${pkgdir}/${_appdir}"
  install -m644 app.asar "${pkgdir}/${_appdir}/app.asar"

  # Icons
  install -Dm644 assets/icons/icon.png \
    "${pkgdir}/usr/share/icons/hicolor/512x512/apps/${pkgname}.png"

  # Desktop launcher uses system electron to run our asar
  install -Dm755 /dev/stdin "${pkgdir}/usr/bin/${pkgname}" <<'EOF'
#!/bin/sh
exec /usr/bin/electron /usr/lib/trello-electron-app/app.asar "$@"
EOF

  # .desktop file
  install -Dm644 /dev/stdin "${pkgdir}/usr/share/applications/${pkgname}.desktop" <<'EOF'
[Desktop Entry]
Name=Trello Board
Comment=Single-board Trello wrapper
Exec=trello-electron-app
Terminal=false
Type=Application
Categories=Utility;
Icon=trello-electron-app
EOF

  # License if you have one
  [[ -f LICENSE ]] && install -Dm644 LICENSE "${pkgdir}/usr/share/licenses/${pkgname}/LICENSE"
}

