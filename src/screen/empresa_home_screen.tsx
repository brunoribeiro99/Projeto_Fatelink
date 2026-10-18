import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Dimensions,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { signOut } from "firebase/auth";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../service/firebaseConfig";

const { width } = Dimensions.get("window");

const CANDIDATOS_MOCK = [
  {
    id: "1",
    nome: "Lucas Andrade",
    idade: "21 anos",
    curso: "Sistemas para Internet - FATEC",
    competencias: [
      "React Native",
      "TypeScript",
      "Node.js",
      "Git & GitHub",
      "Figma",
    ],
    sobre:
      "Estudante focado no desenvolvimento de aplicações mobile e web modernas. Experiência prática em projetos acadêmicos e busca ativa por estágio na área de tecnologia.",
  },
  {
    id: "2",
    nome: "Mariana Souza",
    idade: "23 anos",
    curso: "Gestão Empresarial - FATEC",
    competencias: [
      "Recrutamento & Seleção",
      "Comunicação",
      "Excel Avançado",
      "Power BI",
    ],
    sobre:
      "Interesse em processos ágeis e atuação direta na área de RH estratégico, triagem e gestão de talentos.",
  },
];

// Dados iniciais/exemplo de vagas publicadas com contagem de interessados
const VAGAS_EMPRESA_MOCK = [
  {
    id: "vaga_1",
    titulo: "Estagiário Desenvolvedor Mobile",
    status: "Ativa",
    totalInteressados: 8,
  },
  {
    id: "vaga_2",
    titulo: "Suporte Técnico & Redes",
    status: "Ativa",
    totalInteressados: 14,
  },
];

