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
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "../service/firebaseConfig";
import ModalEditarPerfilAluno from "./components/ModalEditarPerfilAluno";

const { width } = Dimensions.get("window");

const VAGAS_MOCK = [
  {
    id: "1",
    empresa: "TECH INOVAÇÕES",
    cargo: "Estagiário Desenvolvedor Mobile",
    local: "Remoto / Híbrido",
    salario: "R$ 1.800,00 + Benefícios",
    requisitos: [
      "React Native",
      "TypeScript",
      "Consumo de APIs REST",
      "Conhecimento em Git",
    ],
    descricao:
      "Estamos em busca de um estudante com vontade de aprender e construir produtos mobile do zero ao lado do time de engenharia.",
  },
  {
    id: "2",
    empresa: "AGROCONECTA",
    cargo: "Suporte Técnico & Infraestrutura",
    local: "Fernandópolis - SP",
    salario: "R$ 1.600,00",
    requisitos: [
      "Configuração de Redes",
      "Roteadores e Switches",
      "Suporte a Usuários",
      "Hardware básico",
    ],
    descricao:
      "Vaga presencial voltada para alunos de tecnologia que queiram atuar diretamente na gestão de redes, equipamentos e suporte ao cliente.",
  },
];

const CANDIDATURAS_ALUNO_MOCK = [
  {
    id: "cand_1",
    cargo: "Estagiário Desenvolvedor Mobile",
    empresa: "Tech Inovações",
    status: "Em análise",
  },
  {
    id: "cand_2",
    cargo: "Suporte Técnico & Infraestrutura",
    empresa: "AgroConecta",
    status: "Enviado",
  },
];

