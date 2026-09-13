/**
 * Cálculo de frete por distância.
 *
 * A distância é sempre em linha reta (fórmula de Haversine), uma
 * aproximação — não é a rota real de entrega. É suficiente para resolver
 * a faixa de preço e deve ser comunicada ao cliente como aproximada.
 */

import { FAIXAS_FRETE, BAIRROS, LOJA } from '../data/config.js';

const RAIO_TERRA_KM = 6371;

/**
 * Distância em linha reta entre duas coordenadas, em km.
 * @param {{lat: number, lng: number}} origem
 * @param {{lat: number, lng: number}} destino
 * @returns {number}
 */
export function calcularDistanciaKm(origem, destino) {
  const paraRad = (graus) => (graus * Math.PI) / 180;
  const dLat = paraRad(destino.lat - origem.lat);
  const dLng = paraRad(destino.lng - origem.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(paraRad(origem.lat)) * Math.cos(paraRad(destino.lat)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return RAIO_TERRA_KM * c;
}

/**
 * Resolve a faixa de frete para uma distância.
 * @param {number} km
 * @returns {{ foraDeArea: true } | { foraDeArea: false, valor: number, km: number }}
 */
export function resolverFrete(km) {
  const faixa = FAIXAS_FRETE.find((f) => km <= f.ateKm);
  if (!faixa) return { foraDeArea: true };
  return { foraDeArea: false, valor: faixa.valor * 100, km };
}

/**
 * Resolve o frete a partir de um bairro cadastrado.
 * @param {string} nomeBairro
 * @returns {({ foraDeArea: true } | { foraDeArea: false, valor: number, km: number }) & { bairro?: string }}
 */
export function resolverFretePorBairro(nomeBairro) {
  const bairro = BAIRROS.find((b) => b.nome === nomeBairro);
  if (!bairro) return { foraDeArea: true };
  return { ...resolverFrete(bairro.km), bairro: bairro.nome };
}

/**
 * Encontra, entre os bairros cadastrados, o que tem o km mais parecido com a
 * distância real calculada por GPS — usado para sugerir um bairro depois da
 * geolocalização (os bairros não têm coordenadas próprias, só um km aproximado).
 * @param {number} kmReal distância real (Haversine) entre a loja e o cliente
 * @returns {{ bairro: string } | null}
 */
export function bairroMaisProximo(kmReal) {
  if (BAIRROS.length === 0) return null;
  let maisProximo = BAIRROS[0];
  let menorDiferenca = Math.abs(BAIRROS[0].km - kmReal);
  for (const candidato of BAIRROS) {
    const diferenca = Math.abs(candidato.km - kmReal);
    if (diferenca < menorDiferenca) {
      menorDiferenca = diferenca;
      maisProximo = candidato;
    }
  }
  return { bairro: maisProximo.nome };
}

/**
 * Obtém a localização atual do navegador e calcula a distância até a loja.
 * Rejeita com uma mensagem amigável em português em qualquer cenário de falha
 * (permissão negada, indisponível, contexto inseguro sem HTTPS) para que a UI
 * possa cair no select de bairro sem erro no console.
 * @returns {Promise<{ km: number, bairroSugerido: string | null }>}
 */
export function obterFretePorLocalizacao() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Seu navegador não oferece localização automática.'));
      return;
    }
    if (!window.isSecureContext) {
      reject(new Error('A localização automática só funciona em conexão segura (https).'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (posicao) => {
        const destino = { lat: posicao.coords.latitude, lng: posicao.coords.longitude };
        const km = calcularDistanciaKm(LOJA.coordenadas, destino);
        const sugestao = bairroMaisProximo(km);
        resolve({ km, bairroSugerido: sugestao ? sugestao.bairro : null });
      },
      () => {
        reject(new Error('Não foi possível obter sua localização. Escolha o bairro na lista.'));
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 }
    );
  });
}
