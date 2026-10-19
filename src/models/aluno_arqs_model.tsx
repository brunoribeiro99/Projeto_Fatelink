export interface CertificadoModel {
  id: string;
  nome: string;
  instituicao?: string;
  arquivoNome: string;
  arquivoUrl: string;
  createdAt: string;
}

export interface CurriculoModel {
  arquivoNome: string;
  arquivoUrl: string;
  atualizadoEm: string;
}

export interface AlunoArquivosModel {
  fotoUrl?: string;
  curriculo?: CurriculoModel;
  certificados?: CertificadoModel[];
}
