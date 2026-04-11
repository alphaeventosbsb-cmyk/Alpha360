import React from 'react';
import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';

export default function NdaPage() {
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
            <h1 className="text-3xl font-black text-slate-900 mb-4">Acordo de Confidencialidade (NDA)</h1>
            <p className="text-slate-500">Alpha360 - Grupo Alpha</p>
          </div>

          <div className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-headings:font-bold prose-a:text-[#192c4d] hover:prose-a:text-[#192c4d]/80 prose-p:text-slate-600 prose-li:text-slate-600">
            <h3>1. Partes</h3>
            <p>
              Este Acordo de Confidencialidade é celebrado entre:
            </p>
            <ul>
              <li><strong>Alpha360</strong>, integrante do Grupo Alpha, inscrito no CNPJ nº <strong>15.261.810/0001-79</strong>, doravante denominado <strong>“Parte Reveladora”</strong>, e</li>
              <li><strong>Cliente/Usuário</strong>, pessoa física ou jurídica que acessa ou utiliza a plataforma, doravante denominado <strong>“Parte Receptora”</strong>.</li>
            </ul>

            <h3>2. Objeto</h3>
            <p>
              O presente acordo tem como objetivo proteger todas as informações confidenciais compartilhadas entre as partes, especialmente no uso da plataforma Alpha360.
            </p>

            <h3>3. Definição de Informação Confidencial</h3>
            <p>Considera-se Informação Confidencial toda informação, incluindo, mas não se limitando a:</p>
            <ul>
              <li>Dados operacionais de segurança</li>
              <li>Escalas de vigilantes</li>
              <li>Estratégias de atuação</li>
              <li>Informações de clientes finais</li>
              <li>Dados financeiros</li>
              <li>Estrutura do sistema e tecnologia</li>
            </ul>

            <h3>4. Obrigações da Parte Receptora</h3>
            <p>A Parte Receptora se compromete a:</p>
            <ul>
              <li>Manter absoluto sigilo sobre todas as informações</li>
              <li>Não divulgar, compartilhar ou expor dados a terceiros</li>
              <li>Utilizar as informações exclusivamente para uso da plataforma</li>
              <li>Proteger os dados com o mesmo nível de cuidado que utiliza para seus próprios dados sensíveis</li>
            </ul>

            <h3>5. Restrições</h3>
            <p>É proibido:</p>
            <ul>
              <li>Copiar ou reproduzir informações confidenciais</li>
              <li>Utilizar dados para benefício próprio fora da plataforma</li>
              <li>Realizar engenharia reversa no sistema Alpha360</li>
            </ul>

            <h3>6. Exceções</h3>
            <p>Não serão consideradas confidenciais informações que:</p>
            <ul>
              <li>Já sejam públicas sem violação deste acordo</li>
              <li>Sejam exigidas por lei ou autoridade competente</li>
            </ul>

            <h3>7. Prazo</h3>
            <p>Este acordo permanece válido:</p>
            <ul>
              <li>Durante o uso da plataforma</li>
              <li>E por até <strong>5 anos após o encerramento da relação</strong></li>
            </ul>

            <h3>8. Penalidades</h3>
            <p>O descumprimento deste acordo poderá resultar em:</p>
            <ul>
              <li>Cancelamento imediato da conta</li>
              <li>Responsabilização civil e criminal</li>
              <li>Indenização por perdas e danos</li>
            </ul>

            <h3>9. Proteção de Dados</h3>
            <p>
              As partes concordam em cumprir a legislação vigente de proteção de dados, incluindo a <strong>LGPD (Lei nº 13.709/2018)</strong>.
            </p>

            <h3>10. Foro</h3>
            <p>
              Fica eleito o foro da comarca do domicílio da Alpha360 para dirimir quaisquer controvérsias.
            </p>

            <h3>11. Aceite</h3>
            <p>
              O uso da plataforma implica na aceitação deste acordo.
            </p>

            <hr className="my-8 border-slate-200" />
            
            <div className="text-sm text-slate-500 bg-slate-50 p-6 rounded-2xl">
              <strong>Alpha360 – Grupo Alpha</strong><br />
              CNPJ: 15.261.810/0001-79<br />
              Desde 2012<br />
              Todos os direitos reservados.
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
