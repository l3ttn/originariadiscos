# scripts/sessao.sh — funções da sessão de verificação do plano v6 (plan/design-v6.md §Roteiro).
# Função e variável não sobrevivem entre chamadas do Bash tool: use `source scripts/sessao.sh && <comando>` em cada linha.
L=${L:-http://127.0.0.1:8080}
A(){ node scripts/avaliar.mjs "$@"; }   # avalia expressão JS numa página (390x844 por padrão; --tela para a dobra real)
M(){ node scripts/medir.mjs "$@"; }     # LCP/CLS/origens/bytes no perfil Slow 4G + CPU 4x (--rolar: rolagem completa)
LS='--ls={"originaria.carrinho.v1":"{\"itens\":[{\"id\":726944,\"qtd\":1}],\"obs\":\"\"}"}'   # carrinho semeado
servir(){ curl -s -o /dev/null "$L/" || { node scripts/servir.mjs "${L##*:}" >/dev/null 2>&1 & sleep 1; }; }   # sobe o site local se não estiver no ar
