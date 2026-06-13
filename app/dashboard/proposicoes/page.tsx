"use client";
import { useEffect, useState } from "react";

type Vereador = { id: string; nome: string; partido: string; poder: string; cargo?: string };
type Comissao = { id: string; nome: string; sigla?: string };
type Proposicao = {
  id: string; numero: string; ano: number; tipo: string; ementa: string;
  origemTipo: string; autorVereador?: Vereador; autorExterno?: string;
  dataEntrada: string; status: string;
  dispensaParecer: boolean; dispensaIntersticio: boolean;
  regimeUrgencia: boolean; numVotacoes: number; etapaAtual: string;
  comissoes: { comissao: Comissao; ordem: number }[];
};

const tipoLabel: Record<string, string> = {
  pl: "PL", resolucao: "Resolução", requerimento: "Requerimento", mocao: "Moção",
};
const statusLabel: Record<string, string> = {
  em_tramitacao: "Em tramitação", aprovada: "Aprovada", rejeitada: "Rejeitada", arquivada: "Arquivada",
};
const statusColor: Record<string, string> = {
  em_tramitacao: "bg-yellow-100 text-yellow-800",
  aprovada: "bg-green-100 text-green-800",
  rejeitada: "bg-red-100 text-red-800",
  arquivada: "bg-gray-100 text-gray-800",
};

const emptyForm = {
  numero: "", ano: new Date().getFullYear(), tipo: "pl", ementa: "",
  origemTipo: "vereador", autorVereadorId: "", autorExterno: "",
  dataEntrada: new Date().toISOString().slice(0, 10),
  dispensaParecer: false, dispensaIntersticio: false, regimeUrgencia: false,
  numVotacoes: 1,
  comissoes: [] as { comissaoId: string; ordem: number }[],
};

type Etapa = { key: string; label: string };

function buildEtapas(p: Proposicao): Etapa[] {
  const etapas: Etapa[] = [
    { key: "protocolado", label: "Protocolado" },
    { key: "pautado", label: "Pautado" },
  ];
  if (p.comissoes.length >= 1) etapas.push({ key: "comissao1", label: p.comissoes[0]?.comissao?.sigla || "Comissão 1" });
  if (p.comissoes.length >= 2) etapas.push({ key: "comissao2", label: p.comissoes[1]?.comissao?.sigla || "Comissão 2" });
  if (p.comissoes.length >= 3) etapas.push({ key: "comissao3", label: p.comissoes[2]?.comissao?.sigla || "Comissão 3" });
  if (p.dispensaParecer) etapas.push({ key: "disp_parecer", label: "Disp. Parecer" });
  if (p.dispensaIntersticio) etapas.push({ key: "disp_intersticio", label: "Disp. Interstício" });
  etapas.push({ key: "primeira_votacao", label: "1ª Votação" });
  if (p.numVotacoes >= 2) etapas.push({ key: "segunda_votacao", label: "2ª Votação" });
  return etapas;
}

