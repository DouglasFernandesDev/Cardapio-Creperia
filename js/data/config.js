/**
 * Configuração central da loja.
 * Este é o único arquivo que precisa ser editado para ajustar dados
 * do negócio (endereço, horários, frete, bairros e formas de pagamento).
 * Nenhuma lógica deve ser alterada aqui — apenas os valores.
 */

export const LOJA = {
  nome: 'Sagrado Creperia',
  slogan: 'O sabor que acolhe, o momento que fica!',
  selo: 'Feito com Amor',
  whatsapp: '5522998712898', // (22) 99871-2898 — número do flyer oficial
  // CONFIRMAR: endereço completo da loja (usado apenas para exibição, não some no cálculo).
  endereco: 'Cabo Frio - RJ',
  // CONFIRMAR: coordenadas exatas da loja. Abaixo está o centro de Cabo Frio-RJ
  // como ponto de partida — ajustar para a localização real do estabelecimento.
  coordenadas: { lat: -22.8894, lng: -42.0286 },
  somenteDelivery: true, // o flyer oficial diz "SOMENTE DELIVERY" — sem retirada no balcão
};

/**
 * Horário de funcionamento por dia da semana (0 = domingo ... 6 = sábado).
 * Cada dia é uma lista de turnos { abre, fecha } em formato 'HH:mm', ou uma
 * lista vazia quando a loja não abre naquele dia. Turnos que cruzam a
 * meia-noite (ex.: 22:00–00:30) são suportados pelo módulo de horário.
 *
 * CONFIRMAR: o flyer informa apenas os dias (sexta, sábado e domingo),
 * sem horário. Os valores abaixo são um placeholder até a loja confirmar.
 */
export const HORARIOS = {
  0: [{ abre: '18:00', fecha: '23:00' }], // domingo
  1: [], // segunda — fechado
  2: [], // terça — fechado
  3: [], // quarta — fechado
  4: [], // quinta — fechado
  5: [{ abre: '18:00', fecha: '23:00' }], // sexta
  6: [{ abre: '18:00', fecha: '23:00' }], // sábado
};

/**
 * Faixas de frete por distância (km), em ordem crescente.
 * `ateKm` é o limite superior (inclusive) da faixa; `valor` é o preço em reais.
 * Distâncias acima da última faixa são consideradas fora da área de entrega.
 *
 * CONFIRMAR: valores de exemplo — ajustar com o preço real cobrado pela loja.
 */
export const FAIXAS_FRETE = [
  { ateKm: 3, valor: 5 },
  { ateKm: 6, valor: 8 },
  { ateKm: 10, valor: 12 },
];

/**
 * Bairros atendidos e distância aproximada (em linha reta, km) até a loja.
 * Usado como alternativa ao GPS: o cliente escolhe o bairro e o app resolve
 * a faixa de frete a partir do km cadastrado aqui.
 *
 * CONFIRMAR: lista de bairros realmente atendidos pela loja em Cabo Frio-RJ.
 */
export const BAIRROS = [
  { nome: 'Centro', km: 1.2 },
  { nome: 'Braga', km: 2.0 },
  { nome: 'Passagem', km: 2.5 },
  { nome: 'Portinho', km: 2.8 },
  { nome: 'Jardim Excelsior', km: 3.0 },
  { nome: 'Vila Nova', km: 3.4 },
  { nome: 'Manoel Corrêa', km: 3.8 },
  { nome: 'Jardim Esperança', km: 4.1 },
  { nome: 'São Cristóvão', km: 4.6 },
  { nome: 'Ogiva', km: 4.9 },
  { nome: 'Palmeiras', km: 5.2 },
  { nome: 'Praia do Siqueira', km: 5.8 },
  { nome: 'Guarani', km: 6.0 },
  { nome: 'Gamboa', km: 6.4 },
  { nome: 'Peró', km: 7.5 },
];

/** Formas de pagamento aceitas. */
export const PAGAMENTOS = ['Pix', 'Cartão na entrega', 'Dinheiro'];
