const input = JSON.parse(require('fs').readFileSync(0, 'utf8'))

if (input.stop_hook_active) process.exit(0)

console.log(JSON.stringify({
    decision: 'block',
    reason: 'Revise o que foi feito e confirme se tudo está correto antes de finalizar.'
}))

process.exit(0)