/**
 * Guards that expo-modules-jsi is installed alongside expo-modules-core.
 * ExpoModulesCore.podspec depends on ExpoModulesJSI (a separate package),
 * but expo-modules-core doesn't declare expo-modules-jsi as an npm peer/dep.
 * Remove this check once expo-modules-core declares the dependency itself.
 */
const fs = require('fs');
const path = require('path');

const jsiPkg = path.join(__dirname, '..', 'node_modules', 'expo-modules-jsi');
const podspec = path.join(jsiPkg, 'apple', 'ExpoModulesJSI.podspec');

if (!fs.existsSync(podspec)) {
  console.error(
    '\n[postinstall] expo-modules-jsi is missing or incomplete.\n' +
    'Run: npm install expo-modules-jsi@~56.0.8\n'
  );
  process.exit(1);
}
