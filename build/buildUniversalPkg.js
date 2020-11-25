const { makeUniversalApp } = require('@electron/universal');

const path = '/Users/bruce/Documents/repos/fluent-reader/bin/'

makeUniversalApp({
    x64AppPath: path + '/darwin/x64/mas/Fluent Reader.app',
    arm64AppPath: path + '/darwin/arm64/mas/Fluent Reader.app',
    outAppPath: path + '/Fluent Reader.app',
    force: true
});
