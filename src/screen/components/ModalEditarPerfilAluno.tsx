import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  CertificadoModel,
  CurriculoModel,
} from "../../models/aluno_arqs_model";
import { AlunoArquivosService } from "../../service/aluno_arq_service";
import { auth, db } from "../../service/firebaseConfig";

const { height } = Dimensions.get("window");

interface ModalEditarPerfilAlunoProps {
  visible: boolean;
  onClose: () => void;
  onPerfilAtualizado?: () => void;
}

const CURSOS_FATEC = [
  "Sistemas para Internet",
  "Análise e Desenvolvimento de Sistemas",
  "Gestão Empresarial",
  "Agronegócio",
  "Logística",
  "Gestão da Tecnologia da Informação",
];

const SEMESTRES = [
  "1º Semestre",
  "2º Semestre",
  "3º Semestre",
  "4º Semestre",
  "5º Semestre",
  "6º Semestre",
];

export default function ModalEditarPerfilAluno({
  visible,
  onClose,
  onPerfilAtualizado,
}: ModalEditarPerfilAlunoProps) {
  const [tabAtiva, setTabAtiva] = useState<"pessoal" | "profissional">(
    "pessoal",
  );
  const [salvando, setSalvando] = useState(false);
  const [carregandoDados, setCarregandoDados] = useState(false);

  // Controle de acordion
  const [cardAberto, setCardAberto] = useState<string>("dadosBasicos");

  // Informações Pessoais
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [idade, setIdade] = useState("");
  const [endereco, setEndereco] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [enviandoFoto, setEnviandoFoto] = useState(false);

  // Informações Profissionais
  const [curso, setCurso] = useState(CURSOS_FATEC[0]);
  const [semestre, setSemestre] = useState(SEMESTRES[0]);
  const [showDropdownCurso, setShowDropdownCurso] = useState(false);
  const [showDropdownSemestre, setShowDropdownSemestre] = useState(false);
  const [experiencias, setExperiencias] = useState("");

  // CRUD de Currículo
  const [curriculo, setCurriculo] = useState<CurriculoModel | null>(null);
  const [enviandoCurriculo, setEnviandoCurriculo] = useState(false);

  // CRUD de Certificados
  const [certificados, setCertificados] = useState<CertificadoModel[]>([]);
  const [nomeNovoCertificado, setNomeNovoCertificado] = useState("");
  const [enviandoCertificado, setEnviandoCertificado] = useState(false);

  const [feedbackMsg, setFeedbackMsg] = useState("");

  const toggleCard = (nomeCard: string) => {
    setCardAberto((prev) => (prev === nomeCard ? "" : nomeCard));
  };

  // Carrega informações completas do usuário
  useEffect(() => {
    if (visible) {
      async function carregarDadosCompletos() {
        const user = auth.currentUser;
        if (!user) return;

        try {
          setCarregandoDados(true);
          const docRef = doc(db, "usuarios", user.uid);
          const snap = await getDoc(docRef);

          if (snap.exists()) {
            const data = snap.data();
            setNome(data.nome || "");
            setCpf(data.cpf || "");
            setIdade(data.idade || "");
            setEndereco(data.endereco || "");
            setEmail(data.email || user.email || "");
            setTelefone(data.telefone || "");
            setFotoUrl(data.fotoUrl || "");

            if (data.curso) setCurso(data.curso);
            if (data.semestre) setSemestre(data.semestre);
            setExperiencias(data.experiencias || "");
            setCurriculo(data.curriculo || null);
            setCertificados((data.certificados as CertificadoModel[]) || []);
          }
        } catch (error) {
          console.log("Erro ao carregar dados:", error);
        } finally {
          setCarregandoDados(false);
        }
      }

      carregarDadosCompletos();
    }
  }, [visible]);

  // =====================================================
  // AÇÃO 1: SELECIONAR E ENVIAR FOTO DE PERFIL
  // =====================================================
  const handleSelecionarFoto = async () => {
    try {
      const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissao.granted) {
        Alert.alert(
          "Atenção",
          "Precisamos de permissão para acessar a galeria.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setEnviandoFoto(true);
        const novaUrl = await AlunoArquivosService.uploadFotoPerfil(
          result.assets[0].uri,
        );
        setFotoUrl(novaUrl);
        if (onPerfilAtualizado) onPerfilAtualizado();
      }
    } catch (error) {
      console.log("Erro ao enviar foto:", error);
      Alert.alert("Erro", "Não foi possível carregar a imagem.");
    } finally {
      setEnviandoFoto(false);
    }
  };

  // =====================================================
  // AÇÃO 2: SELECIONAR E ENVIAR CURRÍCULO (PDF)
  // =====================================================
  const handleUploadCurriculo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setEnviandoCurriculo(true);

        const novoCurriculo = await AlunoArquivosService.uploadCurriculo(
          file.uri,
          file.name,
        );
        setCurriculo(novoCurriculo);
        if (onPerfilAtualizado) onPerfilAtualizado();
      }
    } catch (error) {
      console.log("Erro no currículo:", error);
      Alert.alert("Erro", "Falha ao enviar o currículo.");
    } finally {
      setEnviandoCurriculo(false);
    }
  };

  // =====================================================
  // AÇÃO 3: ADICIONAR CERTIFICADO (PDF)
  // =====================================================
  const handleAdicionarCertificado = async () => {
    if (!nomeNovoCertificado.trim()) {
      Alert.alert(
        "Campo Obrigatório",
        "Digite o nome ou curso do certificado antes de anexar o PDF.",
      );
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setEnviandoCertificado(true);

        const novo = await AlunoArquivosService.adicionarCertificado(
          nomeNovoCertificado,
          file.uri,
          file.name,
        );

        setCertificados((prev) => [...prev, novo]);
        setNomeNovoCertificado("");
        if (onPerfilAtualizado) onPerfilAtualizado();
      }
    } catch (error) {
      console.log("Erro ao adicionar certificado:", error);
      Alert.alert("Erro", "Falha ao enviar o certificado.");
    } finally {
      setEnviandoCertificado(false);
    }
  };

  // =====================================================
  // AÇÃO 4: EXCLUIR CERTIFICADO
  // =====================================================
  const handleExcluirCertificado = (cert: CertificadoModel) => {
    Alert.alert(
      "Excluir Certificado",
      `Deseja realmente excluir "${cert.nome}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await AlunoArquivosService.excluirCertificado(cert);
              setCertificados((prev) =>
                prev.filter((item) => item.id !== cert.id),
              );
              if (onPerfilAtualizado) onPerfilAtualizado();
            } catch (error) {
              Alert.alert("Erro", "Não foi possível remover o certificado.");
            }
          },
        },
      ],
    );
  };

  // Salvar alterações de texto no Firestore
  const handleSalvar = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      setSalvando(true);
      const userRef = doc(db, "usuarios", user.uid);

      await updateDoc(userRef, {
        nome: nome.trim(),
        idade: idade.trim(),
        endereco: endereco.trim(),
        telefone: telefone.replace(/\D/g, ""),
        instituicao: "FATEC",
        curso,
        semestre,
        experiencias: experiencias.trim(),
        atualizadoEm: new Date().toISOString(),
      });

      setFeedbackMsg("Perfil salvo com sucesso!");
      if (onPerfilAtualizado) onPerfilAtualizado();

      setTimeout(() => {
        setFeedbackMsg("");
        onClose();
      }, 1200);
    } catch (error) {
      console.log("Erro ao salvar:", error);
      setFeedbackMsg("Erro ao salvar dados.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableWithoutFeedback>
          <View style={styles.modalCard}>
            {/* TOPO */}
            <View style={styles.headerRow}>
              <Text style={styles.modalTitle}>ATUALIZAR MEU PERFIL</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onClose}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={24} color="#777777" />
              </TouchableOpacity>
            </View>

            {/* SELETOR DE ABAS */}
            <View style={styles.tabSelector}>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  tabAtiva === "pessoal" && styles.tabButtonActive,
                ]}
                activeOpacity={0.8}
                onPress={() => setTabAtiva("pessoal")}
              >
                <Ionicons
                  name="person-outline"
                  size={16}
                  color={tabAtiva === "pessoal" ? "#FFFFFF" : "#5599FE"}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.tabButtonText,
                    tabAtiva === "pessoal" && styles.tabButtonTextActive,
                  ]}
                >
                  PESSOAL
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabButton,
                  tabAtiva === "profissional" && styles.tabButtonActive,
                ]}
                activeOpacity={0.8}
                onPress={() => setTabAtiva("profissional")}
              >
                <Ionicons
                  name="briefcase-outline"
                  size={16}
                  color={tabAtiva === "profissional" ? "#FFFFFF" : "#5599FE"}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.tabButtonText,
                    tabAtiva === "profissional" && styles.tabButtonTextActive,
                  ]}
                >
                  PROFISSIONAL
                </Text>
              </TouchableOpacity>
            </View>

            {carregandoDados ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#5599FE" />
                <Text style={styles.loadingText}>
                  Carregando informações...
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.scrollArea}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
              >
                {/* ================= ABA PESSOAL ================= */}
                {tabAtiva === "pessoal" && (
                  <View style={styles.tabContent}>
                    {/* FOTO DE PERFIL */}
                    <View style={styles.photoSection}>
                      <TouchableOpacity
                        style={styles.avatarWrapper}
                        activeOpacity={0.8}
                        onPress={handleSelecionarFoto}
                        disabled={enviandoFoto}
                      >
                        {fotoUrl ? (
                          <Image
                            source={{ uri: fotoUrl }}
                            style={styles.avatarImage}
                          />
                        ) : (
                          <Ionicons name="person" size={44} color="#5599FE" />
                        )}

                        <View style={styles.cameraIconBadge}>
                          {enviandoFoto ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <Ionicons name="camera" size={14} color="#FFFFFF" />
                          )}
                        </View>
                      </TouchableOpacity>
                      <Text style={styles.photoHintText}>
                        Toque para alterar sua foto
                      </Text>
                    </View>

                    {/* CARD 1: DADOS BÁSICOS */}
                    <View style={styles.compactCard}>
                      <TouchableOpacity
                        style={styles.cardHeaderToggle}
                        activeOpacity={0.7}
                        onPress={() => toggleCard("dadosBasicos")}
                      >
                        <View style={styles.cardHeaderLeft}>
                          <Ionicons
                            name="id-card-outline"
                            size={18}
                            color="#5599FE"
                          />
                          <Text style={styles.cardTitle}>Dados Básicos</Text>
                        </View>
                        <Ionicons
                          name={
                            cardAberto === "dadosBasicos"
                              ? "chevron-up"
                              : "chevron-down"
                          }
                          size={20}
                          color="#777777"
                        />
                      </TouchableOpacity>

                      {cardAberto === "dadosBasicos" && (
                        <View style={styles.cardBody}>
                          <Text style={styles.fieldLabel}>NOME COMPLETO</Text>
                          <TextInput
                            style={styles.inputField}
                            value={nome}
                            onChangeText={setNome}
                            placeholder="Seu nome"
                          />

                          <Text style={styles.fieldLabel}>
                            CPF (CONFIRMAÇÃO)
                          </Text>
                          <TextInput
                            style={[styles.inputField, styles.disabledInput]}
                            value={cpf}
                            editable={false}
                          />

                          <Text style={styles.fieldLabel}>IDADE</Text>
                          <TextInput
                            style={styles.inputField}
                            value={idade}
                            onChangeText={setIdade}
                            keyboardType="numeric"
                            placeholder="Ex: 22"
                            maxLength={3}
                          />

                          <Text style={styles.fieldLabel}>
                            ENDEREÇO / CIDADE
                          </Text>
                          <TextInput
                            style={styles.inputField}
                            value={endereco}
                            onChangeText={setEndereco}
                            placeholder="Fernandópolis - SP"
                          />
                        </View>
                      )}
                    </View>

                    {/* CARD 2: CONTATO */}
                    <View style={styles.compactCard}>
                      <TouchableOpacity
                        style={styles.cardHeaderToggle}
                        activeOpacity={0.7}
                        onPress={() => toggleCard("contato")}
                      >
                        <View style={styles.cardHeaderLeft}>
                          <Ionicons
                            name="call-outline"
                            size={18}
                            color="#5599FE"
                          />
                          <Text style={styles.cardTitle}>
                            Contato & Comunicação
                          </Text>
                        </View>
                        <Ionicons
                          name={
                            cardAberto === "contato"
                              ? "chevron-up"
                              : "chevron-down"
                          }
                          size={20}
                          color="#777777"
                        />
                      </TouchableOpacity>

                      {cardAberto === "contato" && (
                        <View style={styles.cardBody}>
                          <Text style={styles.fieldLabel}>
                            E-MAIL DE ACESSO
                          </Text>
                          <TextInput
                            style={[styles.inputField, styles.disabledInput]}
                            value={email}
                            editable={false}
                          />

                          <Text style={styles.fieldLabel}>
                            TELEFONE / WHATSAPP
                          </Text>
                          <TextInput
                            style={styles.inputField}
                            value={telefone}
                            onChangeText={setTelefone}
                            keyboardType="phone-pad"
                            placeholder="(00) 00000-0000"
                            maxLength={15}
                          />
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* ================= ABA PROFISSIONAL ================= */}
                {tabAtiva === "profissional" && (
                  <View style={styles.tabContent}>
                    {/* CARD 1: VÍNCULO FATEC */}
                    <View style={styles.compactCard}>
                      <TouchableOpacity
                        style={styles.cardHeaderToggle}
                        activeOpacity={0.7}
                        onPress={() => toggleCard("fatec")}
                      >
                        <View style={styles.cardHeaderLeft}>
                          <Ionicons
                            name="school-outline"
                            size={18}
                            color="#5599FE"
                          />
                          <Text style={styles.cardTitle}>
                            Vínculo Acadêmico (FATEC)
                          </Text>
                        </View>
                        <Ionicons
                          name={
                            cardAberto === "fatec"
                              ? "chevron-up"
                              : "chevron-down"
                          }
                          size={20}
                          color="#777777"
                        />
                      </TouchableOpacity>

                      {cardAberto === "fatec" && (
                        <View style={styles.cardBody}>
                          <Text style={styles.fieldLabel}>INSTITUIÇÃO</Text>
                          <TextInput
                            style={[styles.inputField, styles.disabledInput]}
                            value="FATEC"
                            editable={false}
                          />

                          <Text style={styles.fieldLabel}>CURSO</Text>
                          <TouchableOpacity
                            style={styles.dropdownSelector}
                            activeOpacity={0.8}
                            onPress={() =>
                              setShowDropdownCurso(!showDropdownCurso)
                            }
                          >
                            <Text style={styles.dropdownSelectorText}>
                              {curso}
                            </Text>
                            <Ionicons
                              name={
                                showDropdownCurso
                                  ? "chevron-up"
                                  : "chevron-down"
                              }
                              size={18}
                              color="#5599FE"
                            />
                          </TouchableOpacity>

                          {showDropdownCurso && (
                            <View style={styles.dropdownOptionsContainer}>
                              {CURSOS_FATEC.map((c, i) => (
                                <TouchableOpacity
                                  key={i}
                                  style={styles.dropdownOption}
                                  onPress={() => {
                                    setCurso(c);
                                    setShowDropdownCurso(false);
                                  }}
                                >
                                  <Text
                                    style={[
                                      styles.dropdownOptionText,
                                      curso === c &&
                                        styles.dropdownOptionTextActive,
                                    ]}
                                  >
                                    {c}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          )}

                          <Text style={[styles.fieldLabel, { marginTop: 10 }]}>
                            SEMESTRE
                          </Text>
                          <TouchableOpacity
                            style={styles.dropdownSelector}
                            activeOpacity={0.8}
                            onPress={() =>
                              setShowDropdownSemestre(!showDropdownSemestre)
                            }
                          >
                            <Text style={styles.dropdownSelectorText}>
                              {semestre}
                            </Text>
                            <Ionicons
                              name={
                                showDropdownSemestre
                                  ? "chevron-up"
                                  : "chevron-down"
                              }
                              size={18}
                              color="#5599FE"
                            />
                          </TouchableOpacity>

                          {showDropdownSemestre && (
                            <View style={styles.dropdownOptionsContainer}>
                              {SEMESTRES.map((s, i) => (
                                <TouchableOpacity
                                  key={i}
                                  style={styles.dropdownOption}
                                  onPress={() => {
                                    setSemestre(s);
                                    setShowDropdownSemestre(false);
                                  }}
                                >
                                  <Text
                                    style={[
                                      styles.dropdownOptionText,
                                      semestre === s &&
                                        styles.dropdownOptionTextActive,
                                    ]}
                                  >
                                    {s}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          )}
                        </View>
                      )}
                    </View>

                    {/* CARD 2: CERTIFICADOS (CRUD COMPLETO) */}
                    <View style={styles.compactCard}>
                      <TouchableOpacity
                        style={styles.cardHeaderToggle}
                        activeOpacity={0.7}
                        onPress={() => toggleCard("certificados")}
                      >
                        <View style={styles.cardHeaderLeft}>
                          <Ionicons
                            name="ribbon-outline"
                            size={18}
                            color="#5599FE"
                          />
                          <Text style={styles.cardTitle}>
                            Certificados ({certificados.length})
                          </Text>
                        </View>
                        <Ionicons
                          name={
                            cardAberto === "certificados"
                              ? "chevron-up"
                              : "chevron-down"
                          }
                          size={20}
                          color="#777777"
                        />
                      </TouchableOpacity>

                      {cardAberto === "certificados" && (
                        <View style={styles.cardBody}>
                          {/* FORMULÁRIO DE ADICIONAR NOVO */}
                          <Text style={styles.fieldLabel}>
                            NOME DO CURSO / CERTIFICADO
                          </Text>
                          <TextInput
                            style={styles.inputField}
                            value={nomeNovoCertificado}
                            onChangeText={setNomeNovoCertificado}
                            placeholder="Ex: Formação React Native, Cisco..."
                          />

                          <TouchableOpacity
                            style={styles.btnAnexarCertificado}
                            activeOpacity={0.8}
                            onPress={handleAdicionarCertificado}
                            disabled={enviandoCertificado}
                          >
                            {enviandoCertificado ? (
                              <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                              <>
                                <Ionicons
                                  name="add-circle-outline"
                                  size={18}
                                  color="#FFFFFF"
                                  style={{ marginRight: 6 }}
                                />
                                <Text style={styles.btnAnexarCertificadoText}>
                                  ANEXAR PDF & SALVAR
                                </Text>
                              </>
                            )}
                          </TouchableOpacity>

                          {/* LISTA DOS CERTIFICADOS CADASTRADOS (READ & DELETE) */}
                          <Text style={[styles.fieldLabel, { marginTop: 12 }]}>
                            CERTIFICADOS REGISTRADOS
                          </Text>

                          {certificados.length > 0 ? (
                            certificados.map((cert) => (
                              <View key={cert.id} style={styles.itemArquivoRow}>
                                <View style={styles.itemArquivoIcon}>
                                  <Ionicons
                                    name="document-text"
                                    size={20}
                                    color="#5599FE"
                                  />
                                </View>
                                <View style={styles.itemArquivoInfo}>
                                  <Text
                                    style={styles.itemArquivoTitulo}
                                    numberOfLines={1}
                                  >
                                    {cert.nome}
                                  </Text>
                                  <Text
                                    style={styles.itemArquivoSub}
                                    numberOfLines={1}
                                  >
                                    {cert.arquivoNome}
                                  </Text>
                                </View>
                                <TouchableOpacity
                                  style={styles.btnExcluirArquivo}
                                  activeOpacity={0.7}
                                  onPress={() => handleExcluirCertificado(cert)}
                                >
                                  <Ionicons
                                    name="trash-outline"
                                    size={18}
                                    color="#D32F2F"
                                  />
                                </TouchableOpacity>
                              </View>
                            ))
                          ) : (
                            <Text style={styles.emptyItemsText}>
                              Nenhum certificado anexado ainda.
                            </Text>
                          )}
                        </View>
                      )}
                    </View>

                    {/* CARD 3: CURRÍCULO (PDF) */}
                    <View style={styles.compactCard}>
                      <TouchableOpacity
                        style={styles.cardHeaderToggle}
                        activeOpacity={0.7}
                        onPress={() => toggleCard("curriculo")}
                      >
                        <View style={styles.cardHeaderLeft}>
                          <Ionicons
                            name="document-attach-outline"
                            size={18}
                            color="#5599FE"
                          />
                          <Text style={styles.cardTitle}>
                            Currículo Atualizado (PDF)
                          </Text>
                        </View>
                        <Ionicons
                          name={
                            cardAberto === "curriculo"
                              ? "chevron-up"
                              : "chevron-down"
                          }
                          size={20}
                          color="#777777"
                        />
                      </TouchableOpacity>

                      {cardAberto === "curriculo" && (
                        <View style={styles.cardBody}>
                          {curriculo ? (
                            <View style={styles.itemArquivoRow}>
                              <View style={styles.itemArquivoIcon}>
                                <Ionicons
                                  name="document"
                                  size={20}
                                  color="#2E7D32"
                                />
                              </View>
                              <View style={styles.itemArquivoInfo}>
                                <Text
                                  style={styles.itemArquivoTitulo}
                                  numberOfLines={1}
                                >
                                  {curriculo.arquivoNome}
                                </Text>
                                <Text style={styles.itemArquivoSub}>
                                  Currículo enviado
                                </Text>
                              </View>
                              <TouchableOpacity
                                style={styles.btnSubstituirArquivo}
                                activeOpacity={0.7}
                                onPress={handleUploadCurriculo}
                              >
                                <Ionicons
                                  name="sync-outline"
                                  size={18}
                                  color="#5599FE"
                                />
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <TouchableOpacity
                              style={styles.btnUploadPdfDashed}
                              activeOpacity={0.8}
                              onPress={handleUploadCurriculo}
                              disabled={enviandoCurriculo}
                            >
                              {enviandoCurriculo ? (
                                <ActivityIndicator
                                  size="small"
                                  color="#5599FE"
                                />
                              ) : (
                                <>
                                  <Ionicons
                                    name="cloud-upload-outline"
                                    size={20}
                                    color="#5599FE"
                                    style={{ marginRight: 6 }}
                                  />
                                  <Text style={styles.btnUploadPdfDashedText}>
                                    Anexar Currículo em PDF
                                  </Text>
                                </>
                              )}
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>

                    {/* CARD 4: EXPERIÊNCIAS */}
                    <View style={styles.compactCard}>
                      <TouchableOpacity
                        style={styles.cardHeaderToggle}
                        activeOpacity={0.7}
                        onPress={() => toggleCard("experiencias")}
                      >
                        <View style={styles.cardHeaderLeft}>
                          <Ionicons
                            name="newspaper-outline"
                            size={18}
                            color="#5599FE"
                          />
                          <Text style={styles.cardTitle}>
                            Experiências Profissionais
                          </Text>
                        </View>
                        <Ionicons
                          name={
                            cardAberto === "experiencias"
                              ? "chevron-up"
                              : "chevron-down"
                          }
                          size={20}
                          color="#777777"
                        />
                      </TouchableOpacity>

                      {cardAberto === "experiencias" && (
                        <View style={styles.cardBody}>
                          <Text style={styles.fieldLabel}>
                            HISTÓRICO / PROJETOS
                          </Text>
                          <TextInput
                            style={[styles.inputField, styles.textArea]}
                            value={experiencias}
                            onChangeText={setExperiencias}
                            placeholder="Descreva suas experiências, projetos da faculdade ou estágios..."
                            multiline={true}
                            numberOfLines={4}
                          />
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </ScrollView>
            )}

            {/* FEEDBACK */}
            {feedbackMsg.length > 0 && (
              <Text
                style={[
                  styles.feedbackText,
                  feedbackMsg.includes("Erro")
                    ? styles.feedbackError
                    : styles.feedbackSuccess,
                ]}
              >
                {feedbackMsg}
              </Text>
            )}

            {/* BOTÃO SALVAR */}
            <View style={styles.footerContainer}>
              <TouchableOpacity
                style={styles.btnSalvar}
                activeOpacity={0.8}
                onPress={handleSalvar}
                disabled={salvando || carregandoDados}
              >
                {salvando ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.btnSalvarText}>SALVAR ALTERAÇÕES</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    maxHeight: height * 0.88,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#000000",
    letterSpacing: 0.4,
    textDecorationLine: "underline",
  },
  closeBtn: {
    padding: 4,
  },
  tabSelector: {
    flexDirection: "row",
    backgroundColor: "#F0F4F9",
    borderRadius: 24,
    padding: 4,
    marginBottom: 12,
  },
  tabButton: {
    flex: 1,
    height: 38,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  tabButtonActive: {
    backgroundColor: "#5599FE",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#5599FE",
  },
  tabButtonTextActive: {
    color: "#FFFFFF",
  },
  scrollArea: {
    maxHeight: height * 0.58,
  },
  tabContent: {
    paddingBottom: 10,
  },
  photoSection: {
    alignItems: "center",
    marginBottom: 14,
  },
  avatarWrapper: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#E8F0FE",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2.5,
    borderColor: "#5599FE",
    position: "relative",
  },
  avatarImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  cameraIconBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#5599FE",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  photoHintText: {
    fontSize: 11,
    color: "#777777",
    fontWeight: "600",
    marginTop: 6,
  },
  compactCard: {
    backgroundColor: "#FAFAFA",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ECECEC",
    marginBottom: 10,
    overflow: "hidden",
  },
  cardHeaderToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#FFFFFF",
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#222222",
  },
  cardBody: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    backgroundColor: "#FAFAFA",
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#777777",
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  inputField: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: "#333333",
    marginBottom: 10,
    ...Platform.select({
      web: { outlineStyle: "none" as any },
    }),
  },
  disabledInput: {
    backgroundColor: "#EFEFEF",
    color: "#777777",
  },
  textArea: {
    minHeight: 64,
    textAlignVertical: "top",
  },
  dropdownSelector: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    paddingHorizontal: 12,
    height: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownSelectorText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#333333",
  },
  dropdownOptionsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginTop: 4,
    marginBottom: 10,
    overflow: "hidden",
  },
  dropdownOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  dropdownOptionText: {
    fontSize: 11.5,
    color: "#555555",
    fontWeight: "600",
  },
  dropdownOptionTextActive: {
    color: "#5599FE",
    fontWeight: "800",
  },
  btnAnexarCertificado: {
    backgroundColor: "#5599FE",
    borderRadius: 12,
    height: 40,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  btnAnexarCertificadoText: {
    color: "#FFFFFF",
    fontSize: 11.5,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  itemArquivoRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    marginBottom: 8,
  },
  itemArquivoIcon: {
    marginRight: 8,
  },
  itemArquivoInfo: {
    flex: 1,
  },
  itemArquivoTitulo: {
    fontSize: 12,
    fontWeight: "800",
    color: "#222222",
  },
  itemArquivoSub: {
    fontSize: 10,
    color: "#777777",
    fontWeight: "600",
  },
  btnExcluirArquivo: {
    padding: 6,
  },
  btnSubstituirArquivo: {
    padding: 6,
  },
  btnUploadPdfDashed: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#5599FE",
    borderRadius: 12,
    borderStyle: "dashed",
    paddingVertical: 12,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  btnUploadPdfDashedText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#5599FE",
  },
  emptyItemsText: {
    fontSize: 11,
    color: "#888888",
    fontStyle: "italic",
    textAlign: "center",
    marginVertical: 6,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 12,
    color: "#666666",
    fontWeight: "700",
    marginTop: 10,
  },
  feedbackText: {
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
    marginVertical: 4,
  },
  feedbackSuccess: {
    color: "#2E7D32",
  },
  feedbackError: {
    color: "#D32F2F",
  },
  footerContainer: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    paddingTop: 10,
  },
  btnSalvar: {
    backgroundColor: "#5599FE",
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  btnSalvarText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
