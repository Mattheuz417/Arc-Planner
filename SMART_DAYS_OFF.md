# Sistema de Folgas Inteligentes - Arc Planner

## 🌴 Visão Geral

O Sistema de Folgas Inteligentes permite que estudantes saibam **exatamente quantos dias de folga podem tirar** sem comprometer seus prazos. O sistema calcula dinamicamente as folgas disponíveis baseado no ritmo de estudo do usuário.

## Como Funciona

### Cálculo de Folgas Disponíveis

O sistema usa a seguinte fórmula:

```
prazo_total = deadline - hoje
predicted_days_to_finish = remaining_UA / units_per_day
folgas_possiveis = prazo_total - predicted_days_to_finish - folgas_usadas
```

**Onde:**
- `prazo_total`: Dias restantes até o prazo final
- `predicted_days_to_finish`: Dias necessários para completar as UAs restantes no ritmo atual
- `units_per_day`: Produtividade média (UAs completadas por dia)
- `folgas_usadas`: Quantidade de folgas já registradas
- `folgas_possiveis`: Dias de folga que podem ser tirados sem atraso

### Regras Importantes

1. **Folgas nunca podem ser negativas**: Se o cálculo resultar em valor negativo, o sistema mostra 0 folgas disponíveis
2. **Folgas aumentam com melhor ritmo**: Quanto mais UAs você completa por dia, mais folgas você ganha
3. **Folgas diminuem com o tempo**: À medida que o prazo se aproxima, as folgas disponíveis podem diminuir
4. **Cada folga usada reduz as disponíveis**: Cada clique em "Tirar folga hoje" subtrai 1 das folgas disponíveis

## Interface do Usuário

### Card de Folgas Inteligentes

Localização: Dashboard (lado direito, junto com as estatísticas)

**Elementos:**
- 🌴 **Título**: "Folgas Inteligentes"
- **Número grande**: Quantidade de folgas disponíveis (em verde)
- **Mensagem**: Descrição contextual
- **Folgas usadas**: Contador de folgas já utilizadas
- **Botão**: "✅ Tirar folga hoje" (habilitado) ou "🚫 Sem folgas disponíveis" (desabilitado)

### Mensagens Contextuais

O sistema mostra diferentes mensagens dependendo da situação:

#### Quando há folgas disponíveis:
```
Você tem [N] dias de folga disponíveis
```

#### Quando não há folgas:
```
Você não tem folgas disponíveis no momento
```

#### Quando ritmo precisa melhorar:
```
Aumente seu ritmo de estudo para ganhar folgas
```

#### Quando não há dados ainda:
```
Complete algumas UAs para calcular suas folgas
```

#### Quando não há disciplinas:
```
Crie disciplinas para começar
```

#### Quando não há prazos:
```
Configure prazos para suas disciplinas
```

## Exemplos Práticos

### Exemplo 1: Estudante Adiantado
```
Disciplina: Python Avançado
Total UAs: 30
Completadas: 20
Restantes: 10
Prazo: 60 dias
Ritmo: 20 UA/dia (completou 20 hoje)

Cálculo:
prazo_total = 60 dias
predicted_days = 10 / 20 = 0.5 dias
folgas_possiveis = 60 - 0.5 - 0 = 59.5 ≈ 59 dias

Resultado: ✅ 59 dias de folga disponíveis!
```

### Exemplo 2: Estudante no Prazo
```
Disciplina: JavaScript
Total UAs: 30
Completadas: 15
Restantes: 15
Prazo: 15 dias
Ritmo: 1 UA/dia

Cálculo:
prazo_total = 15 dias
predicted_days = 15 / 1 = 15 dias
folgas_possiveis = 15 - 15 - 0 = 0 dias

Resultado: 🚫 Sem folgas disponíveis
```

### Exemplo 3: Estudante Atrasado
```
Disciplina: React
Total UAs: 40
Completadas: 10
Restantes: 30
Prazo: 20 dias
Ritmo: 0.5 UA/dia

Cálculo:
prazo_total = 20 dias
predicted_days = 30 / 0.5 = 60 dias
folgas_possiveis = 20 - 60 - 0 = -40 dias → 0 dias (nunca negativo)

Resultado: 🚫 Aumente seu ritmo de estudo para ganhar folgas
```

## Comportamento do Botão

### Quando Habilitado (✅ Tirar folga hoje)
- Aparece em **verde**
- Ao clicar:
  1. Registra a data atual como folga
  2. Incrementa `folgas_usadas`
  3. Atualiza as estatísticas do dashboard
  4. Recalcula folgas disponíveis
  5. Mostra toast de sucesso

### Quando Desabilitado (🚫 Sem folgas disponíveis)
- Aparece em **cinza**
- Não pode ser clicado
- Indica que não há folgas disponíveis no momento
- Usuário deve aumentar ritmo de estudo para ganhar folgas

