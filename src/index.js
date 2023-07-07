import { ChakraProvider } from "@chakra-ui/react";
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import App from "./App";
import { persistor, store } from "./comp/redux/store";
import "./index.css";

import theme from "./theme";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
	<Provider store={store}>
		<PersistGate
			loading={<div>Loading...</div>}
			persistor={persistor}
		>
			<ChakraProvider theme={theme}>
				<App />
			</ChakraProvider>
		</PersistGate>
	</Provider>
);
