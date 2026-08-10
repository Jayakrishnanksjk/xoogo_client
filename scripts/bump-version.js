import fs from 'fs'
import path from 'path'
import readline from 'readline'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pkgPath = path.resolve(__dirname, '../package.json')
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))

const current = pkg.version || '0.0.0'
const args = process.argv.slice(2)

function bump(type) {
  const [major, minor, patch] = current.split('.').map(n => parseInt(n, 10) || 0)
  switch (type) {
    case 'major': return `${major + 1}.0.0`
    case 'minor': return `${major}.${minor + 1}.0`
    case 'patch': return `${major}.${minor}.${patch + 1}`
    default: return current
  }
}

function setVersion(version) {
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    console.error(`Invalid version: "${version}". Expected format X.Y.Z`)
    process.exit(1)
  }
  pkg.version = version
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
  console.log(`Version updated: ${current} → ${version}`)
  process.exit(0)
}

const flag = args.find(a => ['--major', '--minor', '--patch'].includes(a))
if (flag) {
  setVersion(bump(flag.slice(2)))
} else if (args[0] && /^\d+\.\d+\.\d+$/.test(args[0])) {
  setVersion(args[0])
} else {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  console.log(`Current version: ${current}\n`)
  rl.question('Enter new version (X.Y.Z), or choose patch [p] / minor [m] / major [M]: ', (answer) => {
    const trimmed = answer.trim()
    const ans = trimmed.toLowerCase()
    rl.close()
    if (ans === 'p') setVersion(bump('patch'))
    else if (ans === 'm') setVersion(bump('minor'))
    else if (trimmed === 'M') setVersion(bump('major'))
    else if (/^\d+\.\d+\.\d+$/.test(ans)) setVersion(ans)
    else {
      console.error('No change made. Exiting.')
      process.exit(1)
    }
  })
}
