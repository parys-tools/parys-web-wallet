require('dotenv').config()
const platform = require('os').platform()
const { notarize } = require('electron-notarize')

async function notarizeApp(context) {
  console.log(
    'Beginning app notarization, ignore electron builder error that it could not find this'
  )

  if (platform !== 'darwin') {
    console.log('OS is not mac, skipping notarization.')
    return
  }

  const { APPLE_ID, APPLE_ID_PASSWORD } = process.env
  if (!APPLE_ID || !APPLE_ID_PASSWORD) {
    console.error('APPLE_ID and APPLE_ID_PASSWORD env vars required to notarize. Skipping.')
    return
  }

  const appOutDir = context.appOutDir
  const appName = context.packager.appInfo.productFilename
  const path = `${appOutDir}/${appName}.app`

  await notarize({
    appBundleId: 'app.parys.wallet',
    appPath: path,
    appleId: APPLE_ID,
    appleIdPassword: APPLE_ID_PASSWORD,
  })
}

exports.default = notarizeApp