function Stepper({ p, onAvancar }: { p: Proposicao; onAvancar: (key: string) => void }) {
  const etapas = buildEtapas(p);
  const idx = etapas.findIndex(e => e.key === p.etapaAtual);

  return (
    <div className="flex items-end gap-1 flex-wrap mt-4 pt-4 border-t border-gray-100">
      {etapas.map((e, i) => {
        const concluida = i < idx;
        const atual = i === idx;
        return (
          <button
            key={e.key}
            onClick={() => onAvancar(e.key)}
            title={`Marcar como: ${e.label}`}
            className="flex flex-col items-center gap-1 group"
            style={{ minWidth: 64 }}
          >
            <div
              className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold transition-all"
              style={{
                background: concluida ? "#8B0000" : atual ? "#d4a017" : "#e5e7eb",
                color: concluida || atual ? "#fff" : "#9ca3af",
                boxShadow: atual ? "0 0 0 3px #d4a01740" : "none",
              }}
            >
              {concluida ? "✓" : i + 1}
            </div>
            <span
              className="text-center leading-tight"
              style={{
                fontSize: 10,
                color: concluida ? "#8B0000" : atual ? "#92400e" : "#9ca3af",
                fontWeight: atual ? 600 : 400,
                maxWidth: 64,
              }}
            >
              {e.label}
            </span>
            {i < etapas.length - 1 && (
              <div style={{ position: "absolute", display: "none" }} />
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function ProposicoesPage() {
  const [lista, setLista] = useState<Proposicao[]>([]);
  const [vereadores, setVereadores] = useState<Vereador[]>([]);
  const [executivo, setExecutivo] = useState<Vereador[]>([]);
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");

  async function carregar() {
    const params = new URLSearchParams();
    if (filtroTipo) params.set("tipo", filtroTipo);
    if (filtroStatus) params.set("status", filtroStatus);
    const [p, v, c] = await Promise.all([
      fetch(`/api/proposicoes?${params}`).then(r => r.json()),
      fetch("/api/vereadores").then(r => r.json()),
      fetch("/api/comissoes").then(r => r.json()),
    ]);
    setLista(p);
    setVereadores(v.filter((vr: any) => vr.ativo && vr.poder === "legislativo"));
    setExecutivo(v.filter((vr: any) => vr.ativo && vr.poder === "executivo"));
    setComissoes(c.filter((c: any) => c.ativa));
  }

  useEffect(() => { carregar(); }, [filtroTipo, filtroStatus]);

  function setComissaoOrdem(idx: number, comissaoId: string) {
    const novas = [...form.comissoes];
    novas[idx] = { comissaoId, ordem: idx + 1 };
    setForm({ ...form, comissoes: novas });
  }

  function addComissao() {
    if (form.comissoes.length < 3) {
      setForm({ ...form, comissoes: [...form.comissoes, { comissaoId: "", ordem: form.comissoes.length + 1 }] });
    }
  }

  function removeComissao(idx: number) {
    const novas = form.comissoes.filter((_, i) => i !== idx).map((c, i) => ({ ...c, ordem: i + 1 }));
    setForm({ ...form, comissoes: novas });
  }

  async function salvar() {
    await fetch("/api/proposicoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, comissoes: form.comissoes.filter(c => c.comissaoId) }),
    });
    setModal(false);
    setForm(emptyForm);
    carregar();
  }

  async function avancarEtapa(id: string, etapaAtual: string) {
    await fetch(`/api/proposicoes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ etapaAtual }),
    });
    carregar();
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Proposições</h1>
          <p className="text-gray-500 text-sm">{lista.length} registros</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          + Nova Proposição
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-5">
        <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">Todos os tipos</option>
          {Object.entries(tipoLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">Todos os status</option>
          {Object.entries(statusLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Cards */}
      <div className="space-y-4">
        {lista.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-400">Nenhuma proposição encontrada.</div>
        )}
        {lista.map((p) => (
          <div key={p.id} className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-bold text-gray-800">{tipoLabel[p.tipo]} {p.numero}/{p.ano}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[p.status]}`}>
                    {statusLabel[p.status]}
                  </span>
                  {p.regimeUrgencia && <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">Urgência</span>}
                  <span className="text-xs text-gray-400">{new Date(p.dataEntrada).toLocaleDateString("pt-BR")}</span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 mb-1">{p.ementa}</p>
                <p className="text-xs text-gray-400">
                  Autor: <span className="text-gray-600 font-medium">
                    {p.origemTipo === "vereador" ? (p.autorVereador?.nome || "—") : (p.autorExterno || "Executivo")}
                  </span>
                  {p.comissoes.length > 0 && (
                    <span className="ml-3">
                      Comissões: <span className="text-gray-600">{p.comissoes.map(c => c.comissao.sigla || c.comissao.nome).join(" → ")}</span>
                    </span>
                  )}
                </p>
              </div>
            </div>

            <Stepper p={p} onAvancar={(key) => avancarEtapa(p.id, key)} />
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="font-bold text-lg text-gray-800 mb-4">Nova Proposição</h2>
            <div className="grid grid-cols-2 gap-4">

              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {Object.entries(tipoLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>

              {/* Número e Ano */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                  <input value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
                  <input type="number" value={form.ano} onChange={(e) => setForm({ ...form, ano: +e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>

              {/* Ementa */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ementa</label>
                <textarea value={form.ementa} onChange={(e) => setForm({ ...form, ementa: e.target.value })} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>

              {/* Origem + Autor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Origem</label>
                <select value={form.origemTipo} onChange={(e) => setForm({ ...form, origemTipo: e.target.value, autorVereadorId: "", autorExterno: "" })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="vereador">Vereador</option>
                  <option value="executivo">Executivo Municipal</option>
                </select>
              </div>
              <div>
                {form.origemTipo === "vereador" ? (
                  <>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Autor (Vereador)</label>
                    <select value={form.autorVereadorId} onChange={(e) => setForm({ ...form, autorVereadorId: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                      <option value="">Selecione...</option>
                      {vereadores.map((v) => <option key={v.id} value={v.id}>{v.nome}</option>)}
                    </select>
                  </>
                ) : (
                  <>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Autor (Executivo)</label>
                    {executivo.length > 0 ? (
                      <select value={form.autorExterno} onChange={(e) => setForm({ ...form, autorExterno: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                        <option value="">Selecione...</option>
                        {executivo.map(e => <option key={e.id} value={e.nome}>{e.nome} ({e.cargo === "prefeito" ? "Prefeito" : "Vice-Prefeito"})</option>)}
                      </select>
                    ) : (
                      <input value={form.autorExterno} onChange={(e) => setForm({ ...form, autorExterno: e.target.value })} placeholder="Ex: Prefeitura Municipal" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                    )}
                  </>
                )}
              </div>

              {/* Data */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Entrada</label>
                <input type="date" value={form.dataEntrada} onChange={(e) => setForm({ ...form, dataEntrada: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>

              {/* Votações */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Votações</label>
                <div className="flex gap-3 pt-1">
                  {[1, 2].map(n => (
                    <label key={n} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                      <input type="radio" name="numVotacoes" value={n} checked={form.numVotacoes === n} onChange={() => setForm({ ...form, numVotacoes: n })} />
                      {n === 1 ? "1 votação" : "2 votações"}
                    </label>
                  ))}
                </div>
              </div>

              {/* Etapas do fluxo */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Etapas do fluxo</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={form.regimeUrgencia} onChange={(e) => setForm({ ...form, regimeUrgencia: e.target.checked })} />
                    Regime de urgência
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={form.dispensaParecer} onChange={(e) => setForm({ ...form, dispensaParecer: e.target.checked, comissoes: e.target.checked ? [] : form.comissoes })} />
                    Dispensa de parecer
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={form.dispensaIntersticio} onChange={(e) => setForm({ ...form, dispensaIntersticio: e.target.checked })} />
                    Dispensa de interstício
                  </label>
                </div>
              </div>

              {/* Comissões */}
              {!form.dispensaParecer && (
                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Comissões (até 3)</label>
                    {form.comissoes.length < 3 && (
                      <button onClick={addComissao} className="text-blue-600 text-xs hover:underline">+ Adicionar comissão</button>
                    )}
                  </div>
                  {form.comissoes.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-gray-500 w-4">{i + 1}ª</span>
                      <select value={c.comissaoId} onChange={(e) => setComissaoOrdem(i, e.target.value)} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm">
                        <option value="">Selecione...</option>
                        {comissoes.map((cm) => <option key={cm.id} value={cm.id}>{cm.sigla ? `${cm.sigla} — ` : ""}{cm.nome}</option>)}
                      </select>
                      <button onClick={() => removeComissao(i)} className="text-red-400 hover:text-red-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Preview do fluxo */}
              <div className="col-span-2 bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-medium text-gray-500 mb-3">Prévia do fluxo</p>
                <div className="flex flex-wrap gap-2 items-center">
                  {[
                    { show: true, label: "Protocolado" },
                    { show: true, label: "Pautado" },
                    { show: form.comissoes.length >= 1, label: comissoes.find(c => c.id === form.comissoes[0]?.comissaoId)?.sigla || "Comissão 1" },
                    { show: form.comissoes.length >= 2, label: comissoes.find(c => c.id === form.comissoes[1]?.comissaoId)?.sigla || "Comissão 2" },
                    { show: form.comissoes.length >= 3, label: comissoes.find(c => c.id === form.comissoes[2]?.comissaoId)?.sigla || "Comissão 3" },
                    { show: form.dispensaParecer, label: "Disp. Parecer" },
                    { show: form.dispensaIntersticio, label: "Disp. Interstício" },
                    { show: true, label: "1ª Votação" },
                    { show: form.numVotacoes >= 2, label: "2ª Votação" },
                  ].filter(e => e.show).map((e, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <div className="flex flex-col items-center gap-0.5">
                        <div className="w-7 h-7 rounded text-xs font-bold flex items-center justify-center text-white" style={{ background: i === 0 ? "#d4a017" : "#d1d5db", color: i === 0 ? "#fff" : "#6b7280" }}>{i + 1}</div>
                        <span className="text-center text-gray-500" style={{ fontSize: 9, maxWidth: 56 }}>{e.label}</span>
                      </div>
                      {i < 8 && <div className="w-3 h-px bg-gray-300 mb-4" />}
                    </div>
                  ))}
                </div>
              </div>

            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setModal(false)} className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50">Cancelar</button>
              <button onClick={salvar} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700">Cadastrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
