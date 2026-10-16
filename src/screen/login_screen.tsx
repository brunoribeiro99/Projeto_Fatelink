import { useState } from "react";
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function LoginScreen() {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Logotipo FateLink centralizado no topo */}
        <View style={styles.headerLogoContainer}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* 2. Card Branco Central */}
        <View style={styles.cardContainer}>
          <Text style={styles.title}>ENTRE EM SUA CONTA</Text>

          {/* Campo Usuário/Email/CNPJ */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="USUARIO/EMAIL/CNPJ"
              placeholderTextColor="#A0A0A0"
              value={usuario}
              onChangeText={setUsuario}
              autoCapitalize="none"
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
          <TouchableOpacity style={styles.btnEntrar} activeOpacity={0.8}>
            <Text style={styles.btnEntrarText}>ENTRAR</Text>
          </TouchableOpacity>

          {/* Divisor OU */}
          <Text style={styles.ouText}>OU</Text>

          {/* Botão Social GOOGLE */}
          <TouchableOpacity style={styles.btnSocial} activeOpacity={0.8}>
            <Text style={styles.btnSocialText}>GOOGLE</Text>
          </TouchableOpacity>

          {/* Botão Social TEAMS */}
          <TouchableOpacity style={styles.btnSocial} activeOpacity={0.8}>
            <Text style={styles.btnSocialText}>TEAMS</Text>
          </TouchableOpacity>

          {/* Chamada para Criar Conta */}
          <Text style={styles.naoTemContaText}>Não tem uma conta?</Text>
          <TouchableOpacity style={styles.btnCriarConta} activeOpacity={0.8}>
            <Text style={styles.btnCriarContaText}>CRIE SUA CONTA</Text>
          </TouchableOpacity>
        </View>

        {/* 3. Rodapé com os créditos */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerFrom}>From</Text>
          <Text style={styles.footerNames}>
            Bruno, Hugo, Kaique, Rafael e Victor
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#D9D9D9", // Cinza de fundo da tela
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
});