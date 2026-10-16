import { useEffect } from "react";
import { Dimensions, Image, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

interface SplashScreenProps {
  navigation?: any;
  onFinish?: () => void;
}

export default function SplashScreen({
  navigation,
  onFinish,
}: SplashScreenProps) {
  // 1. Círculo 01: rola da esquerda para o centro no sentido dos ponteiros do relógio
  const circle1TranslateX = useSharedValue(-width * 0.4);
  const circle1Rotate = useSharedValue(0);
  const circle1Opacity = useSharedValue(0);

  // 2. Círculo 02: arranca com atraso e roda no sentido anti-horário
  const circle2Rotate = useSharedValue(0);
  const circle2Opacity = useSharedValue(0);

  // 3. Seta e Logo: descem após o início dos círculos
  const setaTranslateY = useSharedValue(-height * 0.45);
  const setaOpacity = useSharedValue(0);

  const logoTranslateY = useSharedValue(-220);
  const logoOpacity = useSharedValue(0);

  useEffect(() => {
    // Passo 1: Círculo 01 entra a rolar como uma roda
    circle1Opacity.value = withTiming(1, { duration: 300 });
    circle1TranslateX.value = withSpring(0, {
      damping: 15,
      stiffness: 75,
    });
    circle1Rotate.value = withTiming(360, {
      duration: 1400,
      easing: Easing.out(Easing.cubic),
    });

    // Passo 2: Círculo 02 inicia a rotação no sentido inverso logo a seguir (após 350ms)
    circle2Opacity.value = withDelay(350, withTiming(1, { duration: 400 }));
    circle2Rotate.value = withDelay(
      350,
      withTiming(-360, {
        duration: 1300,
        easing: Easing.out(Easing.cubic),
      }),
    );

    // Passo 3: Seta desce após os círculos começarem a posicionar-se (após 700ms)
    setaOpacity.value = withDelay(700, withTiming(1, { duration: 400 }));
    setaTranslateY.value = withDelay(
      700,
      withSpring(0, {
        damping: 14,
        stiffness: 70,
      }),
    );

    // Passo 4: Logo desce junto com a seta
    logoOpacity.value = withDelay(750, withTiming(1, { duration: 400 }));
    logoTranslateY.value = withDelay(
      750,
      withSpring(0, {
        damping: 13,
        stiffness: 80,
      }),
    );

    // Transição automática para a tela de Login
    const timer = setTimeout(() => {
      if (navigation) {
        navigation.replace("Login");
      } else if (onFinish) {
        onFinish();
      }
    }, 2800);

    return () => clearTimeout(timer);
  }, [navigation, onFinish]);

  // Estilos animados do Círculo 01
  const animatedCircle1Style = useAnimatedStyle(() => ({
    opacity: circle1Opacity.value,
    transform: [
      { translateX: circle1TranslateX.value },
      { rotate: `${circle1Rotate.value}deg` },
    ],
  }));

  // Estilos animados do Círculo 02
  const animatedCircle2Style = useAnimatedStyle(() => ({
    opacity: circle2Opacity.value,
    transform: [{ rotate: `${circle2Rotate.value}deg` }],
  }));

  // Estilos animados da Seta (fundo)
  const animatedSetaStyle = useAnimatedStyle(() => ({
    opacity: setaOpacity.value,
    transform: [{ translateY: setaTranslateY.value }],
  }));

  // Estilos animados da Logo
  const animatedLogoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: logoTranslateY.value }],
  }));

  return (
    <View style={styles.container}>
      {/* CAMADA 1 (FUNDO): Seta que conecta na lateral */}
      <Animated.View style={[styles.setaContainer, animatedSetaStyle]}>
        <Image
          source={require("../../assets/images/seta.png")}
          style={styles.setaImage}
          resizeMode="cover"
        />
      </Animated.View>

      {/* CAMADA 2 (INTERMÉDIA): Círculos sobrepostos no lado esquerdo */}
      <View style={styles.circlesArea}>
        {/* Círculo 01: roda exterior */}
        <Animated.View style={[styles.circleWrapper, animatedCircle1Style]}>
          <Image
            source={require("../../assets/images/circulo 01.png")}
            style={styles.circle1Image}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Círculo 02: roda interior invertida */}
        <Animated.View style={[styles.circleWrapper, animatedCircle2Style]}>
          <Image
            source={require("../../assets/images/circulo 02.png")}
            style={styles.circle2Image}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      {/* CAMADA 3 (TOPO): Logo FateLink ampliada */}
      <Animated.View style={[styles.logoContainer, animatedLogoStyle]}>
        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </Animated.View>

      {/* CAMADA 4 (RODAPÉ): Créditos em ordem alfabética */}
      <View style={styles.footerContainer}>
        <Text style={styles.footerFrom}>From</Text>
        <Text style={styles.footerNames}>
          Bruno, Hugo, Kaique, Rafael e Victor
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#B1D9FF",
    overflow: "hidden",
  },
  setaContainer: {
    position: "absolute",
    top: height * 0.13,
    left: 0,
    width: width,
    height: height * 0.58,
    zIndex: 1,
  },
  setaImage: {
    width: "100%",
    height: "100%",
  },
  circlesArea: {
    position: "absolute",
    top: height * 0.22,
    left: -width * 0.32,
    width: width * 0.98,
    height: width * 0.98,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  circleWrapper: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  circle1Image: {
    width: "100%",
    height: "100%",
  },
  circle2Image: {
    width: "70%",
    height: "70%",
  },
  logoContainer: {
    position: "absolute",
    top: height * 0.07,
    alignSelf: "center",
    zIndex: 10,
  },
  logoImage: {
    width: width * 0.85,
    height: 150,
  },
  footerContainer: {
    position: "absolute",
    bottom: 28,
    alignSelf: "center",
    alignItems: "center",
    zIndex: 10,
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
