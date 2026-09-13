/**
 * Verifica se a loja está aberta, a partir da configuração de HORARIOS.
 * Suporta turnos que cruzam a meia-noite (ex.: 22:00–00:30), comparando
 * o turno também contra o dia anterior.
 */

import { HORARIOS } from '../data/config.js';

function paraMinutos(horaMinuto) {
  const [horas, minutos] = horaMinuto.split(':').map(Number);
  return horas * 60 + minutos;
}

function turnoAtivoEm(turno, minutosNoDia) {
  const abre = paraMinutos(turno.abre);
  const fecha = paraMinutos(turno.fecha);
  if (fecha > abre) {
    // Turno comum, dentro do mesmo dia.
    return minutosNoDia >= abre && minutosNoDia < fecha;
  }
  // Turno que cruza a meia-noite (ex.: 22:00–00:30).
  return minutosNoDia >= abre || minutosNoDia < fecha;
}

/**
 * @param {Date} [data]
 * @returns {boolean}
 */
export function estaAberto(data = new Date()) {
  const diaAtual = data.getDay();
  const diaAnterior = (diaAtual + 6) % 7;
  const minutosNoDia = data.getHours() * 60 + data.getMinutes();

  const turnosHoje = HORARIOS[diaAtual] ?? [];
  if (turnosHoje.some((turno) => turnoAtivoEm(turno, minutosNoDia))) {
    return true;
  }

  // Um turno do dia anterior que cruza a meia-noite pode continuar ativo agora.
  const turnosOntem = HORARIOS[diaAnterior] ?? [];
  return turnosOntem.some((turno) => {
    const fecha = paraMinutos(turno.fecha);
    const abre = paraMinutos(turno.abre);
    return fecha <= abre && minutosNoDia < fecha;
  });
}

/**
 * Descreve o próximo horário de abertura, para exibir quando a loja está fechada.
 * @param {Date} [data]
 * @returns {string | null} ex.: "Abrimos sexta às 18:00", ou null se não há horário cadastrado
 */
export function proximaAbertura(data = new Date()) {
  const nomesDias = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  for (let deslocamento = 0; deslocamento < 7; deslocamento += 1) {
    const dia = (data.getDay() + deslocamento) % 7;
    const turnos = HORARIOS[dia] ?? [];
    if (turnos.length === 0) continue;

    const turnoOrdenado = [...turnos].sort((a, b) => paraMinutos(a.abre) - paraMinutos(b.abre))[0];
    if (deslocamento === 0) {
      const minutosNoDia = data.getHours() * 60 + data.getMinutes();
      if (paraMinutos(turnoOrdenado.abre) <= minutosNoDia) continue; // já passou hoje
      return `Abrimos hoje às ${turnoOrdenado.abre}`;
    }
    const prefixo = deslocamento === 1 ? 'amanhã' : nomesDias[dia];
    return `Abrimos ${prefixo} às ${turnoOrdenado.abre}`;
  }
  return null;
}
