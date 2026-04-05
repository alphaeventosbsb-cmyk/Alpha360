import React from 'react';
import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';

export default function LicencaPage() {
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
            <h1 className="text-3xl font-black text-slate-900 mb-4">Licenciamento e Propriedade Intelectual (EULA)</h1>
            <p className="text-slate-500">Documento referente aos direitos autorais da plataforma</p>
          </div>

          <div className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-headings:font-bold prose-a:text-[#192c4d] hover:prose-a:text-[#192c4d]/80 prose-p:text-slate-600 prose-li:text-slate-600">
            <h3>Termo de Licenciamento de Software (EULA)</h3>
            <p>
              Ao utilizar a plataforma <strong>Alpha360</strong>, você está submetido aos direitos intelectuais exclusivos resguardados por este termo de licenciamento corporativo. O software não é vendido e sim licenciado como um serviço (SaaS - Software as a Service).
            </p>

            <h3>1. Concessão da Licença</h3>
            <p>
              Sob a condição do aceite no processo de registro, concedemos à você o direito revogável, não exclusivo e não transferível para acessar e utilizar a aplicação em nuvem Alpha360, intrinsecamente amarrado à finalidade das operações de logística providas em seus despachos de segurança.
            </p>

            <h3>2. Limitações de Propriedade</h3>
            <p>
              Este licenciamento dita formalmente que é <strong>expressamente proibido (Direitos Autorais - Lei Federal nº 9.610/98)</strong>:
            </p>
            <ul>
              <li>Executar engenharia reversa no código das páginas, PWA ou Service Workers injetados offline.</li>
              <li>Tentar sublicenciar, revender, alugar, ou emprestar a plataforma configurada para terceiros sob *white-label* não originariamente providenciado pela Alpha360.</li>
              <li>Clonagem do visual corporativo, logo, designs e layouts providos nesta interface para utilização em aplicativos concorrenciais externos.</li>
            </ul>

            <h3>3. Rescisão por Abuso Tecnológico</h3>
            <p>
              Violações diretas de quebras de segurança, contornos em *geofencing* (GPS Mocking) para ludibriar o escopo da plataforma ou sobrecarregar API resultará na interrupção sumária corporativa (desativação de servidor do Company ID sem aviso prévio) até o cessar das irregularidades por parte dos utilizadores envolvidos.
            </p>
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
