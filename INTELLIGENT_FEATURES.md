# Funcionalidades Inteligentes do Arc Planner

## 📌 Sistema de Sugestão de Prioridade de Estudo

### Como funciona:
O sistema analisa automaticamente todas as suas disciplinas e sugere qual você deve estudar com base em **urgência inteligente**.

### Cálculo de Prioridade:
Para cada disciplina, o sistema calcula:
- `remaining_units = total_units - completed_units`
- `remaining_days = deadline - hoje`
- `urgency_score = remaining_units / remaining_days`

A disciplina com maior `urgency_score` é sugerida.

### Motivos da Sugestão:
- **"Prazo próximo e muitas UA restantes"** - Quando urgency_score > 2
- **"Baixo progresso em relação ao prazo"** - Quando progresso < 30%
- **"Prazo muito próximo"** - Quando faltam menos de 7 dias
- **"Disciplina com maior urgência"** - Caso padrão

### Interface:
A sugestão aparece no dashboard como um card destacado com:
- Nome da disciplina sugerida
- Motivo da sugestão
- UAs restantes
- Dias restantes
- Botão para ir direto à disciplina

**IMPORTANTE:** Esta é apenas uma sugestão inteligente. Você pode estudar qualquer disciplina que quiser!

---

## 🔮 Sistema de Simulação Futura

### Como funciona:
O sistema calcula automaticamente sua **produtividade média** baseada no histórico de UAs completadas e prevê quando você terminará seus estudos.

### Cálculo de Produtividade:
```
average_units_per_day = total_units_completed / total_study_days
predicted_days_to_finish = remaining_UA / average_units_per_day
predicted_completion_date = hoje + predicted_days_to_finish
```

### Previsão Atual:
Mostra uma previsão baseada no seu ritmo de estudo atual:
- **Ritmo atual:** X UA/dia
- **Data prevista de conclusão**
- **Aviso:** Se você terminará após o prazo

### Simulações de Ritmo:
O sistema simula 3 cenários diferentes:
1. **1 UA/dia** → conclusão em DD/MM/AAAA
2. **2 UA/dia** → conclusão em DD/MM/AAAA  
3. **3 UA/dia** → conclusão em DD/MM/AAAA

Cada cenário mostra se você conseguirá terminar no prazo (✓ No prazo).

### Interface:
O card de simulação aparece no dashboard mostrando:
- Seu ritmo atual de estudos
- Previsão de conclusão atual
- Aviso se estiver atrasado (⚠)
- 3 simulações com diferentes ritmos
- Indicador visual de quais ritmos permitem terminar no prazo

**IMPORTANTE:** Use essas previsões como orientação para ajustar seu ritmo de estudos, mas lembre-se que são apenas estimativas!

---

## Endpoints da API

### GET /api/dashboard/study-suggestion
Retorna a sugestão de estudo do dia.

**Resposta:**
```json
{
  "suggestion": {
    "discipline_name": "Física Quântica",
    "discipline_id": "uuid",
    "urgency_score": 12.0,
    "reason": "Prazo próximo e muitas UA restantes",
    "remaining_units": 12,
    "remaining_days": 1
  },
  "all_suggestions": [...]
}
```

### GET /api/dashboard/completion-simulation
Retorna simulações de conclusão.

**Resposta:**
```json
{
  "average_productivity": 3.0,
  "current_prediction": {
    "scenario": "Ritmo atual",
    "units_per_day": 3.0,
    "predicted_completion_date": "15/03/2026",
    "days_until_completion": 10,
    "on_track": false
  },
  "scenarios": [
    {
      "scenario": "1 UA/dia",
      "units_per_day": 1.0,
      "predicted_completion_date": "23/03/2026",
      "days_until_completion": 12,
      "on_track": false
    },
    ...
  ],
  "warning": "⚠ Nesse ritmo você terminará após o prazo"
}
```

---

## Filosofia do Design

Estas funcionalidades seguem a filosofia "Digital Monastery" do Arc Planner:
- **Sugestões, não ordens:** O sistema sugere, você decide
- **Minimalismo visual:** Informação clara sem ruído
- **Foco no progresso:** Dados objetivos para decisões conscientes
- **Sem gamificação excessiva:** Sem confete ou celebrações exageradas
- **Estímulo consciente:** Avisos claros quando necessário, mas sem ansiedade

As cores e ícones foram escolhidos para serem informativos mas discretos, mantendo o foco no que importa: seu progresso nos estudos.
