import React from 'react';
import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';

export default function TermosPage() {
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
            <h1 className="text-3xl font-black text-slate-900 mb-4">Termos de Uso</h1>
            <p className="text-slate-500">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>

          <div className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-headings:font-bold prose-a:text-[#192c4d] hover:prose-a:text-[#192c4d]/80 prose-p:text-slate-600 prose-li:text-slate-600">
            <h3>1. Aceitação dos Termos</h3>
            <p>
              Ao acessar e utilizar o sistema <strong>Alpha360</strong>, uma plataforma de gestão e monitoramento logístico/segurança operada sob o modelo Software as a Service (SaaS), você ("Usuário") concorda expressamente em cumprir estes Termos de Uso. É fundamental e mandatório o aceite deste termo no ato de registro de conta. O não aceite implica na incapacidade de provimento de nossos serviços.
            </p>

            <h3>2. Descrição do SaaS (Software as a Service)</h3>
            <p>
              O Alpha360 fornece infraestrutura tecnológica online, composta por sistema de geolocalização, monitoramento operacional de agentes de segurança (postos, checkout, checkin, sos) e despacho corporativo. Todas as atualizações, novos recursos técnicos e aprimoramentos ficarão submetidos a estes mesmos Termos.
            </p>

            <h3>3. Contas de Usuário e Segurança</h3>
            <ul>
              <li><strong>Informações:</strong> O usuário deve possuir dados verídicos, lícitos e manter as credenciais devidamente atualizadas.</li>
              <li><strong>Confidencialidade:</strong> É sua responsabilidade manter a confidencialidade de sua senha corporativa, sendo o único responsabilizado por atividades conduzidas através da sua conta.</li>
              <li><strong>Uso Indevido:</strong> Restringimos a concessão de contas, é vedado usar nossa API para fins de exploração comercial externa não englobada pelos pacotes "Client" ou "Admin".</li>
            </ul>

            <h3>4. Nível de Serviço (SLA) e Disponibilidade Operacional</h3>
            <p>
              O Alpha360 atua para garantir alta disponibilidade dos servidores e comunicação de aplicativos em campo. Manutenções programadas serão informadas, todavia, a proveniência dos sinais de internet (3G/4G/GPS) em campo dependem puramente das provedoras de telefonia locais adotadas pelo usuário de ponta, não tendo a provedora do software Alpha360 dolo sobre quedas em áreas de sombra.
            </p>

            <h3>5. Responsabilidade e Isenções</h3>
            <p>
              A operação física do agente logístico em campo e contratos regidos pela empresa contratante não é responsabilidade da plataforma Alpha360. Nós exercemos o papel de provedor da tecnologia em nuvem, licenciador do web-app e hospedagem sistêmica.
            </p>

            <h3>6. Propriedade Intelectual</h3>
            <p>
              A engenharia de software contida na plataforma (frontend, backend, design UI/UX, fluxos operacionais, banco de dados e algoritmos) é propriedade única, inalienável e não transmissível do desenvolvedor de software de detentoria Alpha360, protegidos pelas leis federais e internacionais.
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