export default function EmpresaHomeScreen({ navigation }: any) {
  const [candidatos, setCandidatos] = useState(CANDIDATOS_MOCK);
  const [indexAtual, setIndexAtual] = useState(0);
  const [busca, setBusca] = useState("");

  // Modais
  const [modalLogoutVisible, setModalLogoutVisible] = useState(false);
  const [drawerPerfilVisible, setDrawerPerfilVisible] = useState(false);

  // Vagas da Empresa com interessados
  const [minhasVagas, setMinhasVagas] = useState(VAGAS_EMPRESA_MOCK);

  // Perfil da Empresa
  const [perfilEmpresa, setPerfilEmpresa] = useState({
    nomeFantasia: "Carregando...",
    email: "",
    tipoConta: "Empresa Parceira FATEC",
    statusRecrutamento: "Ativa para Seleção",
  });

  useEffect(() => {
    async function carregarDadosEmpresa() {
      const user = auth.currentUser;
      if (user) {
        try {
          // 1. Carrega dados cadastrais da empresa
          const docRef = doc(db, "usuarios", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setPerfilEmpresa({
              nomeFantasia:
                data.nomeFantasia || data.razaoSocial || "Empresa Parceira",
              email: data.email || user.email || "",
              tipoConta: "Empresa Parceira FATEC",
              statusRecrutamento: "Ativa para Seleção",
            });
          }

          // 2. Busca vagas publicadas por esta empresa no Firestore
          const vagasQuery = query(
            collection(db, "vagas"),
            where("empresaId", "==", user.uid)
          );
          const vagasSnap = await getDocs(vagasQuery);

          if (!vagasSnap.empty) {
            const listaVagas = vagasSnap.docs.map((d) => {
              const item = d.data();
              return {
                id: d.id,
                titulo: item.cargo || item.titulo || "Vaga de Estágio",
                status: item.status || "Ativa",
                // Lê array ou contador de interessados
                totalInteressados: item.interessados ? item.interessados.length : 0,
              };
            });
            setMinhasVagas(listaVagas);
          }
        } catch (error) {
          console.log("Erro ao carregar dados da empresa:", error);
        }
      }
    }

    carregarDadosEmpresa();
  }, []);

  const candidatoAtual = candidatos[indexAtual];

  const handleProximo = () => {
    if (indexAtual < candidatos.length - 1) {
      setIndexAtual(indexAtual + 1);
    } else {
      setIndexAtual(0);
    }
  };

  const handleEnviarProposta = () => {
    handleProximo();
  };

  const handleNaoInteresse = () => {
    handleProximo();
  };

  const handleConfirmarLogout = async () => {
    try {
      await signOut(auth);
      setModalLogoutVisible(false);
      navigation.replace("Login");
    } catch (error) {
      setModalLogoutVisible(false);
      navigation.replace("Login");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* HEADER SUPERIOR */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.profileAvatar}
            activeOpacity={0.8}
            onPress={() => setDrawerPerfilVisible(true)}
          >
            <Ionicons name="business" size={20} color="#5599FE" />
          </TouchableOpacity>

          {/* Barra de pesquisa compactada */}
          <View style={styles.searchBarContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Pesquisar competências..."
              placeholderTextColor="#888888"
              value={busca}
              onChangeText={setBusca}
            />
            <Ionicons name="search" size={18} color="#5599FE" />
          </View>

          {/* Notificações e Filtro no topo */}
          <View style={styles.headerRightActions}>
            <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.7}>
              <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.7}>
              <Ionicons name="filter" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ÁREA CENTRAL - CARD AZUL */}
        <View style={styles.cardArea}>
          {candidatoAtual ? (
            <View style={styles.outerBlueCard}>
              {/* Topo do Card: Foto Candidato + Nome / Idade / Curso */}
              <View style={styles.candidateHeaderCard}>
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoText}>FOTO{"\n"}PESSOA</Text>
                </View>

                <View style={styles.candidateInfoTop}>
                  <Text style={styles.candidateName}>
                    {candidatoAtual.nome.toUpperCase()}
                  </Text>
                  <Text style={styles.candidateAge}>
                    {candidatoAtual.idade.toUpperCase()}
                  </Text>
                  <Text style={styles.candidateCourse}>
                    {candidatoAtual.curso}
                  </Text>
                </View>
              </View>

              {/* Informações da Pessoa e Competências */}
              <View style={styles.candidateContentCard}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.scrollInfo}
                >
                  <Text style={styles.sectionTitle}>
                    INFORMAÇÕES DA PESSOA{"\n"}E COMPETÊNCIAS
                  </Text>

                  <Text style={styles.aboutText}>{candidatoAtual.sobre}</Text>

                  <Text style={styles.subSectionTitle}>Competências:</Text>
                  <View style={styles.skillsWrapper}>
                    {candidatoAtual.competencias.map((comp, idx) => (
                      <View key={idx} style={styles.skillBadge}>
                        <Text style={styles.skillBadgeText}>{comp}</Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* BOTÕES DE DECISÃO PROFISSIONAIS (X e CHECK) */}
              <View style={styles.decisionActionsWrapper}>
                {/* Botão Vermelho (Recusar / Próximo) */}
                <TouchableOpacity
                  style={[styles.actionButtonBox, styles.btnRejectBox]}
                  activeOpacity={0.75}
                  onPress={handleNaoInteresse}
                >
                  <Ionicons name="close" size={34} color="#D32F2F" />
                </TouchableOpacity>

                {/* Botão Verde (Check / Enviar Proposta) */}
                <TouchableOpacity
                  style={[styles.actionButtonBox, styles.btnAcceptBox]}
                  activeOpacity={0.75}
                  onPress={handleEnviarProposta}
                >
                  <Ionicons name="checkmark" size={34} color="#2E7D32" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={60} color="#5599FE" />
              <Text style={styles.emptyText}>Sem novos candidatos no momento!</Text>
            </View>
          )}
        </View>

        {/* BOTTOM NAVIGATION BAR */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} activeOpacity={0.7}>
            <View style={styles.navActiveIndicator}>
              <Ionicons name="home" size={22} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} activeOpacity={0.7}>
            <Ionicons name="people" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} activeOpacity={0.7}>
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} activeOpacity={0.7}>
            <Ionicons name="chatbubble-ellipses" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            activeOpacity={0.7}
            onPress={() => setModalLogoutVisible(true)}
          >
            <Ionicons name="log-out-outline" size={24} color="#FFD1D1" />
          </TouchableOpacity>
        </View>
      </View>

      {/* BARRA LATERAL (SIDE DRAWER DE PERFIL DA EMPRESA) */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={drawerPerfilVisible}
        onRequestClose={() => setDrawerPerfilVisible(false)}
      >
        <View style={styles.drawerOverlay}>
          {/* Fundo clicável à direita para fechar a barra */}
          <TouchableOpacity
            style={styles.drawerBackdrop}
            activeOpacity={1}
            onPress={() => setDrawerPerfilVisible(false)}
          />

          {/* Painel Lateral à esquerda */}
          <View style={styles.drawerContainer}>
            <ScrollView
              contentContainerStyle={styles.drawerScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Topo do Drawer com Logotipo */}
              <View style={styles.drawerHeader}>
                <View style={styles.drawerAvatar}>
                  <Ionicons name="business" size={44} color="#5599FE" />
                </View>
                <Text style={styles.drawerName}>
                  {perfilEmpresa.nomeFantasia.toUpperCase()}
                </Text>
                <Text style={styles.drawerEmail}>{perfilEmpresa.email}</Text>
              </View>

              <View style={styles.drawerDivider} />

              {/* Informações Cadastradas e Status */}
              <View style={styles.drawerSection}>
                <Text style={styles.drawerSectionTitle}>RESUMO INSTITUCIONAL</Text>

                <View style={styles.drawerInfoItem}>
                  <Text style={styles.drawerFieldLabel}>TIPO DE CONTA</Text>
                  <Text style={styles.drawerFieldValue}>
                    {perfilEmpresa.tipoConta}
                  </Text>
                </View>

                <View style={styles.drawerInfoItem}>
                  <Text style={styles.drawerFieldLabel}>STATUS DE RECRUTAMENTO</Text>
                  <Text style={styles.drawerFieldValue}>
                    {perfilEmpresa.statusRecrutamento}
                  </Text>
                </View>
              </View>

              <View style={styles.drawerDivider} />

              {/* SEÇÃO: VAGAS PUBLICADAS E INTERESSADOS */}
              <View style={styles.drawerSection}>
                <View style={styles.vagasHeaderRow}>
                  <Text style={styles.drawerSectionTitle}>VAGAS PUBLICADAS</Text>
                  <View style={styles.totalBadge}>
                    <Text style={styles.totalBadgeText}>
                      {minhasVagas.length}
                    </Text>
                  </View>
                </View>

                {minhasVagas.length > 0 ? (
                  minhasVagas.map((vaga) => (
                    <View key={vaga.id} style={styles.vagaCardCompact}>
                      <View style={styles.vagaInfoCol}>
                        <Text style={styles.vagaTituloText} numberOfLines={1}>
                          {vaga.titulo}
                        </Text>
                        <Text style={styles.vagaStatusText}>• {vaga.status}</Text>
                      </View>

                      {/* Contador de Alunos Interessados */}
                      <View style={styles.interessadosBox}>
                        <Ionicons name="people" size={14} color="#2E7D32" />
                        <Text style={styles.interessadosNum}>
                          {vaga.totalInteressados}
                        </Text>
                        <Text style={styles.interessadosLabel}>interessados</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyVagasText}>
                    Nenhuma vaga publicada no momento.
                  </Text>
                )}
              </View>
            </ScrollView>

            {/* Ações no Rodapé da Barra Lateral */}
            <View style={styles.drawerFooter}>
              {/* Botão Ver Como Aluno Vê */}
              <TouchableOpacity
                style={styles.btnVerPerfil}
                activeOpacity={0.8}
                onPress={() => {
                  setDrawerPerfilVisible(false);
                }}
              >
                <Ionicons
                  name="eye-outline"
                  size={18}
                  color="#FFFFFF"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.btnVerPerfilText}>
                  VER MEU PERFIL (ALUNOS)
                </Text>
              </TouchableOpacity>

              {/* Botão Atualizar Informações */}
              <TouchableOpacity
                style={styles.btnAtualizarInfo}
                activeOpacity={0.8}
                onPress={() => {
                  setDrawerPerfilVisible(false);
                }}
              >
                <Ionicons
                  name="create-outline"
                  size={16}
                  color="#5599FE"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.btnAtualizarInfoText}>
                  ATUALIZAR INFORMAÇÕES
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* POP-UP MODAL DE CONFIRMAÇÃO DE LOGOUT */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalLogoutVisible}
        onRequestClose={() => setModalLogoutVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalIconHeader}>
              <Ionicons name="exit-outline" size={32} color="#5599FE" />
            </View>
            <Text style={styles.modalTitle}>Deseja sair da sua conta?</Text>
            <Text style={styles.modalMessage}>
              Você voltará para a tela de login inicial do FateLink.
            </Text>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.btnCancelarLogout}
                activeOpacity={0.8}
                onPress={() => setModalLogoutVisible(false)}
              >
                <Text style={styles.btnCancelarLogoutText}>CANCELAR</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnConfirmarLogout}
                activeOpacity={0.8}
                onPress={handleConfirmarLogout}
              >
                <Text style={styles.btnConfirmarLogoutText}>SIM</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#5599FE",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  // HEADER
  header: {
    backgroundColor: "#5599FE",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  profileAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    alignItems: "center",
    paddingHorizontal: 12,
    height: 36,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: "#333333",
    paddingRight: 6,
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerIconButton: {
    padding: 4,
  },

  // ÁREA DO CARD
  cardArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  outerBlueCard: {
    width: "88%",
    height: "98%",
    backgroundColor: "#5599FE",
    borderRadius: 36,
    padding: 14,
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },

  // TOPO DO CARD CANDIDATO
  candidateHeaderCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    flexDirection: "row",
    padding: 10,
    alignItems: "center",
  },
  photoPlaceholder: {
    width: 74,
    height: 64,
    backgroundColor: "#C4C4C4",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  photoText: {
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center",
    color: "#000000",
  },
  candidateInfoTop: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  candidateName: {
    fontSize: 13,
    fontWeight: "900",
    color: "#000000",
    textDecorationLine: "underline",
  },
  candidateAge: {
    fontSize: 11,
    fontWeight: "800",
    color: "#000000",
    textDecorationLine: "underline",
    marginTop: 2,
  },
  candidateCourse: {
    fontSize: 11,
    fontWeight: "700",
    color: "#555555",
    marginTop: 3,
  },

  // CONTEÚDO E COMPETÊNCIAS
  candidateContentCard: {
    width: "100%",
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    marginVertical: 10,
    padding: 12,
  },
  scrollInfo: {
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#000000",
    textDecorationLine: "underline",
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 16,
  },
  aboutText: {
    fontSize: 11.5,
    color: "#444444",
    lineHeight: 16,
    textAlign: "center",
    marginBottom: 10,
  },
  subSectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#000000",
    marginBottom: 6,
    alignSelf: "flex-start",
  },
  skillsWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
  },
  skillBadge: {
    backgroundColor: "#E8F0FE",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  skillBadgeText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#1A73E8",
  },

  // BOTÕES QUADRADOS (X e CHECK)
  decisionActionsWrapper: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    gap: 28,
    paddingVertical: 6,
  },
  actionButtonBox: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  btnRejectBox: {
    borderColor: "#D32F2F",
  },
  btnAcceptBox: {
    borderColor: "#2E7D32",
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#555555",
    marginTop: 12,
  },

  // BOTTOM NAVIGATION
  bottomNav: {
    backgroundColor: "#5599FE",
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 44,
  },
  navActiveIndicator: {
    backgroundColor: "rgba(0,0,0,0.15)",
    padding: 6,
    borderRadius: 14,
  },

  // BARRA LATERAL (DRAWER)
  drawerOverlay: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  drawerBackdrop: {
    flex: 1,
  },
  drawerContainer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: width * 0.82,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 16,
    justifyContent: "space-between",
  },
  drawerScrollContent: {
    paddingHorizontal: 18,
    paddingTop: 48,
    paddingBottom: 20,
  },
  drawerHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  drawerAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E8F0FE",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#5599FE",
    marginBottom: 12,
  },
  drawerName: {
    fontSize: 15,
    fontWeight: "900",
    color: "#000000",
    textAlign: "center",
  },
  drawerEmail: {
    fontSize: 12,
    color: "#666666",
    fontWeight: "600",
    marginTop: 2,
    textAlign: "center",
  },
  drawerDivider: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginVertical: 14,
  },
  drawerSection: {
    marginTop: 4,
  },
  drawerSectionTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: "#5599FE",
    letterSpacing: 0.8,
    marginBottom: 12,
    textDecorationLine: "underline",
  },
  vagasHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  totalBadge: {
    backgroundColor: "#E8F0FE",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  totalBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#5599FE",
  },
  drawerInfoItem: {
    marginBottom: 14,
  },
  drawerFieldLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#888888",
    marginBottom: 3,
    letterSpacing: 0.4,
  },
  drawerFieldValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#222222",
  },

  // CARD COMPACTO DE VAGA NA BARRA LATERAL
  vagaCardCompact: {
    backgroundColor: "#F7F9FC",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E8EEF5",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  vagaInfoCol: {
    flex: 1,
    paddingRight: 8,
  },
  vagaTituloText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#222222",
  },
  vagaStatusText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#2E7D32",
    marginTop: 3,
  },
  interessadosBox: {
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  interessadosNum: {
    fontSize: 12,
    fontWeight: "900",
    color: "#2E7D32",
    marginTop: 1,
  },
  interessadosLabel: {
    fontSize: 8.5,
    fontWeight: "700",
    color: "#2E7D32",
  },
  emptyVagasText: {
    fontSize: 11.5,
    color: "#777777",
    fontStyle: "italic",
    textAlign: "center",
    marginVertical: 10,
  },

  drawerFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    backgroundColor: "#FAFAFA",
    gap: 8,
  },
  btnVerPerfil: {
    backgroundColor: "#5599FE",
    height: 42,
    borderRadius: 21,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  btnVerPerfilText: {
    color: "#FFFFFF",
    fontSize: 11.5,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  btnAtualizarInfo: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#5599FE",
    height: 40,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  btnAtualizarInfoText: {
    color: "#5599FE",
    fontSize: 11.5,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  // MODAL LOGOUT
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalBox: {
    width: "85%",
    maxWidth: 340,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: "center",
    elevation: 6,
  },
  modalIconHeader: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E8F0FE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#000000",
    textAlign: "center",
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 12.5,
    color: "#555555",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
    fontWeight: "600",
  },
  modalButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 12,
  },
  btnCancelarLogout: {
    flex: 1,
    backgroundColor: "#ECECEC",
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: "center",
  },
  btnCancelarLogoutText: {
    color: "#333333",
    fontWeight: "800",
    fontSize: 12,
  },
  btnConfirmarLogout: {
    flex: 1,
    backgroundColor: "#E53935",
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: "center",
  },
  btnConfirmarLogoutText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 12,
  },
});