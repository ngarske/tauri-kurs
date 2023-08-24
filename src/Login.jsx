import { useEffect, useState } from "react";
import { supabase } from "./functions/supabaseClient";
import { Auth } from "@supabase/auth-ui-react";
import App from "./App";
import { ThemeMinimal, ThemeSupa } from "@supabase/auth-ui-shared";

export default function Login() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    return (
      <div className="flex items-center justify-center">
        <Auth
          supabaseClient={supabase}
          providers={[]}
          appearance={{ theme: ThemeSupa }}
        />
      </div>
    );
  } else {
    return (
        <App />
    )
  }
}
