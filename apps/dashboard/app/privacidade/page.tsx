import React from 'react';
import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-[#f6f7f8] flex flex-col font-sans selection:bg-[#192c4d] selection:text-white">
      {/* Header */}
      <header className="bg-[#192c4d] text-white py-6">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-white/10 rounded-xl flex items-center justify-center">
              <Shield className="size-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Alpha360</h1>
          </div>
          <Link href="/" className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">
            <ArrowLeft className="size-4" /> Voltar ao Início
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 md:p-12">
          <div className="mb-10 border-b border-slate-100 pb-8">
            <h1 className="text-3xl font-black text-slate-900 mb-4">Política de Privacidade e LGPD</h1>
            <p className="text-slate-500">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>

          <div className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-headings:font-bold prose-a:text-[#192c4d] hover:prose-a:text-[#192c4d]/80 prose-p:text-slate-600 prose-li:text-slate-600">
            <h3>Nossa Promessa e a Lei Geral de Proteção de Dados (LGPD)</h3>
            <p>
              Em obediência à <strong>Lei Geral de Proteção de Dados (Lei Federal nº 13.709/2018)</strong>, a privacidade e segurança operacional de nossos usuários, agentes e diretores é tratada e salvaguardada com uso das mais modernas diretrizes Multi-Tenant em ambiente corporativo.
            </p>

            <h3>1. Coleta de Dados</h3>
            <p>
              Podemos efetuar a coleta de dados de registro pessoal de dois escopos na operação do sistema corporativo:
            </p>
            <ul>
              <li><strong>Dados de Autenticação Cadastro:</strong> E-mail, senhas encriptadas pela Google Firebase e nome civil.</li>
              <li><strong>Dados Operacionais Télemétricos:</strong> Localização de GPS (Lat/Lng), histórico de percurso ativo dos dispositivos autenticados por vigilantes no ambiente despachado e comunicações de chat.</li>
            </ul>

            <h3>2. Proteção em Camada Multi-Tenant</h3>
            <p>
              Operamos via Rules de Segurança do Firebase Firestore. O tráfego e as consultas de informações são compartimentalizados exclusivamente para o locatário detentor dos agentes em campo (seu "Company ID"). Nenhum outro contratante, usuário ou rede concorrente tem permissão arquitetural cibernética para vizualizar as operações fechadas da sua empresa.
            </p>

            <h3>3. Retenção e Compartilhamento</h3>
            <p>
              Sob nenhuma circunstância comercializamos os dados coletados de seu fluxo de trabalho (como horários, geolocalizações e alertas) de seus guardas com terceiros. Eles residem seguros dentro dos clusters Firebase (operados pelo Google) para prover histórico legal e faturamento dos seus serviços aos clientes finais.
            </p>

            <h3>4. Direitos do Titular (LGPD)</h3>
            <p>
              Você retém à qualquer tempo os direitos de: confirmação, edição, bloqueio temporário e eliminação plena dos dados cadastrais através dos relatórios de usuário de nossa central corporativa. O pedido contundente de deleção estruturada removerá irrevogavelmente o acesso corporativo operado.
            </p>

            <div className="bg-slate-50 p-6 rounded-xl mt-8 border border-slate-200">
              <h4 className="text-slate-900 mt-0">Dúvidas sobre Privacidade?</h4>
              <p className="mb-0 text-sm">Contate nosso Data Protection Officer (DPO) através dos canais de suporte providos na contratação formal para solicitação de ofícios operacionais.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 text-center text-sm">
        <p>© 2026 Alpha360. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
