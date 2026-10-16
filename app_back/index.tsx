import { useRouter } from "expo-router";
import SplashScreen from "../src/screen/splash_screen";

export default function Index() {
  const router = useRouter();

  return (
    <SplashScreen
      onFinish={() => {
        router.replace("../screen/login_screen");
      }}
    />
  );
}
