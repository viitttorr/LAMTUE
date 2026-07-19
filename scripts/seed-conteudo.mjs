/**
 * Conteúdo inicial: banco de questões básico (permite simulados sem chave de IA)
 * e um caso clínico de exemplo. Rode com: node scripts/seed-conteudo.mjs
 * Pode rodar mais de uma vez sem duplicar.
 */
import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.join(process.cwd(), "data", "lamtue.db"));

const QUESTOES = [
  {
    tema: "ABCDE do Trauma", dificuldade: "facil",
    enunciado: "Na avaliação primária do politraumatizado, qual é a sequência correta preconizada pelo ATLS?",
    alternativas: [
      "Via aérea com proteção cervical, ventilação, circulação, avaliação neurológica, exposição",
      "Circulação, via aérea, ventilação, exposição, avaliação neurológica",
      "Avaliação neurológica, via aérea, circulação, ventilação, exposição",
      "Exposição, circulação, ventilação, via aérea, avaliação neurológica",
    ],
    correta: 0,
    comentario: "O ABCDE do ATLS segue: A (Airway com controle cervical), B (Breathing), C (Circulation), D (Disability) e E (Exposure). A via aérea é sempre a prioridade, pois sua obstrução mata mais rápido.",
  },
  {
    tema: "ABCDE do Trauma", dificuldade: "media",
    enunciado: "Durante o 'C' da avaliação primária, qual é o principal objetivo?",
    alternativas: [
      "Identificar e controlar hemorragias, avaliando perfusão e acesso venoso",
      "Realizar tomografia de corpo inteiro",
      "Aferir pressão arterial de 15 em 15 minutos",
      "Instalar sonda vesical em todos os pacientes",
    ],
    correta: 0,
    comentario: "No C (Circulation), busca-se reconhecer choque e controlar hemorragias — compressão direta, acessos calibrosos, reposição volêmica criteriosa e identificação de sangramentos internos.",
  },
  {
    tema: "Suporte Básico de Vida", dificuldade: "facil",
    enunciado: "Qual a relação compressão:ventilação recomendada na RCP de adulto com um socorrista?",
    alternativas: ["30:2", "15:2", "5:1", "10:2"],
    correta: 0,
    comentario: "Nas diretrizes da AHA, a relação para adultos é 30 compressões para 2 ventilações, com compressões de 5–6 cm de profundidade e frequência de 100–120/min.",
  },
  {
    tema: "Parada Cardiorrespiratória", dificuldade: "media",
    enunciado: "Quais são os dois ritmos de parada considerados chocáveis?",
    alternativas: [
      "Fibrilação ventricular e taquicardia ventricular sem pulso",
      "Assistolia e atividade elétrica sem pulso",
      "Fibrilação atrial e flutter atrial",
      "Bradicardia sinusal e bloqueio AV total",
    ],
    correta: 0,
    comentario: "FV e TV sem pulso são tratadas com desfibrilação precoce. Assistolia e AESP não são chocáveis: o tratamento é RCP de alta qualidade e adrenalina, com busca das causas reversíveis (5H e 5T).",
  },
  {
    tema: "Choque", dificuldade: "media",
    enunciado: "Qual é o tipo de choque mais comum no trauma?",
    alternativas: ["Hipovolêmico hemorrágico", "Cardiogênico", "Neurogênico", "Séptico"],
    correta: 0,
    comentario: "Até prova em contrário, choque no trauma é hemorrágico. A conduta inicial é controle do sangramento e reposição volêmica; hipotensão permissiva pode ser considerada até o controle definitivo.",
  },
  {
    tema: "Hemorragia", dificuldade: "facil",
    enunciado: "Qual é a primeira medida para controle de hemorragia externa em extremidade?",
    alternativas: [
      "Compressão direta sobre o ferimento",
      "Torniquete imediato em qualquer sangramento",
      "Clampeamento cego do vaso",
      "Elevação do membro apenas",
    ],
    correta: 0,
    comentario: "A compressão direta é a primeira medida. O torniquete é indicado quando a compressão falha ou em sangramento exsanguinante de extremidade, anotando o horário de aplicação.",
  },
  {
    tema: "Traumatismo Cranioencefálico", dificuldade: "media",
    enunciado: "Paciente abre os olhos à dor, emite sons incompreensíveis e localiza a dor. Qual a pontuação na Escala de Coma de Glasgow?",
    alternativas: ["9", "7", "11", "13"],
    correta: 0,
    comentario: "Abertura ocular à dor = 2; resposta verbal com sons incompreensíveis = 2; melhor resposta motora localizando dor = 5. Total = 9, caracterizando TCE moderado (9–12).",
  },
  {
    tema: "Trauma Torácico", dificuldade: "dificil",
    enunciado: "Vítima de trauma torácico com desvio de traqueia, turgência jugular, ausência de murmúrio à direita e hipotensão. Qual a conduta imediata?",
    alternativas: [
      "Descompressão torácica imediata com agulha ou toracostomia digital",
      "Aguardar radiografia de tórax para confirmar o diagnóstico",
      "Intubação orotraqueal e ventilação com pressão positiva",
      "Pericardiocentese",
    ],
    correta: 0,
    comentario: "O quadro é de pneumotórax hipertensivo — diagnóstico clínico, sem aguardar imagem. Descompressão imediata (agulha no 4º–5º EIC linha axilar média ou toracostomia digital), seguida de dreno torácico.",
  },
  {
    tema: "Queimaduras", dificuldade: "media",
    enunciado: "Adulto com queimaduras em face anterior do tronco e todo o membro superior direito. Pela regra dos nove, qual a superfície corporal queimada?",
    alternativas: ["27%", "18%", "36%", "13,5%"],
    correta: 0,
    comentario: "Tronco anterior = 18% e membro superior inteiro = 9%, totalizando 27%. A regra dos nove orienta a reposição volêmica (fórmula de Parkland) e o critério de transferência para centro de queimados.",
  },
  {
    tema: "Triagem START", dificuldade: "media",
    enunciado: "No método START, vítima que não deambula, respira 22 irpm, tem enchimento capilar < 2s e obedece comandos recebe qual classificação?",
    alternativas: ["Amarela (atendimento retardado)", "Verde (leve)", "Vermelha (imediata)", "Preta (expectante)"],
    correta: 0,
    comentario: "Não deambula, mas respiração < 30 irpm, perfusão adequada e responde a comandos: classificação amarela. Vermelho exige FR > 30, perfusão ruim ou não obedecer comandos.",
  },
  {
    tema: "Via Aérea e Intubação", dificuldade: "media",
    enunciado: "Qual parâmetro NÃO faz parte da avaliação preditora de via aérea difícil (LEMON)?",
    alternativas: ["Glicemia capilar", "Abertura bucal (regra 3-3-2)", "Mallampati", "Obstrução/Obesidade"],
    correta: 0,
    comentario: "LEMON: Look, Evaluate (3-3-2), Mallampati, Obstruction/Obesity, Neck mobility. Glicemia não participa da avaliação de via aérea difícil.",
  },
  {
    tema: "Acesso Venoso de Emergência", dificuldade: "media",
    enunciado: "Após duas tentativas frustradas de acesso venoso periférico em paciente em PCR, qual a via recomendada?",
    alternativas: ["Intraóssea", "Dissecção venosa de safena", "Acesso venoso central por punção subclávia", "Via sublingual"],
    correta: 0,
    comentario: "Na emergência, a via intraóssea é a alternativa imediata ao acesso periférico difícil — rápida, segura e permite todas as drogas da reanimação.",
  },
];

