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
import { signInWithEmailAndPassword } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "../service/firebaseConfig";

const { width } = Dimensions.get("window");

// Máscara dinâmica: E-mail livre ou formatação automática de CPF / CNPJ
function formatIdentificador(value: string) {
  if (/[a-zA-Z@]/.test(value)) {
    return value;
  }

  const digits = value.replace(/\D/g, "");

  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  return digits
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export default function LoginScreen({ navigation }: any) {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);

  // Estados do Modal de Alerta
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  const showAlert = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleLogin = async () => {
    const termo = usuario.trim();

    if (!termo) {
      return showAlert(
        "Campo obrigatório",
        "Por favor, introduza o seu E-mail, CPF ou CNPJ.",
      );
    }

    if (!senha) {
      return showAlert(
        "Campo obrigatório",
        "Por favor, introduza a sua palavra-passe.",
      );
    }

    try {
      setCarregando(true);

      let emailFinal = termo.toLowerCase();
      const apenasDigitos = termo.replace(/\D/g, "");

      // Se não contiver '@', realiza a consulta por CPF ou CNPJ no Firestore
      if (!termo.includes("@")) {
        let q;

        if (apenasDigitos.length === 11) {
          // Consulta aluno pelo CPF
          q = query(
            collection(db, "usuarios"),
            where("cpf", "==", apenasDigitos),
          );
        } else if (apenasDigitos.length === 14) {
          // Consulta empresa pelo CNPJ
          q = query(
            collection(db, "usuarios"),
            where("cnpj", "==", apenasDigitos),
          );
        } else {
          setCarregando(false);
          return showAlert(
            "Identificador inválido",
            "Introduza um e-mail válido, um CPF com 11 dígitos ou um CNPJ com 14 dígitos.",
          );
        }

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setCarregando(false);
          return showAlert(
            "Registo não encontrado",
            "Nenhum utilizador encontrado com este CPF/CNPJ.",
          );
        }

        const usuarioDoc = querySnapshot.docs[0].data();
        emailFinal = usuarioDoc.email;
      }

      // 1. Autenticação através do Firebase Auth utilizando o e-mail resolvido
      const userCredential = await signInWithEmailAndPassword(
        auth,
        emailFinal,
        senha,
      );

      const uid = userCredential.user.uid;

      // 2. Consulta do perfil na coleção "usuarios" para leitura do campo "tipo"
      const userDocRef = doc(db, "usuarios", uid);
      const userSnap = await getDoc(userDocRef);

      setCarregando(false);

      if (userSnap.exists()) {
        const dados = userSnap.data();

        // 3. Encaminhamento condicional conforme a role definida
        if (dados.tipo === "aluno") {
          navigation.replace("aluno_home_screen");
        } else if (dados.tipo === "empresa") {
          navigation.replace("empresa_home_screen");
        } else {
          showAlert(
            "Atenção",
            "Tipo de utilizador não reconhecido no sistema.",
          );
        }
      } else {
        showAlert(
          "Perfil em falta",
          "Não foram encontrados os dados cadastrais deste utilizador.",
        );
      }
    } catch (error: any) {
      setCarregando(false);

      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        return showAlert(
          "Acesso recusado",
          "Credenciais ou palavra-passe incorretas.",
        );
      }

      if (error.code === "auth/invalid-email") {
        return showAlert(
          "E-mail inválido",
          "O formato do e-mail introduzido é inválido.",
        );
      }

      if (error.code === "auth/network-request-failed") {
        return showAlert(
          "Falha de ligação",
          "Verifique a sua ligação à Internet.",
        );
      }

      return showAlert(
        "Erro no login",
        error.message || "Ocorreu um erro ao entrar. Tente novamente.",
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
        {/* Logótipo */}
        <View style={styles.headerLogoContainer}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Card Central */}
        <View style={styles.cardContainer}>
          <Text style={styles.title}>ENTRE EM SUA CONTA</Text>

          {/* Campo E-mail / CPF / CNPJ com máscara */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="EMAIL / CPF / CNPJ"
              placeholderTextColor="#A0A0A0"
              value={usuario}
              onChangeText={(text) => setUsuario(formatIdentificador(text))}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Campo Palavra-passe com ícone de visibilidade */}
          <View style={[styles.inputWrapper, styles.passwordWrapper]}>
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

          {/* Botão Entrar */}
          <TouchableOpacity
            style={styles.btnEntrar}
            activeOpacity={0.8}
            onPress={handleLogin}
            disabled={carregando}
          >
            {carregando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.btnEntrarText}>ENTRAR</Text>
            )}
          </TouchableOpacity>

          {/* Separador */}
          <Text style={styles.ouText}>OU</Text>

          {/* Botões Sociais */}
          <TouchableOpacity style={styles.btnSocial} activeOpacity={0.8}>
            <Text style={styles.btnSocialText}>GOOGLE</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnSocial} activeOpacity={0.8}>
            <Text style={styles.btnSocialText}>TEAMS</Text>
          </TouchableOpacity>

          {/* Criar Conta */}
          <Text style={styles.naoTemContaText}>Não tem uma conta?</Text>
          <TouchableOpacity
            style={styles.btnCriarConta}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("Register")}
          >
            <Text style={styles.btnCriarContaText}>CRIE SUA CONTA</Text>
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

      {/* Modal de Alerta */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              activeOpacity={0.8}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
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
    paddingVertical: 30,
    paddingHorizontal: 22,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    color: "#000000",
    textAlign: "center",
    textDecorationLine: "underline",
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    width: "100%",
    backgroundColor: "#ECECEC",
    borderRadius: 30,
    height: 48,
    justifyContent: "center",
    marginBottom: 14,
    paddingHorizontal: 20,
  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  passwordInput: {
    flex: 1,
    paddingRight: 32,
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
  btnEntrar: {
    width: "60%",
    backgroundColor: "#5599FE",
    borderRadius: 30,
    height: 46,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 14,
  },
  btnEntrarText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    textDecorationLine: "underline",
    letterSpacing: 0.5,
  },
  ouText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#000000",
    textDecorationLine: "underline",
    marginBottom: 14,
  },
  btnSocial: {
    width: "90%",
    backgroundColor: "#ECECEC",
    borderRadius: 30,
    height: 46,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  btnSocialText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#000000",
    textDecorationLine: "underline",
    letterSpacing: 0.5,
  },
  naoTemContaText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#000000",
    textDecorationLine: "underline",
    marginTop: 6,
    marginBottom: 10,
  },
  btnCriarConta: {
    width: "90%",
    backgroundColor: "#5599FE",
    borderRadius: 30,
    height: 46,
    justifyContent: "center",
    alignItems: "center",
  },
  btnCriarContaText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    textDecorationLine: "underline",
    letterSpacing: 0.5,
  },
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
    color: "#D32F2F",
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
