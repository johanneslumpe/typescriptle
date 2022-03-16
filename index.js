#!/usr/bin/env node

const { readFileSync, writeFileSync, copyFileSync } = require('fs')

const regex = /(\[.+?\])/s
const nWords = regex.exec(readFileSync('wordlist.d.ts', 'utf-8'))[1].split(',').length

writeFileSync('config.d.ts', readFileSync('templates/config.d.ts', 'utf-8').replace(/\d+/, `${Math.floor(Math.random() * nWords)}`))
copyFileSync('templates/index.d.ts', 'index.d.ts')
