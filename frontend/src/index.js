import { ChakraProvider } from "@chakra-ui/react";
import i18n from 'i18next';
import React from "react";
import ReactDOM from "react-dom/client";
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import App from "./App";
import { persistor, store } from "./comp/redux/store";
import "./index.css";


import theme from "./theme";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: require('./locales/translation.json') },
      ru: { translation: require('./locales/translation.ru.json') }
      // Add more language translations here as needed
    },
    fallbackLng: 'en', // Fallback to English if the user's language is not available
	lng: 'en', // This ensures the initial language is set to English
    debug: true, // Enable debug messages in the console
    interpolation: {
      escapeValue: false, // React already escapes the values
    },
  });

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
	<Provider store={store}>
		<PersistGate
			loading={<div>Loading...</div>}
			persistor={persistor}
		>
			<ChakraProvider theme={theme}>
				<I18nextProvider i18n={i18n}>
					<App />
				</I18nextProvider>
			</ChakraProvider>
		</PersistGate>
	</Provider>
);
