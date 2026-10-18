import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

// Firebase imports
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../service/firebaseConfig";

const { width } = Dimensions.get("window");

// =====================================================
// MÁSCARAS
// =====================================================
function maskCPF(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function maskCNPJ(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function maskPhone(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/^(\d{2})(\d)/g, "($1) $2")
    .replace(/(\d{5})(\d{4})$/, "$1-$2");
}

export default function RegisterScreen({ navigation }: any) {
  const [userType, setUserType] = useState<"aluno" | "empresa">("aluno");

  // Aluno
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");

  // Empresa
  const [razaoSocial, setRazaoSocial] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [cnpj, setCnpj] = useState("");

  // Comuns
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  // Loading
  const [carregando, setCarregando] = useState(false);

  // Controle de visibilidade das senhas
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  // Pop-up apenas para validação geral ou sucesso
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // =====================================================
  // REGRAS DA SENHA
  // =====================================================
  const hasEightCharacters = senha.length >= 8;
  const hasUppercase = /[A-Z]/.test(senha);
  const hasNumber = /\d/.test(senha);
  const hasSymbol = /[^A-Za-z\d]/.test(senha);

  const passwordScore = [
    hasEightCharacters,
    hasUppercase,
    hasNumber,
    hasSymbol,
  ].filter(Boolean).length;

  const getPasswordStrength = () => {
    if (!senha) {
      return {
        level: 0,
        text: "",
        color: "transparent",
      };
    }

    if (passwordScore <= 1) {
      return {
        level: 1,
        text: "Senha fraca (mínimo 8 caracteres, maiúscula, número e símbolo)",
        color: "#E53935",
      };
    }

    if (passwordScore <= 3) {
      return {
        level: 2,
        text: "Senha média",
        color: "#F58427",
      };
    }

    return {
      level: 3,
      text: "Senha forte",
      color: "#43A047",
    };
  };

  const strength = getPasswordStrength();

  // Status da confirmação de senha
  const isMatch =
    senha.length > 0 && confirmarSenha.length > 0 && senha === confirmarSenha;
  const isMismatch = confirmarSenha.length > 0 && senha !== confirmarSenha;

  const showAlert = (title: string, message: string, success = false) => {
    setModalTitle(title);
    setModalMessage(message);
    setIsSuccess(success);
    setModalVisible(true);
  };

  const handleCadastrar = async () => {
    if (userType === "aluno") {
      if (nome.trim().length < 8) {
        return showAlert(
          "Nome inválido",
          "Por gentileza, verifique seu nome completo (mínimo 8 caracteres).",
        );
      }
      if (cpf.replace(/\D/g, "").length !== 11) {
        return showAlert(
          "CPF incompleto",
          "Por gentileza, verifique seu CPF (11 dígitos).",
        );
      }
    } else {
      if (razaoSocial.trim().length < 5) {
        return showAlert(
          "Razão Social",
          "Por gentileza, verifique a Razão Social da empresa.",
        );
      }
      if (nomeFantasia.trim().length < 3) {
        return showAlert(
          "Nome Fantasia",
          "Por gentileza, verifique o Nome Fantasia da empresa.",
        );
      }
      if (cnpj.replace(/\D/g, "").length !== 14) {
        return showAlert(
          "CNPJ incompleto",
          "Por gentileza, verifique o CNPJ informado.",
        );
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return showAlert(
        "E-mail inválido",
        "Por gentileza, insira um endereço de e-mail válido.",
      );
    }

    if (telefone.replace(/\D/g, "").length < 10) {
      return showAlert(
        "Telefone incompleto",
        "Por gentileza, preencha seu telefone com DDD.",
      );
    }

    if (!hasEightCharacters || !hasUppercase || !hasNumber || !hasSymbol) {
      return showAlert(
        "Senha fraca",
        "A senha precisa conter no mínimo 8 caracteres, letra maiúscula, número e caractere especial.",
      );
    }

    if (senha !== confirmarSenha) {
      return showAlert(
        "Senhas divergentes",
        "As senhas informadas não coincidem.",
      );
    }

    try {
      setCarregando(true);

      // 1. Cria a conta no Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        senha,
      );
      const uid = userCredential.user.uid;

      // 2. Monta o objeto correspondente ao tipo de perfil
      const userData =
        userType === "aluno"
          ? {
              uid,
              tipo: "aluno",
              nome: nome.trim(),
              cpf: cpf.replace(/\D/g, ""),
              email: email.trim().toLowerCase(),
              telefone: telefone.replace(/\D/g, ""),
              curriculoUrl: "",
              criadoEm: new Date().toISOString(),
            }
          : {
              uid,
              tipo: "empresa",
              razaoSocial: razaoSocial.trim(),
              nomeFantasia: nomeFantasia.trim(),
              cnpj: cnpj.replace(/\D/g, ""),
              email: email.trim().toLowerCase(),
              telefone: telefone.replace(/\D/g, ""),
              criadoEm: new Date().toISOString(),
            };

      // 3. Salva no Cloud Firestore na coleção "usuarios"
      await setDoc(doc(db, "usuarios", uid), userData);

      setCarregando(false);
      showAlert(
        "Sucesso!",
        "Cadastro realizado com sucesso! Redirecionando para o login...",
        true,
      );

      setTimeout(() => {
        setModalVisible(false);
        navigation.replace("Login");
      }, 2200);
    } catch (error: any) {
      setCarregando(false);

      if (error.code === "auth/email-already-in-use") {
        return showAlert(
          "E-mail já cadastrado",
          "Já existe uma conta cadastrada com este endereço de e-mail.",
        );
      }
      if (error.code === "auth/invalid-email") {
        return showAlert("E-mail inválido", "O formato do e-mail é inválido.");
      }
      if (error.code === "auth/network-request-failed") {
        return showAlert(
          "Falha de conexão",
          "Verifique sua conexão com a internet.",
        );
      }

      return showAlert(
        "Erro no cadastro",
        error.message ||
          "Ocorreu um erro ao realizar o cadastro. Tente novamente.",
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logotipo */}
        <View style={styles.headerLogoContainer}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Card Central */}
        <View style={styles.cardContainer}>
          {/* Seletor EMPRESA / ALUNO */}
          <View style={styles.toggleContainer}>
            <View style={styles.toggleOptions}>
              {/* Opção Empresa */}
              <TouchableOpacity
                style={styles.toggleItem}
                onPress={() => setUserType("empresa")}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.toggleCircle,
                    userType === "empresa" && styles.toggleCircleActive,
                  ]}
                />
                <Text
                  style={[
                    styles.toggleLabel,
                    userType === "empresa" && styles.toggleLabelActive,
                  ]}
                >
                  EMPRESA
                </Text>
              </TouchableOpacity>

              {/* Opção Aluno */}
              <TouchableOpacity
                style={styles.toggleItem}
                onPress={() => setUserType("aluno")}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.toggleCircle,
                    userType === "aluno" && styles.toggleCircleActive,
                  ]}
                />
                <Text
                  style={[
                    styles.toggleLabel,
                    userType === "aluno" && styles.toggleLabelActive,
                  ]}
                >
                  ALUNO
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* CAMPOS DINÂMICOS */}
          {userType === "aluno" ? (
            <>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="NOME COMPLETO"
                  placeholderTextColor="#A0A0A0"
                  value={nome}
                  onChangeText={setNome}
                />
              </View>

              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="CPF"
                  placeholderTextColor="#A0A0A0"
                  keyboardType="numeric"
                  value={cpf}
                  onChangeText={(val) => setCpf(maskCPF(val))}
                  maxLength={14}
                />
              </View>
            </>
          ) : (
            <>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="RAZÃO SOCIAL"
                  placeholderTextColor="#A0A0A0"
                  value={razaoSocial}
                  onChangeText={setRazaoSocial}
                />
              </View>

              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="NOME FANTASIA"
                  placeholderTextColor="#A0A0A0"
                  value={nomeFantasia}
                  onChangeText={setNomeFantasia}
                />
              </View>

              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="CNPJ"
                  placeholderTextColor="#A0A0A0"
                  keyboardType="numeric"
                  value={cnpj}
                  onChangeText={(val) => setCnpj(maskCNPJ(val))}
                  maxLength={18}
                />
              </View>
            </>
          )}

          {/* E-MAIL */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="E-MAIL"
              placeholderTextColor="#A0A0A0"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* TELEFONE */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="TELEFONE"
              placeholderTextColor="#A0A0A0"
              keyboardType="phone-pad"
              value={telefone}
              onChangeText={(val) => setTelefone(maskPhone(val))}
              maxLength={15}
            />
          </View>

          {/* SENHA (COM OLINHO E BORDA DINÂMICA) */}
          <View
            style={[
              styles.inputWrapper,
              styles.passwordWrapper,
              senha.length > 0 && {
                borderColor: strength.color,
                borderWidth: 2,
              },
            ]}
          >
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="SENHA"
              placeholderTextColor="#A0A0A0"
              secureTextEntry={!mostrarSenha}
              value={senha}
              onChangeText={setSenha}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              activeOpacity={0.7}
              onPress={() => setMostrarSenha(!mostrarSenha)}
            >
              <Ionicons
                name={mostrarSenha ? "eye" : "eye-off"}
                size={20}
                color="#777777"
              />
            </TouchableOpacity>
          </View>
          {senha.length > 0 && (
            <Text
              style={[styles.fieldIndicatorText, { color: strength.color }]}
            >
              {strength.text}
            </Text>
          )}

          {/* CONFIRMAR SENHA (COM OLINHO E BORDA DINÂMICA) */}
          <View
            style={[
              styles.inputWrapper,
              styles.passwordWrapper,
              isMatch && { borderColor: "#43A047", borderWidth: 2 },
              isMismatch && { borderColor: "#E53935", borderWidth: 2 },
            ]}
          >
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="CONFIRMAR SENHA"
              placeholderTextColor="#A0A0A0"
              secureTextEntry={!mostrarConfirmarSenha}
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              activeOpacity={0.7}
              onPress={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
            >
              <Ionicons
                name={mostrarConfirmarSenha ? "eye" : "eye-off"}
                size={20}
                color="#777777"
              />
            </TouchableOpacity>
          </View>
          {confirmarSenha.length > 0 && (
            <Text
              style={[
                styles.fieldIndicatorText,
                { color: isMatch ? "#43A047" : "#E53935" },
              ]}
            >
              {isMatch
                ? "✓ As senhas são idênticas"
                : "✕ As senhas não coincidem"}
            </Text>
          )}

          {/* BOTÃO CADASTRAR */}
          <TouchableOpacity
            style={styles.btnCadastrar}
            activeOpacity={0.8}
            onPress={handleCadastrar}
            disabled={carregando}
          >
            {carregando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.btnCadastrarText}>CADASTRAR</Text>
            )}
          </TouchableOpacity>

          {/* LINK VOLTAR LOGIN */}
          <Text style={styles.jaTemContaText}>Já tem uma conta?</Text>
          <TouchableOpacity
            style={styles.btnVoltarLogin}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.btnVoltarLoginText}>ENTRE EM SUA CONTA</Text>
          </TouchableOpacity>
        </View>

        {/* Rodapé */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerFrom}>From</Text>
          <Text style={styles.footerNames}>
            Bruno, Hugo, Kaique, Rafael e Victor
          </Text>
        </View>
      </ScrollView>

      {/* MODAL / POP-UP */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          if (!isSuccess) setModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text
              style={[
                styles.modalTitle,
                isSuccess ? styles.modalSuccessTitle : styles.modalAlertTitle,
              ]}
            >
              {modalTitle}
            </Text>
            <Text style={styles.modalMessage}>{modalMessage}</Text>

            {!isSuccess && (
              <TouchableOpacity
                style={styles.modalButton}
                activeOpacity={0.8}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>OK</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#D9D9D9",
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 36,
  },
  headerLogoContainer: {
    marginTop: 10,
    marginBottom: 16,
    alignItems: "center",
  },
  logoImage: {
    width: width * 0.65,
    height: 75,
  },
  cardContainer: {
    width: "88%",
    backgroundColor: "#FFFFFF",
    borderRadius: 40,
    paddingVertical: 26,
    paddingHorizontal: 22,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },

  // SELETOR EMPRESA / ALUNO
  toggleContainer: {
    width: "80%",
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleOptions: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-around",
    alignItems: "center",
  },
  toggleItem: {
    alignItems: "center",
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#BEBEBE",
    marginBottom: 6,
  },
  toggleCircleActive: {
    backgroundColor: "#5599FE",
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: "900",
    color: "#777777",
    textDecorationLine: "underline",
    letterSpacing: 0.5,
  },
  toggleLabelActive: {
    color: "#000000",
  },

  // CAMPOS DE INPUT
  inputWrapper: {
    width: "100%",
    backgroundColor: "#ECECEC",
    borderRadius: 30,
    height: 48,
    justifyContent: "center",
    marginBottom: 12,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: "transparent",
  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  passwordInput: {
    flex: 1,
    paddingRight: 30,
  },
  eyeButton: {
    position: "absolute",
    right: 16,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    fontSize: 13,
    fontWeight: "700",
    color: "#333333",
    textAlign: "center",
    width: "100%",
    height: "100%",
    ...Platform.select({
      web: {
        outlineStyle: "none" as any,
      },
    }),
  },
  fieldIndicatorText: {
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
    marginTop: -8,
    marginBottom: 10,
  },

  // BOTÕES
  btnCadastrar: {
    width: "60%",
    backgroundColor: "#5599FE",
    borderRadius: 30,
    height: 46,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  btnCadastrarText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    textDecorationLine: "underline",
    letterSpacing: 0.5,
  },
  jaTemContaText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#000000",
    textDecorationLine: "underline",
    marginTop: 6,
    marginBottom: 10,
  },
  btnVoltarLogin: {
    width: "90%",
    backgroundColor: "#ECECEC",
    borderRadius: 30,
    height: 46,
    justifyContent: "center",
    alignItems: "center",
  },
  btnVoltarLoginText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#000000",
    textDecorationLine: "underline",
    letterSpacing: 0.5,
  },

  // RODAPÉ
  footerContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  footerFrom: {
    fontSize: 12,
    fontWeight: "700",
    color: "#083B66",
    textDecorationLine: "underline",
    marginBottom: 2,
  },
  footerNames: {
    fontSize: 11,
    fontWeight: "700",
    color: "#000000",
    letterSpacing: 0.3,
  },

  // MODAL / POP-UP
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalBox: {
    width: "85%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    elevation: 6,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 10,
    textAlign: "center",
  },
  modalAlertTitle: {
    color: "#D32F2F",
  },
  modalSuccessTitle: {
    color: "#2E7D32",
  },
  modalMessage: {
    fontSize: 13,
    color: "#444444",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
    fontWeight: "600",
  },
  modalButton: {
    backgroundColor: "#5599FE",
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 20,
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 13,
  },
});