## Integração com Outras Funcionalidades

### Dashboard Stats
O sistema de folgas inteligentes está integrado ao endpoint `/api/dashboard/stats`:

```json
{
  "total_disciplines": 1,
  "total_units": 30,
  "completed_units": 20,
  "remaining_units": 10,
  "days_off_count": 0,
  "disciplines": [...],
  "smart_days_off": {
    "available_days_off": 59,
    "days_off_used": 0,
    "can_take_day_off": true,
    "message": "Você tem 59 dias de folga disponíveis"
  }
}
```

### Simulação de Conclusão
As folgas inteligentes trabalham em conjunto com a simulação de conclusão para dar uma visão completa ao estudante:
- **Simulação**: Mostra quando você vai terminar no ritmo atual
- **Folgas**: Mostra quantos dias pode descansar sem atraso

## Endpoints da API

### GET /api/dashboard/smart-days-off
Retorna informações sobre folgas inteligentes.

**Headers:**
```
Authorization: Bearer {token}
```

**Resposta 200 OK:**
```json
{
  "available_days_off": 59,
  "days_off_used": 0,
  "can_take_day_off": true,
  "message": "Você tem 59 dias de folga disponíveis"
}
```

**Campos:**
- `available_days_off`: Quantidade de dias de folga disponíveis
- `days_off_used`: Quantidade de folgas já utilizadas
- `can_take_day_off`: Booleano indicando se pode tirar folga
- `message`: Mensagem contextual sobre as folgas

### POST /api/days-off
Registra uma folga (já existente, sem mudanças).

**Body:**
```json
{
  "date": "2026-01-15"
}
```

## Filosofia e Design

### Por que "Inteligente"?
Diferente de um sistema simples de contagem de folgas, este sistema:
1. **Calcula dinamicamente** baseado no desempenho real
2. **Recompensa o bom desempenho** com mais folgas
3. **Previne atrasos** não permitindo folgas quando não há margem
4. **Motiva sem pressionar** mostra oportunidades sem forçar

### Alinhamento com o Design "Digital Monastery"
- **Transparente**: Mostra exatamente como o cálculo funciona
- **Honesto**: Não permite folgas quando não há margem
- **Motivacional sem gamificação**: Recompensa com tempo livre real, não badges
- **Focado no essencial**: Interface minimalista com informação clara
- **Respeitoso**: Não julga se o usuário tira ou não folga

## Benefícios para o Estudante

1. **Reduz ansiedade**: Saber que pode descansar sem culpa
2. **Aumenta motivação**: Estudar mais = mais folgas
3. **Previne burnout**: Incentiva pausas quando possível
4. **Planejamento melhor**: Pode planejar folgas com antecedência
5. **Transparência**: Sabe exatamente onde está em relação ao prazo

## Casos de Uso Reais

### Estudante que estuda nos fins de semana
- Completa muitas UAs no sábado e domingo
- Ganha folgas durante a semana
- Pode descansar segunda e terça sem atraso

### Estudante com compromissos
- Sabe que tem evento familiar em 2 semanas
- Aumenta ritmo agora para ganhar folgas
- Tira folga sem comprometer o prazo

### Estudante em período de provas
- Vê que tem poucas folgas disponíveis
- Decide focar mais durante a semana
- Ganha folgas para descansar depois das provas

## Considerações Técnicas

### Performance
- Cálculo feito em tempo real a cada request
- Não requer cache (cálculo é rápido)
- Considera todas as disciplinas do usuário

### Precisão
- Usa produtividade média real do usuário
- Considera apenas UAs completadas com timestamp
- Atualiza automaticamente quando UAs são completadas

### Edge Cases Tratados
1. Usuário sem disciplinas
2. Disciplinas sem UAs
3. Usuário sem histórico de completude
4. Múltiplas disciplinas com diferentes prazos
5. Folgas já usadas no passado

---

## Exemplo Completo de Workflow

1. **Estudante cria disciplina**: "Cálculo 2" com prazo em 90 dias
2. **Cria trilha e UAs**: 45 UAs no total
3. **Estuda bastante**: Completa 30 UAs em 10 dias (ritmo de 3 UA/dia)
4. **Vê folgas disponíveis**: Sistema calcula: `90 - (15/3) - 0 = 85 dias de folga!`
5. **Tira folga no fim de semana**: Clica em "Tirar folga hoje"
6. **Sistema atualiza**: Agora tem 84 dias disponíveis (usou 1)
7. **Continua estudando**: À medida que completa mais, ganha mais folgas
8. **Monitora progresso**: Vê claramente quanto pode descansar

---

Este sistema transforma a gestão de tempo de estudos em algo transparente, justo e motivador, sempre respeitando a saúde mental do estudante.
