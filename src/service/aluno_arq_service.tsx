import {
  deleteObject,
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from "firebase/storage";

import {
  arrayRemove,
  arrayUnion,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

import { auth, db, storage } from "./firebaseConfig";
import { CertificadoModel, CurriculoModel } from "../models/aluno_arqs_model";

export class AlunoArquivosService {
  // =====================================================
  // HELPER: CONVERTER URI DO DISPOSITIVO PARA BLOB
  // =====================================================
  private static async uriParaBlob(uri: string): Promise<Blob> {
    const response = await fetch(uri);
    return await response.blob();
  }

  // =====================================================
  // 1. FOTO DE PERFIL (UPLOAD & ATUALIZAÇÃO)
  // =====================================================
  static async uploadFotoPerfil(uri: string): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuário não autenticado.");

    try {
      const blob = await AlunoArquivosService.uriParaBlob(uri);
      const fotoRef = storageRef(
        storage,
        `usuarios/${user.uid}/foto_perfil.jpg`,
      );

      await uploadBytes(fotoRef, blob);
      const urlDownload = await getDownloadURL(fotoRef);

      // Atualiza URL no Firestore
      const userDocRef = doc(db, "usuarios", user.uid);
      await updateDoc(userDocRef, {
        fotoUrl: urlDownload,
        atualizadoEm: new Date().toISOString(),
      });

      return urlDownload;
    } catch (error) {
      console.error("Erro no upload da foto de perfil:", error);
      throw new Error("Falha ao salvar a foto de perfil.");
    }
  }

  // =====================================================
  // 2. CURRÍCULO EM PDF (UPLOAD & ATUALIZAÇÃO)
  // =====================================================
  static async uploadCurriculo(
    uri: string,
    nomeArquivo: string,
  ): Promise<CurriculoModel> {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuário não autenticado.");

    try {
      const blob = await AlunoArquivosService.uriParaBlob(uri);
      const curriculoStorageRef = storageRef(
        storage,
        `usuarios/${user.uid}/curriculo/curriculo.pdf`,
      );

      await uploadBytes(curriculoStorageRef, blob);
      const urlDownload = await getDownloadURL(curriculoStorageRef);

      const dadosCurriculo: CurriculoModel = {
        arquivoNome: nomeArquivo,
        arquivoUrl: urlDownload,
        atualizadoEm: new Date().toISOString(),
      };

      const userDocRef = doc(db, "usuarios", user.uid);
      await updateDoc(userDocRef, {
        curriculo: dadosCurriculo,
        atualizadoEm: new Date().toISOString(),
      });

      return dadosCurriculo;
    } catch (error) {
      console.error("Erro no upload do currículo:", error);
      throw new Error("Falha ao salvar o currículo.");
    }
  }

  // =====================================================
  // 3. CERTIFICADOS: ADICIONAR (CREATE)
  // =====================================================
  static async adicionarCertificado(
    nomeCertificado: string,
    uri: string,
    nomeOriginalArquivo: string,
    instituicao?: string,
  ): Promise<CertificadoModel> {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuário não autenticado.");

    try {
      const certificadoId = `cert_${Date.now()}`;
      const blob = await AlunoArquivosService.uriParaBlob(uri);

      const certificadoStorageRef = storageRef(
        storage,
        `usuarios/${user.uid}/certificados/${certificadoId}.pdf`,
      );

      await uploadBytes(certificadoStorageRef, blob);
      const urlDownload = await getDownloadURL(certificadoStorageRef);

      const novoCertificado: CertificadoModel = {
        id: certificadoId,
        nome: nomeCertificado.trim(),
        instituicao: instituicao?.trim() || "FATEC",
        arquivoNome: nomeOriginalArquivo,
        arquivoUrl: urlDownload,
        createdAt: new Date().toISOString(),
      };

      const userDocRef = doc(db, "usuarios", user.uid);
      await updateDoc(userDocRef, {
        certificados: arrayUnion(novoCertificado),
      });

      return novoCertificado;
    } catch (error) {
      console.error("Erro ao adicionar certificado:", error);
      throw new Error("Falha ao enviar e registrar o certificado.");
    }
  }

  // =====================================================
  // 4. CERTIFICADOS: LISTAR (READ)
  // =====================================================
  static async listarCertificados(): Promise<CertificadoModel[]> {
    const user = auth.currentUser;
    if (!user) return [];

    try {
      const userDocRef = doc(db, "usuarios", user.uid);
      const snap = await getDoc(userDocRef);

      if (snap.exists()) {
        const data = snap.data();
        return (data.certificados as CertificadoModel[]) || [];
      }
      return [];
    } catch (error) {
      console.error("Erro ao listar certificados:", error);
      throw new Error("Falha ao carregar certificados.");
    }
  }

  // =====================================================
  // 5. CERTIFICADOS: EXCLUIR (DELETE)
  // =====================================================
  static async excluirCertificado(
    certificado: CertificadoModel,
  ): Promise<boolean> {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuário não autenticado.");

    try {
      // 1. Remove do Storage
      try {
        const certStorageRef = storageRef(
          storage,
          `usuarios/${user.uid}/certificados/${certificado.id}.pdf`,
        );
        await deleteObject(certStorageRef);
      } catch (storageErr) {
        console.warn("Aviso: Arquivo já não existia no Storage:", storageErr);
      }

      // 2. Remove do array no Firestore
      const userDocRef = doc(db, "usuarios", user.uid);
      await updateDoc(userDocRef, {
        certificados: arrayRemove(certificado),
      });

      return true;
    } catch (error) {
      console.error("Erro ao excluir certificado:", error);
      throw new Error("Falha ao excluir o certificado.");
    }
  }
}