import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import {
  User, Phone, MapPin, FileText, Save, LogOut, Loader2,
  AlertTriangle, CheckCircle2, ChevronRight, UploadCloud, Camera
} from 'lucide-react';

// ==========================================
// OUTSIDE COMPONENTS (PREVENTS FOCUS LOSS)
// ==========================================

const InputField = ({ label, name, type = 'text', required = false, width, flex, form, handleInputChange, profileCompleted, onChangeOverride, ...opts }: any) => (
  <div style={{ flex: flex, width: width || (flex ? undefined : '100%'), marginBottom: 12 }}>
    <label style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
      {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
    </label>
    <input
      type={type} name={name} value={form[name] || ''} onChange={onChangeOverride || handleInputChange}
      disabled={profileCompleted}
      {...opts}
      style={{
        width: '100%', padding: '12px 14px', borderRadius: 10,
        background: profileCompleted ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.06)', 
        border: '1px solid var(--color-border)',
        color: profileCompleted ? '#94a3b8' : 'white', fontSize: 14, outline: 'none',
        transition: 'all 0.2s ease',
        ...opts.style
      }}
    />
  </div>
);

const FileUploadBox = ({ title, type, urlField, required = false, form, profileCompleted, isLoading, handleFileUpload }: any) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const currentUrl = form[urlField];

  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
        {title} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      {profileCompleted ? (
        currentUrl ? (
          <a href={currentUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
            <FileText size={18} /> Ver Documento Salvo
          </a>
        ) : <p style={{ fontSize: 12, color: '#94a3b8' }}>Nenhum anexo salvo.</p>
      ) : (
          <div style={{ padding: 16, border: '1px dashed var(--color-border)', borderRadius: 12, textAlign: 'center' }}>
            {currentUrl ? (
              <div style={{ color: '#22c55e', fontSize: 13, fontWeight: 700, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <CheckCircle2 size={16} /> Anexo Enviado
              </div>
            ) : null}
            <button type="button" onClick={() => inputRef.current?.click()} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '8px 16px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />} {currentUrl ? 'Substituir Arquivo' : 'Enviar Arquivo'}
            </button>
            <input type="file" accept="image/*,.pdf" ref={inputRef} style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], type)} />
          </div>
      )}
    </div>
  );
};

