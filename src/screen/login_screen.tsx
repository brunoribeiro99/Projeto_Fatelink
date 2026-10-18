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
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../service/firebaseConfig";

const { width } = Dimensions.get("window");

export default function LoginScreen({ navigation }: any) {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
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
    if (!usuario.trim()) {
      return showAlert("Campo obrigatório", "Por favor, digite seu e-mail.");
    }

    if (!senha) {
      return showAlert("Campo obrigatório", "Por favor, digite sua senha.");
    }

    try {
      setCarregando(true);

      // 1. Autentica no Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(
        auth,
        usuario.trim().toLowerCase(),
        senha,
      );

      const uid = userCredential.user.uid;

      // 2. Busca o documento com o tipo do usuário no Firestore
      const userDocRef = doc(db, "usuarios", uid);
      const userSnap = await getDoc(userDocRef);

      setCarregando(false);

      if (userSnap.exists()) {
        const dados = userSnap.data();

        // 3. Roteamento condicional baseado no tipo
        if (dados.tipo === "aluno") {
          navigation.replace("aluno_dashboard_home");
        } else if (dados.tipo === "empresa") {
          navigation.replace("empresa_dashboard_home");
        } else {
          showAlert("Atenção", "Tipo de usuário não identificado no sistema.");
        }
      } else {
        showAlert(
          "Perfil não encontrado",
          "Não encontramos dados cadastrais para este usuário.",
        );
      }
    } catch (error: any) {
      setCarregando(false);

      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        return showAlert("Acesso negado", "E-mail ou senha incorretos.");
      }

      if (error.code === "auth/invalid-email") {
        return showAlert("E-mail inválido", "O formato do e-mail é inválido.");
      }

      if (error.code === "auth/network-request-failed") {
        return showAlert(
          "Sem conexão",
          "Verifique sua conexão com a internet.",
        );
      }

      return showAlert(
        "Erro no login",
        error.message || "Ocorreu um erro ao acessar a conta. Tente novamente.",
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
        {/* 1. Logotipo centralizado no topo */}
        <View style={styles.headerLogoContainer}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* 2. Card Central */}
        <View style={styles.cardContainer}>
          <Text style={styles.title}>ENTRE EM SUA CONTA</Text>

          {/* Campo E-mail */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="EMAIL"
              placeholderTextColor="#A0A0A0"
              value={usuario}
              onChangeText={setUsuario}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {/* Campo Senha */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="SENHA"
              placeholderTextColor="#A0A0A0"
              secureTextEntry
              value={senha}
              onChangeText={setSenha}
            />
          </View>

          {/* Botão ENTRAR */}
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

          {/* Divisor OU */}
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

        {/* 3. Rodapé com os nomes */}
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
