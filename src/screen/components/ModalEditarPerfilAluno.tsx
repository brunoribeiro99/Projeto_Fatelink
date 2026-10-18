import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
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

// Firebase imports
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../service/firebaseConfig";

const { height, width } = Dimensions.get("window");

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

  // Controle de cards retráteis (sanfona)
  const [cardAberto, setCardAberto] = useState<string>("dadosBasicos");

  // Campos Pessoais
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [idade, setIdade] = useState("");
  const [endereco, setEndereco] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");

  // Campos Profissionais
  const [curso, setCurso] = useState(CURSOS_FATEC[0]);
  const [semestre, setSemestre] = useState(SEMESTRES[0]);
  const [showDropdownCurso, setShowDropdownCurso] = useState(false);
  const [showDropdownSemestre, setShowDropdownSemestre] = useState(false);

  const [cursosExtras, setCursosExtras] = useState("");
  const [certificadoNome, setCertificadoNome] = useState("");
  const [experiencias, setExperiencias] = useState("");
  const [curriculoNome, setCurriculoNome] = useState("");

  // Feedback Toast/Alert
  const [feedbackMsg, setFeedbackMsg] = useState("");

  // Alternador de acordeão
  const toggleCard = (nomeCard: string) => {
    setCardAberto((prev) => (prev === nomeCard ? "" : nomeCard));
  };

  // Carrega os dados reais do Firestore ao abrir
  useEffect(() => {
    if (visible) {
      async function buscarDados() {
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

            if (data.curso) setCurso(data.curso);
            if (data.semestre) setSemestre(data.semestre);
            setCursosExtras(data.cursosExtras || "");
            setCertificadoNome(data.certificadoNome || "");
            setExperiencias(data.experiencias || "");
            setCurriculoNome(data.curriculoNome || "");
          }
        } catch (error) {
          console.log("Erro ao carregar perfil:", error);
        } finally {
          setCarregandoDados(false);
        }
      }

      buscarDados();
    }
  }, [visible]);

  // Upload/Seleção de Arquivo (PDF)
  const selecionarArquivoPdf = async (tipo: "certificado" | "curriculo") => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        if (tipo === "certificado") {
          setCertificadoNome(file.name);
        } else {
          setCurriculoNome(file.name);
        }
      }
    } catch (err) {
      console.log("Erro ao selecionar PDF:", err);
    }
  };

  // Salvar no Firestore
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
        cursosExtras: cursosExtras.trim(),
        certificadoNome,
        experiencias: experiencias.trim(),
        curriculoNome,
        atualizadoEm: new Date().toISOString(),
      });

      setFeedbackMsg("Informações atualizadas com sucesso!");
      if (onPerfilAtualizado) onPerfilAtualizado();

      setTimeout(() => {
        setFeedbackMsg("");
        onClose();
      }, 1400);
    } catch (error) {
      console.log("Erro ao salvar perfil:", error);
      setFeedbackMsg("Erro ao salvar alterações. Tente novamente.");
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
            {/* TOPO COM TÍTULO E BOTÃO FECHAR */}
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

            {/* SELETOR DE ABAS: PESSOAL E PROFISSIONAL */}
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
                            placeholder="Seu nome completo"
                          />

                          <Text style={styles.fieldLabel}>
                            CPF (CONFIRMAÇÃO)
                          </Text>
                          <TextInput
                            style={[styles.inputField, styles.disabledInput]}
                            value={cpf}
                            editable={false}
                            placeholder="CPF cadastrado"
                          />

                          <Text style={styles.fieldLabel}>IDADE</Text>
                          <TextInput
                            style={styles.inputField}
                            value={idade}
                            onChangeText={setIdade}
                            keyboardType="numeric"
                            placeholder="Ex: 21"
                            maxLength={3}
                          />

                          <Text style={styles.fieldLabel}>ENDEREÇO</Text>
                          <TextInput
                            style={styles.inputField}
                            value={endereco}
                            onChangeText={setEndereco}
                            placeholder="Cidade, Bairro, Estado"
                          />
                        </View>
                      )}
                    </View>

                    {/* CARD 2: INFORMAÇÕES DE CONTATO */}
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
                            placeholder="E-mail de login"
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

                          {/* Dropdown Curso */}
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

                          {/* Dropdown Semestre */}
                          <Text style={[styles.fieldLabel, { marginTop: 10 }]}>
                            SEMESTRE ATUAL
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

                    {/* CARD 2: CURSOS EXTRAS & CERTIFICADOS */}
                    <View style={styles.compactCard}>
                      <TouchableOpacity
                        style={styles.cardHeaderToggle}
                        activeOpacity={0.7}
                        onPress={() => toggleCard("cursosCertificados")}
                      >
                        <View style={styles.cardHeaderLeft}>
                          <Ionicons
                            name="ribbon-outline"
                            size={18}
                            color="#5599FE"
                          />
                          <Text style={styles.cardTitle}>
                            Cursos & Certificados
                          </Text>
                        </View>
                        <Ionicons
                          name={
                            cardAberto === "cursosCertificados"
                              ? "chevron-up"
                              : "chevron-down"
                          }
                          size={20}
                          color="#777777"
                        />
                      </TouchableOpacity>

                      {cardAberto === "cursosCertificados" && (
                        <View style={styles.cardBody}>
                          <Text style={styles.fieldLabel}>
                            CURSOS REALIZADOS
                          </Text>
                          <TextInput
                            style={[styles.inputField, styles.textArea]}
                            value={cursosExtras}
                            onChangeText={setCursosExtras}
                            placeholder="Ex: Formação React Native, Cisco Networking..."
                            multiline={true}
                            numberOfLines={3}
                          />

                          <Text style={styles.fieldLabel}>
                            ANEXAR CERTIFICADO (PDF)
                          </Text>
                          <TouchableOpacity
                            style={styles.btnUploadPdf}
                            activeOpacity={0.8}
                            onPress={() => selecionarArquivoPdf("certificado")}
                          >
                            <Ionicons
                              name="cloud-upload-outline"
                              size={18}
                              color="#5599FE"
                              style={{ marginRight: 6 }}
                            />
                            <Text
                              style={styles.btnUploadPdfText}
                              numberOfLines={1}
                            >
                              {certificadoNome ||
                                "Selecionar Certificado em PDF"}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>

                    {/* CARD 3: EXPERIÊNCIAS PROFISSIONAIS */}
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
                            HISTÓRICO DE ATUAÇÃO
                          </Text>
                          <TextInput
                            style={[styles.inputField, styles.textArea]}
                            value={experiencias}
                            onChangeText={setExperiencias}
                            placeholder="Descreva cargos anteriores, projetos práticos ou estágios..."
                            multiline={true}
                            numberOfLines={4}
                          />
                        </View>
                      )}
                    </View>

                    {/* CARD 4: CURRÍCULO (PDF) */}
                    <View style={styles.compactCard}>
                      <TouchableOpacity
                        style={styles.cardHeaderToggle}
                        activeOpacity={0.7}
                        onPress={() => toggleCard("curriculo")}
                      >
                        <View style={styles.cardHeaderLeft}>
                          <Ionicons
                            name="document-text-outline"
                            size={18}
                            color="#5599FE"
                          />
                          <Text style={styles.cardTitle}>Currículo Geral</Text>
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
                          <Text style={styles.fieldLabel}>
                            ANEXAR CURRÍCULO EM PDF
                          </Text>
                          <TouchableOpacity
                            style={styles.btnUploadPdf}
                            activeOpacity={0.8}
                            onPress={() => selecionarArquivoPdf("curriculo")}
                          >
                            <Ionicons
                              name="document-attach-outline"
                              size={18}
                              color="#5599FE"
                              style={{ marginRight: 6 }}
                            />
                            <Text
                              style={styles.btnUploadPdfText}
                              numberOfLines={1}
                            >
                              {curriculoNome ||
                                "Anexar Currículo Atualizado (PDF)"}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </ScrollView>
            )}

            {/* FEEDBACK STATUS */}
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

            {/* BOTÃO FIXO: SALVAR ALTERAÇÕES */}
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
  btnUploadPdf: {
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
    marginBottom: 8,
  },
  btnUploadPdfText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#5599FE",
    maxWidth: "85%",
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
