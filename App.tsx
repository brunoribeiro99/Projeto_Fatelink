import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import AlunoHomeScreen from "./src/screen/aluno_home_screen";
import EmpresaHomeScreen from "./src/screen/empresa_home_screen";
import LoginScreen from "./src/screen/login_screen";
import RegisterScreen from "./src/screen/register_screen";
import SplashScreen from "./src/screen/splash_screen";
import "./src/service/firebaseConfig";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen
          name="empresa_home_screen"
          component={EmpresaHomeScreen}
        />
        <Stack.Screen name="aluno_home_screen" component={AlunoHomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
