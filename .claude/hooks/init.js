const { execSync } = require('child_process')

const dia = new Date().toLocaleString('pt-BR')

let branch = 'desconhecido'
let commit = 'sem commits'

try {
    branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim()
    commit = execSync('git log -1 --pretty=format:"%h %s"').toString().trim()
} catch (err) {
    console.error('init hook: falha ao ler estado do git:', err.message)
}

const context = `Sessão iniciada em: ${dia}\nBranch: ${branch}\nÚltimo commit: ${commit}`

console.log(JSON.stringify({
    hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: context
    }
}))