export default function PerfilPage() {
  const { user, userData, refreshUserData, logout } = useAuth();
  
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingCert, setUploadingCert] = useState(false);
  const [uploadingAddress, setUploadingAddress] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadingCriminal, setUploadingCriminal] = useState(false);

  const [form, setForm] = useState({
    name: userData?.name || '',
    birthDate: userData?.birthDate || '',
    birthPlace: userData?.birthPlace || '',
    gender: userData?.gender || '',
    fatherName: userData?.fatherName || '',
    motherName: userData?.motherName || '',
    addressComplete: userData?.addressComplete || '',
    cep: userData?.cep || '',
    phone: userData?.phone || '',
    rg: userData?.rg || '',
    rgIssuer: userData?.rgIssuer || '',
    rgIssueDate: userData?.rgIssueDate || '',
    cpf: userData?.cpf || '',
    pis: userData?.pis || '',
    pisIssueDate: userData?.pisIssueDate || '',
    ctps: userData?.ctps || '',
    ctpsSeries: userData?.ctpsSeries || '',
    ctpsIssueDate: userData?.ctpsIssueDate || '',
    voterTitle: userData?.voterTitle || '',
    voterZone: userData?.voterZone || '',
    voterSection: userData?.voterSection || '',
    militaryCertificate: userData?.militaryCertificate || '',
    susCard: userData?.susCard || '',
    inssBenefits: userData?.inssBenefits || '',
    govBenefits: userData?.govBenefits || '',
    weight: userData?.weight || '',
    height: userData?.height || '',
    courseRegistry: userData?.courseRegistry || '',
    photoUrl: userData?.photoUrl || '',
    courseCertificateUrl: userData?.courseCertificateUrl || '',
    addressProofUrl: userData?.addressProofUrl || '',
    resumeUrl: userData?.resumeUrl || '',
    criminalRecordUrl: userData?.criminalRecordUrl || '',
  });

  const photoInputRef = useRef<HTMLInputElement>(null);
  const profileCompleted = !!userData?.profileCompleted;

  // Mask CPF
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g,"");
    if (v.length > 11) v = v.slice(0, 11);
    v = v.replace(/(\d{3})(\d)/,"$1.$2");
    v = v.replace(/(\d{3})(\d)/,"$1.$2");
    v = v.replace(/(\d{3})(\d{1,2})$/,"$1-$2");
    setForm(prev => ({ ...prev, cpf: v }));
  };

  // Mask and Auto-fetch CEP
  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g,"");
    if (v.length > 8) v = v.slice(0, 8);
    const masked = v.replace(/^(\d{5})(\d)/, "$1-$2");
    setForm(prev => ({ ...prev, cep: masked }));
    
    if (v.length === 8 && !profileCompleted) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${v}/json/`);
        const data = await res.json();
        if (!data.erro) {
          const fullAddress = `${data.logradouro}, Bairro: ${data.bairro}, ${data.localidade} - ${data.uf}`;
          setForm(prev => ({ ...prev, addressComplete: prev.addressComplete ? prev.addressComplete : fullAddress }));
        }
      } catch(err) {
        // failed cep
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (file: File, type: 'photo' | 'cert' | 'address' | 'resume' | 'criminal') => {
    if (!user) return;

    const setLoader = (state: boolean) => {
      if (type === 'photo') setUploadingPhoto(state);
      if (type === 'cert') setUploadingCert(state);
      if (type === 'address') setUploadingAddress(state);
      if (type === 'resume') setUploadingResume(state);
      if (type === 'criminal') setUploadingCriminal(state);
    };

    setLoader(true);
    try {
      const CLOUD_NAME = "dryrzgg3f"; 
      const UPLOAD_PRESET = "alpha360_uploads";

      if (!CLOUD_NAME) {
        alert("Falta configurar o Cloudinary no código!");
        setLoader(false);
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Erro ao enviar para o Cloudinary');
      }

      const url = data.secure_url;

      setForm(prev => {
        let field = '';
        if (type === 'photo') field = 'photoUrl';
        if (type === 'cert') field = 'courseCertificateUrl';
        if (type === 'address') field = 'addressProofUrl';
        if (type === 'resume') field = 'resumeUrl';
        if (type === 'criminal') field = 'criminalRecordUrl';
        return { ...prev, [field]: url };
      });
    } catch (err: any) {
      console.error(err);
      alert('Erro ao enviar arquivo: ' + err.message);
    } finally {
      setLoader(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    const missing: string[] = [];
    if (!form.name) missing.push('Nome Completo');
    if (!form.birthDate) missing.push('Data Nascimento');
    if (!form.phone) missing.push('Telefone');
    if (!form.addressComplete) missing.push('Endereço Completo');
    if (!form.cpf) missing.push('CPF');
    if (!form.rg) missing.push('Identidade (RG)');
    if (!form.courseRegistry) missing.push('Registro do Curso (ATA)');
    if (!form.photoUrl) missing.push('Foto de Perfil');
    if (!form.courseCertificateUrl) missing.push('Certificado do Curso');
    if (!form.addressProofUrl) missing.push('Comprovante de Residência');

    if (missing.length > 0) {
      alert(`Atenção! Faltam os seguintes campos obrigatórios:\n\n- ${missing.join('\n- ')}\n\nPreencha-os para prosseguir.`);
      return;
    }

    setSaving(true);
    try {
      await api.updateUser(user.uid, { 
        ...form, 
        role: 'guard', 
        status: 'Inativo' 
      } as any);
      await refreshUserData();
      alert('Cadastro enviado e salvo com sucesso!');
      window.scrollTo(0,0);
    } catch (err: any) {
      alert(err.message || 'Erro ao enviar cadastro.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!user) return;
    if (!confirm('ATENÇÃO! Você apagará TODO o seu cadastro e precisará preencher novamente. Tem certeza?')) return;
    
    setResetting(true);
    try {
      await api.resetUserProfile(user.uid);
      window.location.reload();
    } catch (err) {
      alert('Erro ao apagar dados. Tente novamente.');
      setResetting(false);
    }
  };

  const renderInput = (label: string, name: string, opts: any = {}) => (
    <InputField label={label} name={name} form={form} handleInputChange={handleInputChange} profileCompleted={profileCompleted} {...opts} />
  );

  const renderUploadBox = (title: string, type: string, urlField: string, isLoading: boolean, opts: any = {}) => (
    <FileUploadBox title={title} type={type} urlField={urlField} isLoading={isLoading} form={form} profileCompleted={profileCompleted} handleFileUpload={handleFileUpload} {...opts} />
  );

  return (
    <div style={{ padding: '20px 16px 100px', maxWidth: 480, margin: '0 auto' }}>
      
      <div className="safe-top" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
        <div style={{
          width: 96, height: 96, borderRadius: 32, background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: 'white',
          boxShadow: '0 8px 32px rgba(59,130,246,0.3)', marginBottom: 12, overflow: 'hidden', position: 'relative'
        }}>
          {form.photoUrl ? (
             <img src={form.photoUrl} alt="Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <User size={36} />
          )}
          {!profileCompleted && (
            <button onClick={() => photoInputRef.current?.click()} style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)',
              padding: 6, display: 'flex', justifyContent: 'center', border: 'none', color: 'white', cursor: 'pointer'
            }}>
              {uploadingPhoto ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
            </button>
          )}
        </div>
        <input type="file" accept="image/*" ref={photoInputRef} style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'photo')} />
        
        <h1 style={{ fontSize: 20, fontWeight: 900, textAlign: 'center' }}>{form.name || 'Novo Vigilante'}</h1>
        
        {profileCompleted ? (
          <div style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', padding: '6px 14px', borderRadius: 12, fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
            <CheckCircle2 size={14} /> CADASTRO CONCLUÍDO
          </div>
        ) : (
          <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '6px 14px', borderRadius: 12, fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
            <AlertTriangle size={14} /> CONCLUA SEU CADASTRO
          </div>
        )}
      </div>

      {!form.photoUrl && !profileCompleted ? (
         <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', padding: 20, borderRadius: 16, textAlign: 'center', marginBottom: 20 }}>
            <Camera size={32} color="#3b82f6" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ color: 'white', fontSize: 16, marginBottom: 8 }}>Precisamos te conhecer!</h3>
            <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 16 }}>Para desbloquear e preencher o formulário, toque no botão da câmera acima e envie uma foto bem legível para o seu Perfil.</p>
         </div>
      ) : (
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16, overflow: 'hidden', marginBottom: 16, padding: 16 }}>
        {!profileCompleted && (
          <div style={{ marginBottom: 20, padding: 12, background: 'rgba(245,158,11,0.1)', borderRadius: 10, border: '1px solid rgba(245,158,11,0.3)', color: '#fcd34d', fontSize: 13 }}>
            <strong>Aviso Legal:</strong> Preencha com atenção. Após salvar os dados, eles <strong>não poderão ser editados</strong>, apenas apagados para preenchimento desde o início.
          </div>
        )}

        <h2 style={{ fontSize: 14, fontWeight: 900, marginBottom: 12, borderBottom: '1px solid var(--color-border)', paddingBottom: 8 }}>1. Dados Pessoais</h2>
        {renderInput('Nome Completo', 'name', { required: true, autoComplete: 'name' })}
        <div style={{ display: 'flex', gap: 10 }}>
          {renderInput('Data Nascimento', 'birthDate', { type: 'date', required: true, autoComplete: 'bday', flex: 1 })}
          {renderInput('Naturalidade', 'birthPlace', { flex: 1 })}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 0.6, marginBottom: 12 }}>
            <label style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Sexo</label>
            <select name="gender" value={form.gender} onChange={handleInputChange as any} disabled={profileCompleted} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, background: profileCompleted?'rgba(255,255,255,0.02)':'rgba(255,255,255,0.06)', border: '1px solid var(--color-border)', color: 'white', outline: 'none' }}>
              <option value="" style={{ background: '#1e293b', color: 'white' }}>Selecione</option>
              <option value="Masculino" style={{ background: '#1e293b', color: 'white' }}>Masculino</option>
              <option value="Feminino" style={{ background: '#1e293b', color: 'white' }}>Feminino</option>
              <option value="Outro" style={{ background: '#1e293b', color: 'white' }}>Outro</option>
            </select>
          </div>
          {renderInput('Telefone', 'phone', { type: 'tel', required: true, autoComplete: 'tel', flex: 1 })}
        </div>
        
        <div style={{ position: 'relative' }}>
          {renderInput('Nome da Mãe', 'motherName')}
          {!profileCompleted && (
            <label style={{ position: 'absolute', top: 0, right: 0, fontSize: 11, fontWeight: 600, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
               <input type="checkbox" disabled={profileCompleted} checked={form.motherName === 'NÃO CONSTA'} onChange={(e) => setForm(p => ({...p, motherName: e.target.checked ? 'NÃO CONSTA' : ''}))} /> Não consta
            </label>
          )}
        </div>
        <div style={{ position: 'relative' }}>
          {renderInput('Nome do Pai', 'fatherName')}
          {!profileCompleted && (
            <label style={{ position: 'absolute', top: 0, right: 0, fontSize: 11, fontWeight: 600, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
               <input type="checkbox" disabled={profileCompleted} checked={form.fatherName === 'NÃO CONSTA'} onChange={(e) => setForm(p => ({...p, fatherName: e.target.checked ? 'NÃO CONSTA' : ''}))} /> Não consta
            </label>
          )}
        </div>
        
        <h2 style={{ fontSize: 14, fontWeight: 900, marginTop: 24, marginBottom: 12, borderBottom: '1px solid var(--color-border)', paddingBottom: 8 }}>2. Física & Endereço</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          {renderInput('Peso (kg)', 'weight', { type: 'number', flex: 1 })}
          {renderInput('Altura (cm)', 'height', { type: 'number', flex: 1 })}
        </div>
        {renderInput('CEP', 'cep', { autoComplete: 'postal-code', onChangeOverride: handleCepChange, placeholder: '00000-000' })}
        {renderInput('Endereço Completo', 'addressComplete', { required: true, autoComplete: 'street-address', placeholder: 'Rua, Bairro, Cidade - UF' })}
        
        {renderUploadBox('Comprovante de Residência', 'address', 'addressProofUrl', uploadingAddress, { required: true })}

        <h2 style={{ fontSize: 14, fontWeight: 900, marginTop: 24, marginBottom: 12, borderBottom: '1px solid var(--color-border)', paddingBottom: 8 }}>3. Documentação</h2>
        <div style={{ display: 'flex', gap: 10 }}>{renderInput('CPF', 'cpf', { required: true, flex: 1, onChangeOverride: handleCpfChange, placeholder: '000.000.000-00' })}{renderInput('Identidade (RG)', 'rg', { required: true, flex: 1 })}</div>
        <div style={{ display: 'flex', gap: 10 }}>{renderInput('Órgão Expedidor', 'rgIssuer', { flex: 1 })}{renderInput('Data Expedição', 'rgIssueDate', { type: 'date', flex: 1 })}</div>
        <div style={{ display: 'flex', gap: 10 }}>{renderInput('CTPS', 'ctps', { flex: 1 })}{renderInput('Série/UF', 'ctpsSeries', { flex: 1 })}</div>
        <div style={{ display: 'flex', gap: 10 }}>{renderInput('Emissão CTPS', 'ctpsIssueDate', { type: 'date', flex: 1 })}{renderInput('PIS', 'pis', { flex: 1 })}</div>
        <div style={{ display: 'flex', gap: 10 }}>{renderInput('Título Eleitoral', 'voterTitle', { flex: 1 })}{renderInput('Zona/Seção', 'voterZone', { flex: 1 })}</div>
        <div style={{ display: 'flex', gap: 10 }}>{renderInput('Certificado de Reservista', 'militaryCertificate', { flex: 1 })}{renderInput('Cartão do SUS', 'susCard', { flex: 1 })}</div>

        <h2 style={{ fontSize: 14, fontWeight: 900, marginTop: 24, marginBottom: 12, borderBottom: '1px solid var(--color-border)', paddingBottom: 8 }}>4. Formação & Anexos Extras</h2>
        {renderInput('Número do Registro do Curso de Vigilante (ATA)', 'courseRegistry', { required: true })}
        
        {renderUploadBox('Certificado Curso de Vigilante', 'cert', 'courseCertificateUrl', uploadingCert, { required: true })}
        {renderUploadBox('Currículo', 'resume', 'resumeUrl', uploadingResume)}
        {renderUploadBox('Nada Consta Criminal', 'criminal', 'criminalRecordUrl', uploadingCriminal)}

        <h2 style={{ fontSize: 14, fontWeight: 900, marginTop: 24, marginBottom: 12, borderBottom: '1px solid var(--color-border)', paddingBottom: 8 }}>5. Benefícios Sociais (Opcional)</h2>
        {renderInput('Recebe Benefício INSS? (Qual?)', 'inssBenefits')}
        {renderInput('Recebe Benefício do Governo? (Qual?)', 'govBenefits')}
        
        {/* ACTION BUTTONS */}
        {!profileCompleted ? (
          <button onClick={handleSave} disabled={saving} style={{
            width: '100%', padding: 16, borderRadius: 14, background: '#3b82f6', color: 'white', fontSize: 15, fontWeight: 900,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24,
            opacity: saving ? 0.6 : 1, boxShadow: '0 4px 16px rgba(59,130,246,0.3)', border: 'none', cursor: 'pointer'
          }}>
            {saving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Salvar & Trancar Cadastro</>}
          </button>
        ) : (
          <button onClick={handleReset} disabled={resetting} style={{
            width: '100%', padding: 16, borderRadius: 14, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)',
            fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24,
            opacity: resetting ? 0.6 : 1, cursor: 'pointer'
          }}>
            {resetting ? <Loader2 size={18} className="animate-spin" /> : <><AlertTriangle size={18} /> Apagar Dados e Refazer Cadastro</>}
          </button>
        )}
      </div>
      )}

      <button onClick={() => { if(confirm('Sair da conta?')) logout() }} style={{
        width: '100%', padding: 16, borderRadius: 14, background: 'transparent', color: '#64748b', fontSize: 14, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: 'none', cursor: 'pointer'
      }}>
        <LogOut size={16} /> Sair do App
      </button>

    </div>
  );
}