const insQ = db.prepare(
  "INSERT INTO questoes (tema, dificuldade, enunciado, alternativas, correta, comentario, origem, aprovada) VALUES (?,?,?,?,?,?,'manual',1)"
);
const existeQ = db.prepare("SELECT id FROM questoes WHERE enunciado = ?");
let novas = 0;
for (const q of QUESTOES) {
  if (existeQ.get(q.enunciado)) continue;
  insQ.run(q.tema, q.dificuldade, q.enunciado, JSON.stringify(q.alternativas), q.correta, q.comentario);
  novas++;
}

const CASO = {
  titulo: "Colisão moto × carro: homem de 27 anos na cena",
  tema: "ABCDE do Trauma",
  contexto:
    "Você está de plantão quando o SAMU traz um homem de 27 anos, vítima de colisão moto × carro há 40 minutos. Capacete rachado, rebaixamento leve de consciência (abre os olhos ao chamado), respiração ruidosa, FC 118 bpm, PA 100×60 mmHg, escoriações extensas em hemitórax direito e deformidade em antebraço direito. Colar cervical instalado pela equipe.",
  etapas: [
    {
      pergunta: "Qual é a sua primeira prioridade na avaliação primária?",
      opcoes: [
        { texto: "Avaliar permeabilidade da via aérea mantendo a estabilização cervical", correta: true, feedback: "O A do ABCDE vem primeiro: respiração ruidosa sugere obstrução parcial. A coluna cervical permanece protegida durante toda a manobra." },
        { texto: "Reduzir imediatamente a fratura de antebraço", correta: false, feedback: "Lesões ortopédicas sem sangramento maciço pertencem à avaliação secundária — nunca antes do ABCDE." },
        { texto: "Solicitar tomografia de crânio de urgência", correta: false, feedback: "Imagem só após a avaliação primária e estabilização. Paciente instável não vai ao tomógrafo." },
      ],
    },
    {
      pergunta: "A via aérea foi desobstruída com aspiração. No B, você encontra murmúrio abolido à direita, percussão timpânica e saturação de 88%. Qual a hipótese e conduta?",
      opcoes: [
        { texto: "Pneumotórax — oxigênio e preparo para drenagem torácica", correta: true, feedback: "Murmúrio abolido + timpanismo indicam pneumotórax. Com sinais de tensão, a descompressão é imediata, antes de qualquer exame." },
        { texto: "Hemotórax — puncionar o abdome", correta: false, feedback: "Hemotórax cursa com macicez, não timpanismo — e punção abdominal não trata problema torácico." },
        { texto: "Asma brônquica — beta-agonista inalatório", correta: false, feedback: "Broncoespasmo não explica abolição unilateral do murmúrio em vítima de trauma torácico." },
      ],
    },
    {
      pergunta: "No C, o paciente evolui com FC 132 bpm e PA 84×50 mmHg. Qual a conduta mais adequada?",
      opcoes: [
        { texto: "Dois acessos calibrosos, cristaloide aquecido e busca ativa de foco hemorrágico (E-FAST)", correta: true, feedback: "Choque no trauma é hemorrágico até prova em contrário: acesso, volume criterioso e localizar o sangramento (tórax, abdome, pelve, ossos longos, cena)." },
        { texto: "Iniciar noradrenalina como primeira medida", correta: false, feedback: "Vasopressor não substitui volume nem controle do sangramento no choque hemorrágico inicial." },
        { texto: "Aguardar reavaliação em 30 minutos", correta: false, feedback: "Taquicardia com hipotensão é choque instalado — aguardar significa deterioração." },
      ],
    },
  ],
};

const existeC = db.prepare("SELECT id FROM casos WHERE titulo = ?").get(CASO.titulo);
if (!existeC) {
  db.prepare("INSERT INTO casos (titulo, tema, contexto, etapas, visibilidade) VALUES (?,?,?,?,'publico')")
    .run(CASO.titulo, CASO.tema, CASO.contexto, JSON.stringify(CASO.etapas));
  console.log("Caso clínico de exemplo criado.");
}

console.log(`${novas} questão(ões) adicionadas ao banco.`);
