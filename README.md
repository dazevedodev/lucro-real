# Lucro Real

**App para motoristas de Uber, 99 e InDrive verem quanto sobra de verdade em cada corrida**, depois do combustível e do desgaste do carro, e não só o valor bruto que o aplicativo mostra.

![Lucro Real](docs/capa.png)

> Em desenvolvimento. A versão web e o app Android já funcionam; falta o lançamento.

## O que faz

- **Lucro por corrida:** o motorista informa o valor e os quilômetros, e o app desconta combustível e manutenção pelo consumo do carro dele.
- **Na tela do Uber:** no Android, uma bolha flutuante fica por cima do app de corrida. Dá para lançar a corrida ali mesmo, digitando ou por voz, sem trocar de app.
- **Dia e mês:** quanto sobrou de verdade em cada período.
- **Catálogo de carros:** o consumo de cada modelo já vem cadastrado, e o motorista pode ajustar.
- **Venda automática:** a compra aprovada na Kiwify chega por webhook, o acesso é criado na hora e a senha vai por e-mail.

## Como foi feito

- **Web:** Next.js (App Router), TypeScript e Tailwind, com Supabase para banco e login.
- **Android:** Capacitor abre o app web, e a bolha flutuante é um plugin nativo em **Kotlin** que fala direto com a API (`/api/rides`) usando o token do usuário.
- **Uma sessão por conta:** a mesma trava vale na web e na bolha, para o acesso não ser dividido.
- **Contas testadas:** o cálculo do lucro e os totais por dia e mês têm testes com Vitest. O arredondamento garante que combustível, manutenção e lucro sempre somam exatamente o valor recebido.

## Stack

Next.js · TypeScript · Tailwind · Supabase · Capacitor · Kotlin · Resend · Kiwify · Vitest

## Rodando

```bash
npm install
cp .env.local.example .env.local   # preencha com as chaves do seu Supabase
npm run dev
npm test
```

O passo a passo completo (banco, webhook da Kiwify, app Android e o que falta) está em [`docs/DETALHES-TECNICOS.md`](docs/DETALHES-TECNICOS.md).

---

Feito por [Daniel Dazevedo](https://dazevedo.dev) · DAZEVEDO