export default function AlunoHomeScreen({ navigation }: any) {
  const [vagas, setVagas] = useState(VAGAS_MOCK);
  const [indexAtual, setIndexAtual] = useState(0);
  const [busca, setBusca] = useState("");

  // Modais
  const [modalLogoutVisible, setModalLogoutVisible] = useState(false);
  const [drawerPerfilVisible, setDrawerPerfilVisible] = useState(false);
  const [modalEditarPerfilVisible, setModalEditarPerfilVisible] =
    useState(false);

  // Candidaturas do aluno
  const [minhasCandidaturas, setMinhasCandidaturas] = useState(
    CANDIDATURAS_ALUNO_MOCK,
  );

  // Perfil do Aluno
  const [perfilAluno, setPerfilAluno] = useState({
    nome: "Carregando...",
    email: "",
    formacao: "Sistemas para Internet - FATEC",
    areaPretendida: "Desenvolvimento Mobile & Web",
  });

  const carregarDadosAluno = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        const docRef = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setPerfilAluno({
            nome: data.nome || "Aluno Fatec",
            email: data.email || user.email || "",
            formacao: data.curso
              ? `${data.curso} - FATEC`
              : "Sistemas para Internet - FATEC",
            areaPretendida:
              data.areaPretendida ||
              data.experiencias ||
              "Desenvolvimento de Software / TI",
          });
        }

        const candQuery = query(
          collection(db, "candidaturas"),
          where("alunoId", "==", user.uid),
        );
        const candSnap = await getDocs(candQuery);

        if (!candSnap.empty) {
          const lista = candSnap.docs.map((d) => {
            const item = d.data();
            return {
              id: d.id,
              cargo: item.cargo || "Estágio",
              empresa: item.empresa || "Empresa Parceira",
              status: item.status || "Em análise",
            };
          });
          setMinhasCandidaturas(lista);
        }
      } catch (error) {
        console.log("Erro ao carregar dados do aluno:", error);
      }
    }
  };

  useEffect(() => {
    carregarDadosAluno();
  }, []);

  const vagaAtual = vagas[indexAtual];

  const handleProximo = () => {
    if (indexAtual < vagas.length - 1) {
      setIndexAtual(indexAtual + 1);
    } else {
      setIndexAtual(0);
    }
  };

  const handleTenhoInteresse = () => {
    if (vagaAtual) {
      const novaCandidatura = {
        id: `cand_${Date.now()}`,
        cargo: vagaAtual.cargo,
        empresa: vagaAtual.empresa,
        status: "Enviado",
      };
      setMinhasCandidaturas((prev) => [novaCandidatura, ...prev]);
    }
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
            <Ionicons name="person" size={20} color="#5599FE" />
          </TouchableOpacity>

          <View style={styles.searchBarContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar vagas ou empresas..."
              placeholderTextColor="#888888"
              value={busca}
              onChangeText={setBusca}
            />
            <Ionicons name="search" size={18} color="#5599FE" />
          </View>

          <View style={styles.headerRightActions}>
            <TouchableOpacity
              style={styles.headerIconButton}
              activeOpacity={0.7}
            >
              <Ionicons
                name="notifications-outline"
                size={22}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerIconButton}
              activeOpacity={0.7}
            >
              <Ionicons name="filter" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ÁREA CENTRAL - CARD AZUL */}
        <View style={styles.cardArea}>
          {vagaAtual ? (
            <View style={styles.outerBlueCard}>
              <View style={styles.companyHeaderWrapper}>
                <View style={styles.photoBox}>
                  <Text style={styles.photoText}>FOTO{"\n"}EMPRESA</Text>
                </View>

                <View style={styles.companyNameBox}>
                  <Text style={styles.companyTitleLabel}>NOME FANTASIA</Text>
                  <Text style={styles.companyNameText}>
                    {vagaAtual.empresa}
                  </Text>
                </View>
              </View>

              <View style={styles.contentCard}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.scrollInfo}
                >
                  <Text style={styles.sectionTitle}>
                    INFORMAÇÕES SOBRE{"\n"}A EMPRESA / VAGA
                  </Text>

                  <Text style={styles.cargoText}>{vagaAtual.cargo}</Text>
                  <Text style={styles.infoHighlight}>
                    📍 {vagaAtual.local} | 💰 {vagaAtual.salario}
                  </Text>

                  <Text style={styles.descriptionText}>
                    {vagaAtual.descricao}
                  </Text>

                  <Text style={styles.subSectionTitle}>Requisitos:</Text>
                  <View style={styles.skillsWrapper}>
                    {vagaAtual.requisitos.map((req, idx) => (
                      <View key={idx} style={styles.skillBadge}>
                        <Text style={styles.skillBadgeText}>{req}</Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* BOTÕES QUADRADOS DE DECISÃO (X e CHECK) */}
              <View style={styles.decisionActionsWrapper}>
                <TouchableOpacity
                  style={[styles.actionButtonBox, styles.btnRejectBox]}
                  activeOpacity={0.75}
                  onPress={handleNaoInteresse}
                >
                  <Ionicons name="close" size={34} color="#D32F2F" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButtonBox, styles.btnAcceptBox]}
                  activeOpacity={0.75}
                  onPress={handleTenhoInteresse}
                >
                  <Ionicons name="checkmark" size={34} color="#2E7D32" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="briefcase-outline" size={60} color="#5599FE" />
              <Text style={styles.emptyText}>Sem novas vagas no momento!</Text>
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
            <Ionicons name="briefcase" size={22} color="#FFFFFF" />
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

      {/* BARRA LATERAL (SIDE DRAWER DE PERFIL DO ALUNO) */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={drawerPerfilVisible}
        onRequestClose={() => setDrawerPerfilVisible(false)}
      >
        <View style={styles.drawerOverlay}>
          <TouchableOpacity
            style={styles.drawerBackdrop}
            activeOpacity={1}
            onPress={() => setDrawerPerfilVisible(false)}
          />

          <View style={styles.drawerContainer}>
            <ScrollView
              contentContainerStyle={styles.drawerScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.drawerHeader}>
                <View style={styles.drawerAvatar}>
                  <Ionicons name="person" size={44} color="#5599FE" />
                </View>
                <Text style={styles.drawerName}>
                  {perfilAluno.nome.toUpperCase()}
                </Text>
                <Text style={styles.drawerEmail}>{perfilAluno.email}</Text>
              </View>

              <View style={styles.drawerDivider} />

              <View style={styles.drawerSection}>
                <Text style={styles.drawerSectionTitle}>
                  INFORMAÇÕES PESSOAIS
                </Text>

                <View style={styles.drawerInfoItem}>
                  <Text style={styles.drawerFieldLabel}>
                    FORMAÇÃO ACADÊMICA
                  </Text>
                  <Text style={styles.drawerFieldValue}>
                    {perfilAluno.formacao}
                  </Text>
                </View>

                <View style={styles.drawerInfoItem}>
                  <Text style={styles.drawerFieldLabel}>ÁREA PRETENDIDA</Text>
                  <Text style={styles.drawerFieldValue}>
                    {perfilAluno.areaPretendida}
                  </Text>
                </View>
              </View>

              <View style={styles.drawerDivider} />

              {/* LISTA COMPACTA DE CANDIDATURAS */}
              <View style={styles.drawerSection}>
                <View style={styles.candidaturasHeaderRow}>
                  <Text style={styles.drawerSectionTitle}>
                    MINHAS CANDIDATURAS
                  </Text>
                  <View style={styles.totalBadge}>
                    <Text style={styles.totalBadgeText}>
                      {minhasCandidaturas.length}
                    </Text>
                  </View>
                </View>

                {minhasCandidaturas.length > 0 ? (
                  minhasCandidaturas.map((cand) => (
                    <View key={cand.id} style={styles.candidaturaCardCompact}>
                      <View style={styles.candInfoCol}>
                        <Text style={styles.candCargoText} numberOfLines={1}>
                          {cand.cargo}
                        </Text>
                        <Text style={styles.candEmpresaText} numberOfLines={1}>
                          🏢 {cand.empresa}
                        </Text>
                      </View>

                      <View style={styles.statusBox}>
                        <Text style={styles.statusLabel}>{cand.status}</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyCandidaturasText}>
                    Você ainda não se candidatou a nenhuma vaga.
                  </Text>
                )}
              </View>
            </ScrollView>

            {/* BOTÕES DO RODAPÉ DA BARRA LATERAL */}
            <View style={styles.drawerFooter}>
              <TouchableOpacity
                style={styles.btnVerPerfil}
                activeOpacity={0.8}
                onPress={() => setDrawerPerfilVisible(false)}
              >
                <Ionicons
                  name="eye-outline"
                  size={18}
                  color="#FFFFFF"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.btnVerPerfilText}>
                  VER MEU PERFIL (EMPRESAS)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnAtualizarInfo}
                activeOpacity={0.8}
                onPress={() => {
                  setDrawerPerfilVisible(false);
                  setModalEditarPerfilVisible(true);
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

      {/* MODAL EDITAR PERFIL DO ALUNO (COMPONENTE EXTERNO) */}
      <ModalEditarPerfilAluno
        visible={modalEditarPerfilVisible}
        onClose={() => setModalEditarPerfilVisible(false)}
        onPerfilAtualizado={carregarDadosAluno}
      />

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

  // ÁREA DO CARD DE VAGA
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

  companyHeaderWrapper: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    gap: 12,
  },
  photoBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    height: 64,
    justifyContent: "center",
    alignItems: "center",
  },
  photoText: {
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center",
    color: "#000000",
    textDecorationLine: "underline",
  },
  companyNameBox: {
    flex: 1.4,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    height: 64,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  companyTitleLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: "#000000",
    textDecorationLine: "underline",
  },
  companyNameText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#333333",
    marginTop: 2,
    textAlign: "center",
  },

  contentCard: {
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
  cargoText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#000000",
    marginBottom: 3,
    textAlign: "center",
  },
  infoHighlight: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1A73E8",
    marginBottom: 8,
    textAlign: "center",
  },
  descriptionText: {
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

  // CANDIDATURAS COMPACTAS NA BARRA LATERAL
  candidaturasHeaderRow: {
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
  candidaturaCardCompact: {
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
  candInfoCol: {
    flex: 1,
    paddingRight: 8,
  },
  candCargoText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#222222",
  },
  candEmpresaText: {
    fontSize: 10.5,
    fontWeight: "600",
    color: "#666666",
    marginTop: 2,
  },
  statusBox: {
    backgroundColor: "#E8F0FE",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusLabel: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#1A73E8",
  },
  emptyCandidaturasText: {
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
